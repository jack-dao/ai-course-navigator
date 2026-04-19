import { describe, it, expect, vi } from 'vitest';
import { ZodError, ZodIssue } from 'zod';
import errorHandler from '../errorHandler';
import type { Request, Response, NextFunction } from 'express';

function createMocks() {
  const req = {
    method: 'POST',
    path: '/api/test',
    headers: { 'x-request-id': 'test-req-id' },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('errorHandler middleware', () => {
  it('returns 400 with details for ZodError', () => {
    const { req, res, next } = createMocks();
    const zodError = new ZodError([
      {
        path: ['email'],
        message: 'Invalid email',
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
      } as ZodIssue,
    ]);

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: [{ path: 'email', message: 'Invalid email' }],
    });
  });

  it('returns 500 for generic errors', () => {
    const { req, res, next } = createMocks();
    errorHandler(new Error('Something broke'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'test-req-id' }));
  });

  it('includes requestId in error response', () => {
    const { req, res, next } = createMocks();
    errorHandler(new Error('fail'), req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.requestId).toBe('test-req-id');
  });

  it('includes error message and stack in dev mode (non-production)', () => {
    const { req, res, next } = createMocks();
    errorHandler(new Error('Debug info'), req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.error).toBe('Debug info');
    expect(jsonCall.stack).toBeDefined();
  });

  it('uses "unknown" when no x-request-id header', () => {
    const req = { method: 'GET', path: '/', headers: {} } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(new Error('fail'), req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.requestId).toBe('unknown');
  });
});
