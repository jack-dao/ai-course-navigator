import logger from '../lib/logger';

const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'] as const;

export function validateEnv(): void {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
