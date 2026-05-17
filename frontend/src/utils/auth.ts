import type { User } from '@supabase/supabase-js';

export function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const name = metadata.full_name || metadata.name || metadata.given_name || user.email?.split('@')[0] || 'User';

  return String(name).trim() || 'User';
}

export function getUserInitial(user: User): string {
  return getUserDisplayName(user).charAt(0).toUpperCase() || 'U';
}
