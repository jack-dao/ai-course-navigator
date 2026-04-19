import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  default: {
    professor: { findMany: vi.fn() },
  },
}));

import { fetchRatingsMap } from '../ratingsService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  professor: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ratingsService', () => {
  describe('fetchRatingsMap', () => {
    it('returns a map keyed by professor name', async () => {
      mockPrisma.professor.findMany.mockResolvedValue([
        {
          name: 'Alice Smith',
          avgRating: 4.5,
          avgDifficulty: 2.0,
          wouldTakeAgain: '90%',
          numRatings: 50,
          rmpLink: 'https://rmp.com/alice',
          reviews: [{ comment: 'Great!' }],
        },
      ]);

      const result = await fetchRatingsMap();

      expect(result['Alice Smith']).toBeDefined();
      expect(result['Alice Smith'].avgRating).toBe(4.5);
      expect(result['Alice Smith'].numRatings).toBe(50);
      expect(result['Alice Smith'].reviews).toHaveLength(1);
    });

    it('returns empty map when no professors exist', async () => {
      mockPrisma.professor.findMany.mockResolvedValue([]);

      const result = await fetchRatingsMap();
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('defaults missing values to 0 or N/A', async () => {
      mockPrisma.professor.findMany.mockResolvedValue([
        {
          name: 'Unknown Prof',
          avgRating: null,
          avgDifficulty: null,
          wouldTakeAgain: null,
          numRatings: null,
          rmpLink: null,
          reviews: null,
        },
      ]);

      const result = await fetchRatingsMap();
      expect(result['Unknown Prof'].avgRating).toBe(0);
      expect(result['Unknown Prof'].avgDifficulty).toBe(0);
      expect(result['Unknown Prof'].wouldTakeAgain).toBe('N/A');
      expect(result['Unknown Prof'].numRatings).toBe(0);
      expect(result['Unknown Prof'].reviews).toEqual([]);
    });
  });
});
