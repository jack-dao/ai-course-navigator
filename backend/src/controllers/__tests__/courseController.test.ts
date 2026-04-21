import { describe, it, expect, vi, afterEach } from 'vitest';
import { sortTermsDesc, getSmartTerm } from '../../services/courseService';

describe('sortTermsDesc', () => {
  it('sorts "2026 Spring" before "2026 Winter"', () => {
    const result = sortTermsDesc(['2026 Winter', '2026 Spring']);
    expect(result).toEqual(['2026 Spring', '2026 Winter']);
  });

  it('sorts "2026 Fall" before "2025 Fall"', () => {
    const result = sortTermsDesc(['2025 Fall', '2026 Fall']);
    expect(result).toEqual(['2026 Fall', '2025 Fall']);
  });

  it('sorts multiple terms in descending order', () => {
    const terms = ['2025 Winter', '2026 Fall', '2025 Spring', '2026 Winter'];
    const result = sortTermsDesc(terms);
    expect(result).toEqual(['2026 Fall', '2026 Winter', '2025 Spring', '2025 Winter']);
  });

  it('handles a single term', () => {
    const result = sortTermsDesc(['2026 Spring']);
    expect(result).toEqual(['2026 Spring']);
  });

  it('handles an empty array', () => {
    const result = sortTermsDesc([]);
    expect(result).toEqual([]);
  });
});

describe('getSmartTerm', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Winter for January (month 0)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getSmartTerm()).toBe('Winter 2026');
  });

  it('returns Winter for March (month 2)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10));
    expect(getSmartTerm()).toBe('Winter 2026');
  });

  it('returns Spring for April (month 3)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1));
    expect(getSmartTerm()).toBe('Spring 2026');
  });

  it('returns Spring for June (month 5)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30));
    expect(getSmartTerm()).toBe('Spring 2026');
  });

  it('returns Summer for July (month 6)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15));
    expect(getSmartTerm()).toBe('Summer 2026');
  });

  it('returns Summer for August (month 7)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1));
    expect(getSmartTerm()).toBe('Summer 2026');
  });

  it('returns Fall for September (month 8)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 1));
    expect(getSmartTerm()).toBe('Fall 2026');
  });

  it('returns Fall for December (month 11)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 25));
    expect(getSmartTerm()).toBe('Fall 2026');
  });
});
