/**
 * Logger Configuration
 * Pino logger setup with pretty printing in development
 */

import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logging.level,
  transport:
    config.server.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
