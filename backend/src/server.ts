import 'dotenv/config';

import { validateEnv } from './config/env';
validateEnv();

import logger from './lib/logger';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
