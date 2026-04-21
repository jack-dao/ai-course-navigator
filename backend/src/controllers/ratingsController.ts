import logger from '../lib/logger';
import { fetchRatingsMap } from '../services/ratingsService';
import type { Request, Response } from 'express';

const getRatings = async (req: Request, res: Response): Promise<void> => {
  logger.info('Fetching ratings from DB...');

  const ratingsMap = await fetchRatingsMap();

  logger.info(`Served ratings for ${Object.keys(ratingsMap).length} professors.`);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(ratingsMap);
};

export { getRatings };
