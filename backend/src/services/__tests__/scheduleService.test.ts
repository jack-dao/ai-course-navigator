import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  default: {
    user: { upsert: vi.fn() },
    schedule: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { saveUserSchedule, getUserSchedule } from '../scheduleService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  user: { upsert: ReturnType<typeof vi.fn> };
  schedule: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scheduleService', () => {
  describe('saveUserSchedule', () => {
    it('upserts user and creates new schedule when none exists', async () => {
      mockPrisma.user.upsert.mockResolvedValue({});
      mockPrisma.schedule.findFirst.mockResolvedValue(null);
      mockPrisma.schedule.create.mockResolvedValue({ id: 1, name: '2026 Spring', courses: [] });

      const result = await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [{ code: 'CSE101', sectionCode: '01A', labCode: '' }],
      });

      expect(mockPrisma.user.upsert).toHaveBeenCalled();
      expect(mockPrisma.schedule.create).toHaveBeenCalled();
      expect(result.name).toBe('2026 Spring');
    });

    it('updates existing schedule instead of creating new one', async () => {
      mockPrisma.user.upsert.mockResolvedValue({});
      mockPrisma.schedule.findFirst.mockResolvedValue({ id: 5, name: '2026 Spring' });
      mockPrisma.schedule.update.mockResolvedValue({ id: 5, name: '2026 Spring', courses: [] });

      await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [],
      });

      expect(mockPrisma.schedule.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5 } }));
      expect(mockPrisma.schedule.create).not.toHaveBeenCalled();
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
