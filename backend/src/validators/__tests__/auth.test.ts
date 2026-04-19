import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../auth';

describe('registerSchema', () => {
  it('passes with valid input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('fails when email is missing', () => {
    const result = registerSchema.safeParse({
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('fails with invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('fails when password is shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('passes with valid input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('fails when email is missing', () => {
    const result = loginSchema.safeParse({
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('fails when password is missing', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });
});
