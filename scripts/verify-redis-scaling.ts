/**
 * Verify multi-instance behaviour with Redis: two real API processes, one Redis.
 *
 *   REDIS_URL=redis://127.0.0.1:6379 pnpm tsx scripts/verify-redis-scaling.ts
 *
 * Starts two `src/server.ts` processes on separate ports sharing REDIS_URL and
 * the Atlas database, then checks that:
 *   - the global rate limit is ONE counter across both instances;
 *   - a notification created on instance A reaches an SSE client on B;
 *   - the reconciler lock is granted to one holder at a time.
 * Test users are namespaced and deleted in `finally`.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { Redis } from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { acquireLock } from '@/config/lock';
import { closeRedis } from '@/config/redis';
import { UserModel } from '@/modules/users/user.model';
import {
  NotificationModel,
  NotificationPreferenceModel,
} from '@/modules/notifications/notification.model';

const EMAIL = `redis-scale-${Date.now()}@test.local`;
const PASSWORD = 'RedisScale123!';
const PORT_A = 18181;
const PORT_B = 18182;
const LIMIT = 40;

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) passed += 1;
  else failed += 1;
  logger[ok ? 'info' : 'error'](`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const base = (port: number): string => `http://127.0.0.1:${port}${env.API_PREFIX}`;

function startInstance(port: number): ChildProcess {
  const child = spawn(path.join(process.cwd(), 'node_modules/.bin/tsx'), ['src/server.ts'], {
    env: {
      ...process.env,
      PORT: String(port),
      RATE_LIMIT_MAX: String(LIMIT),
      RATE_LIMIT_WINDOW_MS: '120000',
      PAYMENT_RECONCILE_INTERVAL_MS: '0',
      LOG_LEVEL: 'warn',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr?.on('data', (d: Buffer) => logger.debug(`[${port}] ${d.toString().trim()}`));
  return child;
}

async function waitForHealth(port: number): Promise<void> {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`${base(port)}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`instance on ${port} did not become healthy`);
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function main(): Promise<void> {
  if (!env.REDIS_URL) throw new Error('Set REDIS_URL to run this check');
  await connectDatabase();
  const flush = new Redis(env.REDIS_URL);
  await flush.flushdb();

  const a = startInstance(PORT_A);
  const b = startInstance(PORT_B);
  try {
    await Promise.all([waitForHealth(PORT_A), waitForHealth(PORT_B)]);
    check('two instances are up on one Redis', true);

    // ── Rate limit is shared ────────────────────────────────────────────────
    await flush.flushdb();
    const statuses: number[] = [];
    for (let i = 0; i < LIMIT + 2; i += 1) {
      const port = i % 2 === 0 ? PORT_A : PORT_B;
      statuses.push((await fetch(`${base(port)}/health`)).status);
    }
    const firstLimited = statuses.indexOf(429);
    check(
      'the global limit is one counter across both instances',
      firstLimited === LIMIT,
      `first 429 at request ${firstLimited + 1} of ${statuses.length}, limit ${LIMIT}`
    );
    await flush.flushdb();

    // ── SSE fan-out: create on A, receive on B ─────────────────────────────
    const reg = await fetch(`${base(PORT_A)}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Redis Scale',
        email: EMAIL,
        password: PASSWORD,
        role: 'CREATOR',
      }),
    });
    check('a test user registers on instance A', reg.status === 201, String(reg.status));
    await UserModel.updateOne({ email: EMAIL }, { $set: { role: 'ADMIN', isVerified: true } });
    const login = await json<{ data: { accessToken: string; user: { id: string } } }>(
      await fetch(`${base(PORT_A)}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      })
    );
    const token = login.data.accessToken;
    const userId = login.data.user.id;

    const controller = new AbortController();
    const stream = await fetch(`${base(PORT_B)}/notifications/stream`, {
      headers: { authorization: `Bearer ${token}`, accept: 'text/event-stream' },
      signal: controller.signal,
    });
    check('an SSE stream opens on instance B', stream.ok, String(stream.status));
    const reader = stream.body?.getReader();
    const decoder = new TextDecoder();
    let received = '';
    const receivedTitle = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 15_000);
      const pump = async (): Promise<void> => {
        for (;;) {
          const chunk = await reader?.read().catch(() => undefined);
          if (!chunk || chunk.done) return;
          received += decoder.decode(chunk.value, { stream: true });
          if (received.includes('Fan-out check')) {
            clearTimeout(timeout);
            resolve(true);
            return;
          }
        }
      };
      void pump();
    });

    await new Promise((r) => setTimeout(r, 500)); // let B finish registering the client
    const broadcast = await fetch(`${base(PORT_A)}/notifications/broadcast`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Fan-out check', body: 'Sent on A.', userIds: [userId] }),
    });
    check('instance A accepts the notification', broadcast.ok, String(broadcast.status));
    check('the SSE client on instance B receives it', await receivedTitle);
    controller.abort();

    // ── Lock ────────────────────────────────────────────────────────────────
    const first = await acquireLock('verify-redis-scaling', 5_000);
    const second = await acquireLock('verify-redis-scaling', 5_000);
    check('the reconciler lock has one holder at a time', first && !second);
  } finally {
    a.kill('SIGTERM');
    b.kill('SIGTERM');
    const user = await UserModel.findOne({ email: EMAIL }).lean();
    if (user) {
      await NotificationModel.deleteMany({ userId: user._id });
      await NotificationPreferenceModel.deleteMany({ userId: user._id });
      await UserModel.deleteOne({ _id: user._id });
    }
    await flush.flushdb();
    await flush.quit();
    await closeRedis();
    await disconnectDatabase();
    logger.info(`verify-redis-scaling: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  logger.error('verify-redis-scaling crashed', {
    error: error instanceof Error ? error.stack : error,
  });
  process.exitCode = 1;
});
