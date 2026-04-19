import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { registerUser, loginUser } from '../authService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService', () => {
  describe('registerUser', () => {
    it('returns error when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const result = await registerUser('test@test.com', 'password123', 'Test');
      expect(result).toEqual({ error: 'Email already taken' });
    });

    it('creates user and returns userId when email is new', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'new-id', email: 'new@test.com', name: 'New' });

      const result = await registerUser('new@test.com', 'password123', 'New');
      expect(result).toEqual({ userId: 'new-id' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'new@test.com', name: 'New' }),
      });
    });

    it('hashes the password before storing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: '1' });

      await registerUser('test@test.com', 'password123', 'Test');

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      // Password should be hashed, not plaintext
      expect(createCall.data.password).not.toBe('password123');
      expect(createCall.data.password.startsWith('$2')).toBe(true); // bcrypt prefix
    });
  });

  describe('loginUser', () => {
    it('returns error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await loginUser('missing@test.com', 'password');
      expect(result).toEqual({ error: 'Invalid email or password' });
    });

    it('returns error when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        password: '$2a$10$invalidhashhere',
      });

      const result = await loginUser('test@test.com', 'wrongpassword');
      expect(result).toEqual({ error: 'Invalid email or password' });
    });
  });
});
