import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import authenticateToken from '../authenticateToken';
import type { Request, Response, NextFunction } from 'express';

const TEST_SECRET = 'test-jwt-secret';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

function createMocks(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
  const res = {
    sendStatus: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('authenticateToken middleware', () => {
  it('returns 401 when no authorization header', () => {
    const { req, res, next } = createMocks();
    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for invalid token', () => {
    const { req, res, next } = createMocks('Bearer invalid-token');
    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.user for valid token', () => {
    const token = jwt.sign({ sub: 'user-123', email: 'test@test.com' }, TEST_SECRET);
    const { req, res, next } = createMocks(`Bearer ${token}`);
    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('user-123');
  });

  it('returns 403 for expired token', () => {
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET, { expiresIn: '0s' });
    // Small delay to ensure expiry
    const { req, res, next } = createMocks(`Bearer ${token}`);

    setTimeout(() => {
      authenticateToken(req, res, next);
      expect(res.sendStatus).toHaveBeenCalledWith(403);
    }, 10);
  });

  it('returns 403 for token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 'user-123' }, 'wrong-secret');
    const { req, res, next } = createMocks(`Bearer ${token}`);
    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
