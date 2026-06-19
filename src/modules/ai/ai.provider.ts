import { env } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * AI provider adapter — the single seam over the LLM vendor.
 *
 * Uses the OpenAI Chat Completions REST API via `fetch` (no SDK dependency).
 * Swapping vendors (Claude, etc.) means changing only this file. Lazy + optional:
 * with no `OPENAI_API_KEY` the deterministic service cores still run and the LLM
 * enrichment degrades gracefully (`tryInsight` → null, brief → template).
 */

const TIMEOUT_MS = 30_000;

export function isAiConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

interface ChatOptions {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

async function chat(opts: ChatOptions): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI is not configured');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
        temperature: opts.temperature ?? 0.7,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI request failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty completion');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export const aiProvider = {
  isConfigured: isAiConfigured,

  /** Structured (JSON-mode) generation. Throws if unconfigured or on parse error. */
  async generateJson<T>(system: string, user: string): Promise<T> {
    const raw = await chat({ system, user, json: true, temperature: 0.5 });
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  },

  /** Free-text generation. Throws if unconfigured. */
  generateText(system: string, user: string): Promise<string> {
    return chat({ system, user });
  },

  /**
   * Best-effort enrichment for the deterministic services: returns a short text,
   * or `null` if AI is unconfigured or the call fails — never throws, so it can't
   * break the primary (deterministic) result.
   */
  async tryInsight(system: string, user: string): Promise<string | null> {
    if (!isAiConfigured()) return null;
    try {
      const text = await chat({ system, user, temperature: 0.4, maxTokens: 220 });
      return text.trim();
    } catch (error) {
      logger.warn('AI insight generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },
};

export type AiProvider = typeof aiProvider;
