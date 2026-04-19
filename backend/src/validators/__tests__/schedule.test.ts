import { describe, it, expect } from 'vitest';
import { saveScheduleSchema, getScheduleSchema } from '../schedule';

describe('saveScheduleSchema', () => {
  it('passes with valid input', () => {
    const result = saveScheduleSchema.safeParse({
      name: 'Fall Schedule',
      courses: [{ code: 'CSE 101', sectionCode: '01A', labCode: '01B' }],
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is missing', () => {
    const result = saveScheduleSchema.safeParse({
      courses: [{ code: 'CSE 101' }],
    });
    expect(result.success).toBe(false);
  });

  it('fails when courses is missing', () => {
    const result = saveScheduleSchema.safeParse({
      name: 'Fall Schedule',
    });
    expect(result.success).toBe(false);
  });

  it('fails with invalid course structure (missing code)', () => {
    const result = saveScheduleSchema.safeParse({
      name: 'Fall Schedule',
      courses: [{ sectionCode: '01A' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('getScheduleSchema', () => {
  it('passes with valid input', () => {
    const result = getScheduleSchema.safeParse({ term: '2026 Spring' });
    expect(result.success).toBe(true);
  });

  it('passes with empty object since term is optional', () => {
    const result = getScheduleSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
