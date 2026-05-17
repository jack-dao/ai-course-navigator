import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { getUserDisplayName, getUserInitial } from '../auth';

function makeUser(overrides: Partial<User>): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as User;
}

describe('auth display helpers', () => {
  it('uses Google full_name metadata for the display name and initial', () => {
    const user = makeUser({
      email: 'jack@ucsc.edu',
      user_metadata: { full_name: 'Jack Dao' },
    });

    expect(getUserDisplayName(user)).toBe('Jack Dao');
    expect(getUserInitial(user)).toBe('J');
  });

  it('falls back to Google name metadata', () => {
    const user = makeUser({
      email: 'sammy@ucsc.edu',
      user_metadata: { name: 'Sammy Slug' },
    });

    expect(getUserDisplayName(user)).toBe('Sammy Slug');
    expect(getUserInitial(user)).toBe('S');
  });

  it('uses the email prefix when profile metadata is missing', () => {
    const user = makeUser({ email: 'student@ucsc.edu' });

    expect(getUserDisplayName(user)).toBe('student');
    expect(getUserInitial(user)).toBe('S');
  });
});
