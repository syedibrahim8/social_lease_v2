import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from '@/config/env';
import { apiRouter } from '@/routes';
import { requestContext } from '@/middleware/requestContext.middleware';
import { rateLimiter } from '@/middleware/rateLimiter.middleware';
import { notFound } from '@/middleware/notFound.middleware';
import { errorHandler } from '@/middleware/error.middleware';
import { ApiError } from '@/utils/ApiError';
import { stripeWebhookHandler } from '@/modules/payments/payment.webhook';

/**
 * Builds and configures the Express application.
 *
 * Middleware ordering is deliberate and matters:
 *   1. trust proxy        — correct client IPs behind a load balancer.
 *   2. requestContext     — assign correlation id + access logging (first, so
 *                           every subsequent log line is traceable).
 *   3. security/parsing   — helmet, cors, body/cookie parsers, compression.
 *   4. rate limiter       — before routes so abusive traffic is shed early.
 *   5. routes             — the actual API surface.
 *   6. notFound           — catch unmatched paths.
 *   7. errorHandler       — LAST; the single exit point for all errors.
 *
 * The app is exported separately from the HTTP server so it can be imported
 * directly by integration tests without binding a port.
 */
export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (needed for correct IPs + rate limiting on PaaS).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Correlation id + access logging.
  app.use(requestContext);

  // Security headers.
  app.use(helmet());

  // CORS — restricted to the configured origins, with credentials for cookies.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header) such as curl / health probes.
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(ApiError.forbidden(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  // Stripe webhook MUST receive the raw body for signature verification, so it
  // is mounted with express.raw BEFORE the JSON parser (which would otherwise
  // consume and re-serialize the stream, breaking the signature).
  app.post(
    `${env.API_PREFIX}/payments/webhook`,
    express.raw({ type: 'application/json' }),
    stripeWebhookHandler
  );

  // Body & cookie parsing, with a sane size limit to blunt large-payload abuse.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Response compression.
  app.use(compression());

  // Throttle abusive traffic before it reaches route handlers.
  app.use(rateLimiter);

  // Mount the versioned API.
  app.use(env.API_PREFIX, apiRouter);

  // 404 for anything unmatched, then the global error handler (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
