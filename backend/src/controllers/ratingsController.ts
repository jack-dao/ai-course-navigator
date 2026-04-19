import prisma from '../lib/prisma';
import logger from '../lib/logger';
import type { Request, Response } from 'express';

const getRatings = async (req: Request, res: Response): Promise<void> => {
  logger.info('Fetching ratings from DB...');

  const professors = await prisma.professor.findMany({
    select: {
      name: true,
      avgRating: true,
      avgDifficulty: true,
      wouldTakeAgain: true,
      numRatings: true,
      rmpLink: true,
      reviews: true,
    },
  });

  const ratingsMap: Record<string, {
    avgRating: number;
    avgDifficulty: number;
    wouldTakeAgain: string | number;
    numRatings: number;
    rmpLink: string | null;
    reviews: unknown[];
  }> = {};

  professors.forEach((prof) => {
    ratingsMap[prof.name] = {
      avgRating: prof.avgRating || 0,
      avgDifficulty: prof.avgDifficulty || 0,
      wouldTakeAgain: prof.wouldTakeAgain || 'N/A',
      numRatings: prof.numRatings || 0,
      rmpLink: prof.rmpLink,
      reviews: (prof.reviews as unknown[]) || [],
    };
  });

  logger.info(`Served ratings for ${Object.keys(ratingsMap).length} professors.`);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(ratingsMap);
};

export { getRatings };
