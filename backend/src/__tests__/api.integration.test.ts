import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock prisma for all integration tests
vi.mock('../lib/prisma', () => ({
  default: {
    course: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { id: 1, code: 'CSE101', name: 'Intro CS', credits: 5, geCode: null, term: '2026 Spring', sections: [] },
        ]),
      findUnique: vi.fn().mockResolvedValue({ description: 'A course', prerequisites: 'None' }),
    },
    professor: {
      findMany: vi.fn().mockResolvedValue([
        {
          name: 'Smith',
          avgRating: 4.5,
          avgDifficulty: 2.0,
          wouldTakeAgain: '90%',
          numRatings: 50,
          rmpLink: null,
          reviews: [],
        },
      ]),
    },
    schedule: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

import app from '../app';

describe('API Integration Tests', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });

    it('includes X-Request-Id header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('includes security headers from helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('GET /api/courses', () => {
    it('returns 200 with course list', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('accepts term query parameter', async () => {
      const res = await request(app).get('/api/courses?term=2026%20Spring');
      expect(res.status).toBe(200);
    });

    it('sets cache-control header', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.headers['cache-control']).toContain('max-age');
    });
  });

  describe('GET /api/courses/:id/description', () => {
    it('returns 200 with description and prerequisites', async () => {
      const res = await request(app).get('/api/courses/1/description');
      expect(res.status).toBe(200);
      expect(res.body.description).toBeDefined();
      expect(res.body.prerequisites).toBeDefined();
    });

    it('returns 400 for non-numeric id', async () => {
      const res = await request(app).get('/api/courses/abc/description');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/ratings', () => {
    it('returns 200 with ratings map', async () => {
      const res = await request(app).get('/api/ratings');
      expect(res.status).toBe(200);
      expect(res.body['Smith']).toBeDefined();
      expect(res.body['Smith'].avgRating).toBe(4.5);
    });
  });

  describe('GET /api/schedules', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/schedules');
      expect(res.status).toBe(401);
    });

    it('returns 403 with invalid token', async () => {
      const res = await request(app).get('/api/schedules').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/schedules', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).post('/api/schedules').send({ name: 'Test', courses: [] });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/chat', () => {
    it('returns 500 for empty message (chat catches all errors internally)', async () => {
      const res = await request(app).post('/api/chat').send({ message: '' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });

    it('returns 500 for missing message field', async () => {
      const res = await request(app).post('/api/chat').send({});
      expect(res.status).toBe(500);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
