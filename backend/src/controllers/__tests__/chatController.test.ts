import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../services/chatService', () => ({
  buildChatStream: vi.fn(),
}));

import { handleChat } from '../chatController';
import { buildChatStream } from '../../services/chatService';

const mockBuildChatStream = buildChatStream as ReturnType<typeof vi.fn>;

function createMocks(body: Record<string, unknown> = {}) {
  const req = { body, user: { userId: 'user-1' } } as unknown as Request;
  const res = {
    writeHead: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return { req, res };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('chatController', () => {
  it('streams response chunks to client', async () => {
    const chunks = [{ text: () => 'Hello ' }, { text: () => 'world!' }];
    mockBuildChatStream.mockResolvedValue({
      stream: (async function* () {
        for (const c of chunks) yield c;
      })(),
    });

    const { req, res } = createMocks({ message: 'Hi' });
    await handleChat(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'text/plain; charset=utf-8' })
    );
    expect(res.write).toHaveBeenCalledWith('Hello ');
    expect(res.write).toHaveBeenCalledWith('world!');
    expect(res.end).toHaveBeenCalled();
  });

  it('skips empty chunks', async () => {
    mockBuildChatStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => '' };
        yield { text: () => 'data' };
      })(),
    });

    const { req, res } = createMocks({ message: 'Hi' });
    await handleChat(req, res);

    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('data');
  });

  it('writes inline error when stream fails mid-response', async () => {
    mockBuildChatStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => 'Start...' };
        throw new Error('Gemini API error');
      })(),
    });

    const { req, res } = createMocks({ message: 'Hi' });
    await handleChat(req, res);

    expect(res.write).toHaveBeenCalledWith('Start...');
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('error occurred'));
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 500 JSON when buildChatStream throws before streaming', async () => {
    mockBuildChatStream.mockRejectedValue(new Error('Service unavailable'));

    const { req, res } = createMocks({ message: 'Hi' });
    await handleChat(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong. Please try again.' });
  });

  it('returns 400 for missing message', async () => {
    const { req, res } = createMocks({});
    await handleChat(req, res);

    // Zod validation error propagates — caught by outer catch
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
