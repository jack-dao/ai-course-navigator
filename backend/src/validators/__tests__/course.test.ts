import { describe, it, expect } from 'vitest';
import { termQuerySchema, courseIdSchema } from '../course';

describe('termQuerySchema', () => {
  it('passes with empty object since term is optional', () => {
    const result = termQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes with a term value', () => {
    const result = termQuerySchema.safeParse({ term: '2026 Spring' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.term).toBe('2026 Spring');
    }
  });
});

describe('courseIdSchema', () => {
  it('passes with valid numeric string and transforms to number', () => {
    const result = courseIdSchema.safeParse({ id: '42' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(42);
    }
  });

  it('fails with non-numeric string', () => {
    const result = courseIdSchema.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });
});
