import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  default: {
    course: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../config/gemini', () => ({
  geminiModel: {
    generateContentStream: vi.fn(),
  },
}));

import { buildChatStream } from '../chatService';
import prisma from '../../lib/prisma';
import { geminiModel } from '../../config/gemini';

const mockPrisma = prisma as unknown as {
  course: { findMany: ReturnType<typeof vi.fn> };
};
const mockGemini = geminiModel as unknown as {
  generateContentStream: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.course.findMany.mockResolvedValue([
    {
      code: 'CSE 101',
      name: 'Algorithms',
      credits: 5,
      geCode: null,
      prerequisites: 'CSE 30',
      sections: [{ instructor: 'Smith', days: 'MWF', startTime: '10:00AM', endTime: '11:00AM', status: 'Open' }],
    },
  ]);
  mockGemini.generateContentStream.mockResolvedValue({ stream: [] });
});

describe('chatService', () => {
  describe('buildChatStream', () => {
    it('filters courses by department when mentioned in message', async () => {
      await buildChatStream('What CSE classes should I take?', '2026 Spring');

      const whereClause = mockPrisma.course.findMany.mock.calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR.some((c: Record<string, unknown>) => JSON.stringify(c).includes('CSE'))).toBe(true);
    });

    it('filters courses by GE code when mentioned', async () => {
      await buildChatStream('I need an MF class', '2026 Spring');

      const whereClause = mockPrisma.course.findMany.mock.calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR.some((c: Record<string, unknown>) => JSON.stringify(c).includes('MF'))).toBe(true);
    });

    it('filters by specific course code when mentioned', async () => {
      await buildChatStream('Tell me about CSE 101', '2026 Spring');

      const whereClause = mockPrisma.course.findMany.mock.calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR.some((c: Record<string, unknown>) => JSON.stringify(c).includes('CSE 101'))).toBe(true);
    });

    it('falls back to keyword search when no department/GE mentioned', async () => {
      await buildChatStream('linear algebra prerequisites', '2026 Spring');

      const whereClause = mockPrisma.course.findMany.mock.calls[0][0].where;
      // When no department or GE code is found, should still build a query
      // (either keyword-based OR or plain term filter)
      expect(whereClause.term).toBe('2026 Spring');
      // Keywords "linear", "algebra", "prerequisites" should produce OR conditions
      if (whereClause.OR) {
        expect(whereClause.OR.length).toBeGreaterThan(0);
      }
    });

    it('passes user message as separate user turn, not in system prompt', async () => {
      await buildChatStream('What are the easiest GEs?', '2026 Spring');

      const call = mockGemini.generateContentStream.mock.calls[0][0];
      // Should use structured request, not a plain string
      expect(call.contents).toBeDefined();
      expect(call.systemInstruction).toBeDefined();
      // User message should be in contents, not system instruction
      const userContent = call.contents.find((c: { role: string }) => c.role === 'user');
      expect(userContent.parts[0].text).toBe('What are the easiest GEs?');
      // System instruction should NOT contain the user message
      expect(call.systemInstruction.parts[0].text).not.toContain('What are the easiest GEs?');
    });

    it('includes conversation history in contents', async () => {
      const history = [
        { role: 'user' as const, text: 'Hello' },
        { role: 'assistant' as const, text: 'Hi! How can I help?' },
      ];
      await buildChatStream('What fits my schedule?', '2026 Spring', [], history);

      const call = mockGemini.generateContentStream.mock.calls[0][0];
      expect(call.contents).toHaveLength(3); // 2 history + 1 new message
      expect(call.contents[0].parts[0].text).toBe('Hello');
      expect(call.contents[1].role).toBe('model');
      expect(call.contents[2].parts[0].text).toBe('What fits my schedule?');
    });

    it('includes schedule context in system instruction', async () => {
      const schedule = [{ code: 'CSE 101', name: 'Algorithms', days: 'MWF', times: '10-11AM' }];
      await buildChatStream('What fits?', '2026 Spring', schedule);

      const call = mockGemini.generateContentStream.mock.calls[0][0];
      expect(call.systemInstruction.parts[0].text).toContain('CSE 101');
      expect(call.systemInstruction.parts[0].text).toContain('MWF');
    });

    it('returns the stream result from Gemini', async () => {
      const mockStream = { stream: [{ text: () => 'Hello!' }] };
      mockGemini.generateContentStream.mockResolvedValue(mockStream);

      const result = await buildChatStream('Hi', '2026 Spring');
      expect(result).toBe(mockStream);
    });
  });
});
