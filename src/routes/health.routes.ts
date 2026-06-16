import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { env } from '@/config/env';

const router = Router();

const MONGO_STATE: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * GET /health — liveness + readiness probe.
 * Returns process uptime and the current MongoDB connection state. Useful for
 * load balancers, container orchestrators, and uptime monitors.
 */
router.get(
  '/health',
  asyncHandler((_req, res) => {
    const dbState = MONGO_STATE[mongoose.connection.readyState] ?? 'unknown';

    return ApiResponse.ok(
      res,
      {
        status: 'ok',
        environment: env.NODE_ENV,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        database: dbState,
      },
      'Service is healthy'
    );
  })
);

export { router as healthRouter };
