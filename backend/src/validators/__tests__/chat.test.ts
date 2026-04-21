import { describe, it, expect } from 'vitest';
import { chatSchema } from '../chat';

describe('chatSchema', () => {
  it('passes with valid input', () => {
    const result = chatSchema.safeParse({
      message: 'What classes should I take?',
    });
    expect(result.success).toBe(true);
  });

  it('fails when message is empty', () => {
    const result = chatSchema.safeParse({
      message: '',
    });
    expect(result.success).toBe(false);
  });

  it('fails when message exceeds 2000 characters', () => {
    const result = chatSchema.safeParse({
      message: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('fails when message is missing', () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional term', () => {
    const result = chatSchema.safeParse({
      message: 'Hello',
      term: '2026 Spring',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.term).toBe('2026 Spring');
    }
  });

  it('accepts optional userSchedule', () => {
    const result = chatSchema.safeParse({
      message: 'Hello',
      userSchedule: [{ code: 'CSE 101', name: 'Algorithms' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userSchedule).toHaveLength(1);
    }
  });

  it('defaults userSchedule to empty array when omitted', () => {
    const result = chatSchema.safeParse({
      message: 'Hello',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userSchedule).toEqual([]);
    }
  });
});
