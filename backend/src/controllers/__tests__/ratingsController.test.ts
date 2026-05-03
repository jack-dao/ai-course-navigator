import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../services/ratingsService', () => ({
  fetchRatingsMap: vi.fn(),
}));

import { getRatings } from '../ratingsController';
import { fetchRatingsMap } from '../../services/ratingsService';

const mockFetchRatingsMap = fetchRatingsMap as ReturnType<typeof vi.fn>;

function createMocks() {
  const req = {} as unknown as Request;
  const res = {
    set: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  return { req, res };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ratingsController', () => {
  it('returns ratings map with cache header', async () => {
    const ratingsData = {
      Smith: { avgRating: 4.5, avgDifficulty: 2.0, wouldTakeAgain: '90%', numRatings: 50, rmpLink: null, reviews: [] },
    };
    mockFetchRatingsMap.mockResolvedValue(ratingsData);

    const { req, res } = createMocks();
    await getRatings(req, res);

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    expect(res.json).toHaveBeenCalledWith(ratingsData);
  });

  it('returns empty object when no professors', async () => {
    mockFetchRatingsMap.mockResolvedValue({});

    const { req, res } = createMocks();
    await getRatings(req, res);

    expect(res.json).toHaveBeenCalledWith({});
  });
});
