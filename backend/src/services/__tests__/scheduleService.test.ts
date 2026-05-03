import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  default: {
    user: { upsert: vi.fn() },
    schedule: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { saveUserSchedule, getUserSchedule } from '../scheduleService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  user: { upsert: ReturnType<typeof vi.fn> };
  schedule: {
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scheduleService', () => {
  describe('saveUserSchedule', () => {
    it('upserts user and creates new schedule when none exists', async () => {
      mockPrisma.user.upsert.mockResolvedValue({});
      mockPrisma.schedule.upsert.mockResolvedValue({ id: 1, name: '2026 Spring', courses: [] });

      const result = await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [{ code: 'CSE101', sectionCode: '01A', labCode: '' }],
      });

      expect(mockPrisma.user.upsert).toHaveBeenCalled();
      expect(mockPrisma.schedule.upsert).toHaveBeenCalled();
      expect(result.name).toBe('2026 Spring');
    });

    it('calls upsert with correct where/update/create args', async () => {
      mockPrisma.user.upsert.mockResolvedValue({});
      mockPrisma.schedule.upsert.mockResolvedValue({ id: 5, name: '2026 Spring', courses: [] });

      await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [],
      });

      expect(mockPrisma.schedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_name: { userId: 'user-1', name: '2026 Spring' } },
          update: { courses: [] },
          create: { userId: 'user-1', name: '2026 Spring', courses: [] },
        })
      );
    });
  });

  describe('getUserSchedule', () => {
    it('returns schedule when found', async () => {
      const schedule = { id: 1, name: '2026 Spring', courses: [] };
      mockPrisma.schedule.findFirst.mockResolvedValue(schedule);

      const result = await getUserSchedule('user-1', '2026 Spring');
      expect(result).toEqual(schedule);
    });

    it('returns null when no schedule found', async () => {
      mockPrisma.schedule.findFirst.mockResolvedValue(null);

      const result = await getUserSchedule('user-1', '2026 Spring');
      expect(result).toBeNull();
    });
  });
});
