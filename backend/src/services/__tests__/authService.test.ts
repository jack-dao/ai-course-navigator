import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-unit-tests';
});

// Mock prisma before importing the service
vi.mock('../../lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../authService';
import prisma from '../../lib/prisma';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  refreshToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
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
      expect(createCall.data.password).not.toBe('password123');
      expect(createCall.data.password.startsWith('$2')).toBe(true);
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

    it('returns accessToken, refreshToken, and user on success', async () => {
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash('password123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        password: hashed,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await loginUser('test@test.com', 'password123');
      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('stores hashed refresh token in DB', async () => {
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash('password123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        password: hashed,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await loginUser('test@test.com', 'password123');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('returns error for unknown token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await refreshAccessToken('unknown-token');
      expect(result).toEqual({ error: 'Invalid or expired refresh token' });
    });

    it('returns error for revoked token and revokes all user tokens', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        tokenHash: 'hash',
        userId: 'user-1',
        revoked: true,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1' },
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      const result = await refreshAccessToken('stolen-token');
      expect(result).toEqual({ error: 'Invalid or expired refresh token' });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { revoked: true },
      });
    });

    it('returns error for expired token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        tokenHash: 'hash',
        userId: 'user-1',
        revoked: false,
        expiresAt: new Date(Date.now() - 1000), // expired
        user: { id: 'user-1' },
      });

      const result = await refreshAccessToken('expired-token');
      expect(result).toEqual({ error: 'Invalid or expired refresh token' });
    });

    it('rotates tokens on valid refresh', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        userId: 'user-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1' },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await refreshAccessToken('valid-token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Old token should be revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { revoked: true },
      });
      // New token should be created
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('logoutUser', () => {
    it('revokes the refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await logoutUser('some-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
        data: { revoked: true },
      });
    });
  });
});
