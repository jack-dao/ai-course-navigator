import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    schedule: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { saveUserSchedule, getUserSchedule } from '../scheduleService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  user: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  schedule: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scheduleService', () => {
  describe('saveUserSchedule', () => {
    it('upserts user and creates new schedule when none exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({});
      mockPrisma.schedule.findFirst.mockResolvedValue(null);
      mockPrisma.schedule.create.mockResolvedValue({ id: 1, name: '2026 Spring', courses: [] });

      const result = await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [{ code: 'CSE101', sectionCode: '01A', labCode: '' }],
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.schedule.create).toHaveBeenCalled();
      expect(result.name).toBe('2026 Spring');
    });

    it('creates a schedule when none exists for the current term', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.schedule.findFirst.mockResolvedValue(null);
      mockPrisma.schedule.create.mockResolvedValue({ id: 5, name: '2026 Spring', courses: [] });

      await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [],
      });

      expect(mockPrisma.schedule.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', name: '2026 Spring' },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: '2026 Spring', courses: [] },
      });
    });

    it('updates the newest existing schedule for the current term', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.schedule.findFirst.mockResolvedValue({ id: 5, name: '2026 Spring', courses: [] });
      mockPrisma.schedule.update.mockResolvedValue({ id: 5, name: '2026 Spring', courses: [] });

      await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [{ code: 'CSE101', sectionCode: '01A', labCode: '' }],
      });

      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { courses: [{ code: 'CSE101', sectionCode: '01A', labCode: '' }] },
      });
    });

    it('updates an existing user with the same email to the current auth id', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'old-user-id', email: 'test@test.com' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      mockPrisma.schedule.findFirst.mockResolvedValue(null);
      mockPrisma.schedule.create.mockResolvedValue({ id: 6, name: '2026 Spring', courses: [] });

      await saveUserSchedule({
        userId: 'user-1',
        email: 'test@test.com',
        userName: 'Test',
        name: '2026 Spring',
        courses: [],
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        data: {
          id: 'user-1',
          name: 'Test',
        },
      });
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: '2026 Spring', courses: [] },
      });
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
