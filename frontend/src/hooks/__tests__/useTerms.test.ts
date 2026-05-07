import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTerms } from '../useTerms';

vi.mock('../../utils/api', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from '../../utils/api';
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.clear();
  vi.stubGlobal('localStorage', mockLocalStorage);
});

describe('useTerms', () => {
  it('starts with default UCSC school info', () => {
    mockApiFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useTerms());

    expect(result.current.ucscSchool.shortName).toBe('UCSC');
    expect(result.current.ucscSchool.name).toBe('UC Santa Cruz');
  });

  it('fetches and sets available terms', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/info')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'ucsc',
              name: 'UC Santa Cruz',
              shortName: 'UCSC',
              term: '2026 Spring',
              status: 'active',
            }),
        });
      }
      if (path.includes('/terms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['2026 Winter', '2026 Spring', '2025 Fall']),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const { result } = renderHook(() => useTerms());

    await waitFor(() => {
      expect(result.current.availableTerms.length).toBeGreaterThan(0);
    });

    // Should be sorted descending (Spring before Winter)
    expect(result.current.availableTerms[0]).toBe('2026 Spring');
    expect(result.current.availableTerms[1]).toBe('2026 Winter');
  });

  it('sets selectedTerm to first available term when none saved', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/info')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'ucsc',
              name: 'UC Santa Cruz',
              shortName: 'UCSC',
              term: '2026 Spring',
              status: 'active',
            }),
        });
      }
      if (path.includes('/terms')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(['2026 Spring']) });
      }
      return Promise.resolve({ ok: false });
    });

    const { result } = renderHook(() => useTerms());

    await waitFor(() => {
      expect(result.current.selectedTerm).toBe('2026 Spring');
    });
  });

  it('restores selectedTerm from localStorage', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'lastSelectedTerm') return '2025 Fall';
      return null;
    });
    mockApiFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useTerms());

    expect(result.current.selectedTerm).toBe('2025 Fall');
  });

  it('caches terms to localStorage', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/info')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'ucsc',
              name: 'UC Santa Cruz',
              shortName: 'UCSC',
              term: '2026 Spring',
              status: 'active',
            }),
        });
      }
      if (path.includes('/terms')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(['2026 Spring']) });
      }
      return Promise.resolve({ ok: false });
    });

    renderHook(() => useTerms());

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cachedTerms', expect.any(String));
    });
  });

  it('handles API error gracefully', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTerms());

    // Should not crash — keeps default values
    expect(result.current.ucscSchool.shortName).toBe('UCSC');
    expect(result.current.availableTerms).toEqual([]);
  });
});
