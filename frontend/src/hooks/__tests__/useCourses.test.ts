import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCourses } from '../useCourses';

vi.mock('../../utils/api', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}));

import { apiFetch } from '../../utils/api';
import { get } from 'idb-keyval';
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;
const mockIdbGet = get as ReturnType<typeof vi.fn>;

const mockCourses = [
  { id: 1, code: 'CSE101', name: 'Algorithms', credits: 5, sections: [] },
  { id: 2, code: 'MATH100', name: 'Linear Algebra', credits: 5, sections: [] },
];

const mockRatings = {
  Smith: { avgRating: 4.5, avgDifficulty: 2.0, wouldTakeAgain: '90%', numRatings: 50, rmpLink: null, reviews: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIdbGet.mockResolvedValue(null);
});

describe('useCourses', () => {
  it('starts in loading state', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useCourses('2026 Spring'));
    expect(result.current.isCoursesLoading).toBe(true);
    expect(result.current.availableCourses).toEqual([]);
  });

  it('fetches courses and ratings from API', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/api/courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (path.includes('/api/ratings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRatings) });
      }
      return Promise.resolve({ ok: false });
    });

    const { result } = renderHook(() => useCourses('2026 Spring'));

    await waitFor(() => {
      expect(result.current.isCoursesLoading).toBe(false);
    });

    expect(result.current.availableCourses).toHaveLength(2);
    expect(result.current.availableCourses[0].code).toBe('CSE101');
    expect(result.current.professorRatings['Smith'].avgRating).toBe(4.5);
  });

  it('uses cached data and shows background fetching', async () => {
    mockIdbGet.mockImplementation((key: string) => {
      if (key.includes('courses_')) return Promise.resolve(mockCourses);
      if (key === 'ratings') return Promise.resolve(mockRatings);
      return Promise.resolve(null);
    });

    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/api/courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (path.includes('/api/ratings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRatings) });
      }
      return Promise.resolve({ ok: false });
    });

    const { result } = renderHook(() => useCourses('2026 Spring'));

    // Should quickly show cached data
    await waitFor(() => {
      expect(result.current.availableCourses).toHaveLength(2);
    });
  });

  it('does not fetch when term is empty', () => {
    const { result } = renderHook(() => useCourses(''));
    // apiFetch should not be called
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(result.current.availableCourses).toEqual([]);
  });

  it('handles API error gracefully', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCourses('2026 Spring'));

    await waitFor(() => {
      expect(result.current.isCoursesLoading).toBe(false);
    });

    // Should not crash, just have empty data
    expect(result.current.availableCourses).toEqual([]);
  });

  it('cleans up on unmount (isActive flag)', async () => {
    let resolveApi: (value: unknown) => void;
    mockApiFetch.mockReturnValue(
      new Promise((r) => {
        resolveApi = r;
      })
    );

    const { unmount } = renderHook(() => useCourses('2026 Spring'));
    unmount();

    // Resolve after unmount — should not throw
    resolveApi!({ ok: true, json: () => Promise.resolve([]) });
  });
});
