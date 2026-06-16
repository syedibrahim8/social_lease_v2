import winston from 'winston';
import { env, isProduction } from '@/config/env';

/**
 * Centralised Winston logger.
 *
 * - Development: human-readable, colourised console output.
 * - Production: structured single-line JSON (easy for log aggregators such as
 *   Datadog / ELK / CloudWatch to parse), plus persisted error/combined files.
 *
 * Use this logger everywhere instead of `console.*`. The ESLint config warns on
 * raw `console` usage to enforce that.
 */

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf((info) => {
    const { timestamp: ts, level, message, stack, ...meta } = info;
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const detail =
      typeof stack === 'string'
        ? stack
        : typeof message === 'string'
          ? message
          : JSON.stringify(message);
    return `${String(ts)} ${level}: ${detail}${metaString}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports: winston.transport[] = [
  new winston.transports.Console({
    // Never write logs to stdout during tests — keeps test output clean.
    silent: env.NODE_ENV === 'test',
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: winston.config.npm.levels,
  format: isProduction ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});

/** A minimal write-stream adapter so HTTP-access logs can flow through Winston. */
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
