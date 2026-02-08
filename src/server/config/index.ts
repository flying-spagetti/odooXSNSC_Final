/**
 * Configuration Module
 * Centralized configuration management
 */

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/subs_manager',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  billing: {
    defaultDueDays: 30,
  },
  ai: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    summarizationModel: process.env.SUMMARIZATION_MODEL || '',
  },
};
