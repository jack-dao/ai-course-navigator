import { describe, it, expect, vi, afterEach } from 'vitest';
import { sortTermsDesc, getSmartTerm } from '../courseService';

// sortTermsDesc and getSmartTerm are already tested in controllers/__tests__/courseController.test.ts
// These tests focus on additional service-level behavior

describe('courseService', () => {
  describe('sortTermsDesc', () => {
    it('handles all four seasons in a single year', () => {
      const terms = ['2026 Winter', '2026 Spring', '2026 Summer', '2026 Fall'];
      const result = sortTermsDesc(terms);
      expect(result).toEqual(['2026 Fall', '2026 Summer', '2026 Spring', '2026 Winter']);
    });

    it('handles terms with unknown season names gracefully', () => {
      const terms = ['2026 Winter', '2026 Unknown'];
      const result = sortTermsDesc(terms);
      // Unknown season gets weight 0, so it sorts below Winter (weight 1)
      expect(result[0]).toBe('2026 Winter');
    });
  });

  describe('getSmartTerm', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns correct year boundary (December vs January)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 31)); // Dec 31, 2025
      expect(getSmartTerm()).toBe('Fall 2025');

      vi.setSystemTime(new Date(2026, 0, 1)); // Jan 1, 2026
      expect(getSmartTerm()).toBe('Winter 2026');
    });
  });
});
