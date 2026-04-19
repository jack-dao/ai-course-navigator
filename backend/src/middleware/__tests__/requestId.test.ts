import { describe, it, expect, vi } from 'vitest';
import requestId from '../requestId';
import type { Request, Response, NextFunction } from 'express';

function createMocks(headers: Record<string, string> = {}) {
  const req = { headers: { ...headers } } as unknown as Request;
  const res = { setHeader: vi.fn() } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('requestId middleware', () => {
  it('generates a UUID when no x-request-id header exists', () => {
    const { req, res, next } = createMocks();
    requestId(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(typeof req.headers['x-request-id']).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.headers['x-request-id']);
    expect(next).toHaveBeenCalled();
  });

  it('preserves existing x-request-id header', () => {
    const { req, res, next } = createMocks({ 'x-request-id': 'existing-id-123' });
    requestId(req, res, next);

    expect(req.headers['x-request-id']).toBe('existing-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'existing-id-123');
    expect(next).toHaveBeenCalled();
  });
});
