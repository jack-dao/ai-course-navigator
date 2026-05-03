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
      code: 'CSE101',
      name: 'Algorithms',
      credits: 5,
      geCode: null,
      prerequisites: 'CSE30',
      sections: [{ instructor: 'Smith', days: 'MWF', startTime: '10:00AM', endTime: '11:00AM', status: 'Open' }],
    },
  ]);
  mockGemini.generateContentStream.mockResolvedValue({ stream: [] });
});

describe('chatService', () => {
  describe('buildChatStream', () => {
    it('queries courses for the given term', async () => {
      await buildChatStream('What classes should I take?', '2026 Spring');

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { term: '2026 Spring' }, take: 20 })
      );
    });

    it('queries all courses when no term provided', async () => {
      await buildChatStream('Help me');

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('passes user schedule into the prompt', async () => {
      const schedule = [{ code: 'CSE101', name: 'Algorithms', days: 'MWF', times: '10-11AM' }];
      await buildChatStream('What fits?', '2026 Spring', schedule);

      const prompt = mockGemini.generateContentStream.mock.calls[0][0];
      expect(prompt).toContain('CSE101');
      expect(prompt).toContain('Algorithms');
      expect(prompt).toContain('MWF');
    });

    it('includes "No classes enrolled" when no schedule', async () => {
      await buildChatStream('Help me', '2026 Spring');

      const prompt = mockGemini.generateContentStream.mock.calls[0][0];
      expect(prompt).toContain('No classes enrolled yet.');
    });

    it('includes course context from database in prompt', async () => {
      await buildChatStream('Easy classes?', '2026 Spring');

      const prompt = mockGemini.generateContentStream.mock.calls[0][0];
      expect(prompt).toContain('CSE101');
      expect(prompt).toContain('Algorithms');
      expect(prompt).toContain('Smith');
    });

    it('includes the user message in the prompt', async () => {
      await buildChatStream('What are the easiest GEs?', '2026 Spring');

      const prompt = mockGemini.generateContentStream.mock.calls[0][0];
      expect(prompt).toContain('What are the easiest GEs?');
    });

    it('returns the stream result from Gemini', async () => {
      const mockStream = { stream: [{ text: () => 'Hello!' }] };
      mockGemini.generateContentStream.mockResolvedValue(mockStream);

      const result = await buildChatStream('Hi', '2026 Spring');
      expect(result).toBe(mockStream);
    });
  });
});
