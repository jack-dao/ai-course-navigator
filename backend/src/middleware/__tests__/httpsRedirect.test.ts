import { describe, it, expect, vi } from 'vitest';
import httpsRedirect from '../httpsRedirect';
import type { Request, Response, NextFunction } from 'express';

function createMocks(proto: string = 'https', host: string = 'example.com', url: string = '/api/test') {
  const req = {
    headers: { 'x-forwarded-proto': proto, host },
    url,
  } as unknown as Request;
  const res = {
    redirect: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('httpsRedirect middleware', () => {
  it('redirects HTTP to HTTPS with 301', () => {
    const { req, res, next } = createMocks('http', 'example.com', '/api/test');
    httpsRedirect(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/api/test');
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through HTTPS requests', () => {
    const { req, res, next } = createMocks('https');
    httpsRedirect(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('passes through when no x-forwarded-proto header', () => {
    const req = { headers: {}, url: '/' } as unknown as Request;
    const res = { redirect: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;

    httpsRedirect(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
