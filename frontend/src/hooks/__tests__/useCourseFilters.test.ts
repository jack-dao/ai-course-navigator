import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCourseFilters } from '../useCourseFilters';
import type { Course, ProfessorRatingsMap } from '../../types';

const mockSessionStorage = (() => {
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
  mockSessionStorage.clear();
  vi.stubGlobal('sessionStorage', mockSessionStorage);
});

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 1,
    code: 'CSE101',
    name: 'Intro to Computer Science',
    credits: 5,
    geCode: null,
    career: null,
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    sections: [
      {
        id: 1,
        classNumber: '10000',
        sectionNumber: '01',
        sectionCode: '01A',
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
        location: 'Room 101',
        status: 'Open',
        enrolled: 20,
        capacity: 30,
        instructor: 'Alice Smith',
        instructionMode: 'In Person',
      },
    ],
    ...overrides,
  };
}

const sampleCourses: Course[] = [
  makeCourse({
    id: 1,
    code: 'CSE101',
    name: 'Intro to Computer Science',
    sections: [
      {
        id: 1,
        classNumber: '10000',
        sectionNumber: '01',
        sectionCode: '01A',
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
        location: 'Room 101',
        status: 'Open',
        enrolled: 20,
        capacity: 30,
        instructor: 'Alice Smith',
        instructionMode: 'In Person',
      },
    ],
  }),
  makeCourse({
    id: 2,
    code: 'CSE130',
    name: 'Principles of Computer Systems',
    sections: [
      {
        id: 2,
        classNumber: '10001',
        sectionNumber: '01',
        sectionCode: '01A',
        days: 'TuTh',
        startTime: '1:00PM',
        endTime: '2:30PM',
        location: 'Room 102',
        status: 'Closed',
        enrolled: 30,
        capacity: 30,
        instructor: 'Bob Jones',
        instructionMode: 'In Person',
      },
    ],
  }),
  makeCourse({
    id: 3,
    code: 'MATH100',
    name: 'Introduction to Proof and Problem Solving',
    sections: [
      {
        id: 3,
        classNumber: '10002',
        sectionNumber: '01',
        sectionCode: '01A',
        days: 'MWF',
        startTime: '2:00PM',
        endTime: '3:00PM',
        location: 'Room 200',
        status: 'Open',
        enrolled: 15,
        capacity: 40,
        instructor: 'Carol White',
        instructionMode: 'In Person',
      },
    ],
  }),
  makeCourse({
    id: 4,
    code: 'AM10',
    name: 'Mathematical Methods for Engineers I',
    credits: 5,
    sections: [
      {
        id: 4,
        classNumber: '10003',
        sectionNumber: '01',
        sectionCode: '01A',
        days: 'MWF',
        startTime: '6:00PM',
        endTime: '7:30PM',
        location: 'Room 300',
        status: 'Open',
        enrolled: 10,
        capacity: 50,
        instructor: 'Dave Brown',
        instructionMode: 'In Person',
      },
    ],
  }),
];

const professorRatings: ProfessorRatingsMap = {
  'Alice Smith': {
    avgRating: 4.5,
    avgDifficulty: 2.0,
    wouldTakeAgain: '90%',
    numRatings: 50,
    rmpLink: null,
    reviews: [],
  },
  'Bob Jones': {
    avgRating: 3.0,
    avgDifficulty: 4.0,
    wouldTakeAgain: '40%',
    numRatings: 20,
    rmpLink: null,
    reviews: [],
  },
  'Carol White': {
    avgRating: 4.8,
    avgDifficulty: 1.5,
    wouldTakeAgain: '95%',
    numRatings: 80,
    rmpLink: null,
    reviews: [],
  },
};

describe('useCourseFilters', () => {
  function renderFiltersHook(courses: Course[] = sampleCourses, ratings: ProfessorRatingsMap = professorRatings) {
    return renderHook(() => useCourseFilters(courses, ratings));
  }

  describe('search scoring', () => {
    it('exact code match scores highest and appears first', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('CSE101');
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      expect(codes[0]).toBe('CSE101');
    });

    it('partial code match includes matching courses', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('CSE');
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      expect(codes).toContain('CSE101');
      expect(codes).toContain('CSE130');
      expect(codes).not.toContain('MATH100');
    });

    it('instructor match returns the matching course', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('alice smith');
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      expect(codes).toContain('CSE101');
    });

    it('no match returns empty results', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('zzzznonexistent');
      });
      expect(result.current.processedCourses).toHaveLength(0);
    });
  });

  describe('department filter', () => {
    it('filters courses by department prefix', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          department: 'Applied Mathematics',
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      expect(codes).toContain('AM10');
      expect(codes).not.toContain('CSE101');
      expect(codes).not.toContain('MATH100');
    });

    it('shows all courses when set to All Departments', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          department: 'All Departments',
        });
      });
      expect(result.current.processedCourses).toHaveLength(sampleCourses.length);
    });
  });

  describe('openOnly filter', () => {
    it('excludes closed and wait-listed courses when enabled', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          openOnly: true,
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      expect(codes).not.toContain('CSE130'); // Closed
      expect(codes).toContain('CSE101'); // Open
      expect(codes).toContain('MATH100'); // Open
    });
  });

  describe('time range filter', () => {
    it('excludes courses outside the time range', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          timeRange: [8, 15] as [number, number],
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      // AM10 is 6:00PM-7:30PM (18-19.5), outside 8-15
      expect(codes).not.toContain('AM10');
      // CSE101 is 9:00AM-10:00AM (9-10), inside 8-15
      expect(codes).toContain('CSE101');
    });
  });

  describe('minRating filter', () => {
    it('excludes courses whose professors are below the minimum rating', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          minRating: 4.0,
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      // Bob Jones has 3.0 rating
      expect(codes).not.toContain('CSE130');
      // Alice Smith has 4.5
      expect(codes).toContain('CSE101');
      // Carol White has 4.8
      expect(codes).toContain('MATH100');
      // Dave Brown has no rating data
      expect(codes).not.toContain('AM10');
    });
  });

  describe('sorting', () => {
    it('sorts by rating (highest first)', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          sort: 'Rating',
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      // Carol White 4.8 > Alice Smith 4.5 > Bob Jones 3.0 > Dave Brown (no data)
      expect(codes.indexOf('MATH100')).toBeLessThan(codes.indexOf('CSE101'));
      expect(codes.indexOf('CSE101')).toBeLessThan(codes.indexOf('CSE130'));
      // Courses with no rating data should be last
      expect(codes[codes.length - 1]).toBe('AM10');
    });

    it('sorts by difficulty (easiest first)', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setFilters({
          ...result.current.filters,
          sort: 'Difficulty',
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      // Carol White 1.5 < Alice Smith 2.0 < Bob Jones 4.0
      expect(codes.indexOf('MATH100')).toBeLessThan(codes.indexOf('CSE101'));
      expect(codes.indexOf('CSE101')).toBeLessThan(codes.indexOf('CSE130'));
    });

    it('sorts by best match (search score) when searching', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('cse101');
        result.current.setFilters({
          ...result.current.filters,
          sort: 'Best Match',
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      // Exact match for CSE101 (1000 points) should be first
      expect(codes[0]).toBe('CSE101');
    });

    it('sorts alphabetically by code when no search query and Best Match sort', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('');
        result.current.setFilters({
          ...result.current.filters,
          sort: 'Best Match',
        });
      });
      const codes = result.current.processedCourses.map((c) => c.code);
      const sorted = [...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      expect(codes).toEqual(sorted);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters and search query to defaults', () => {
      const { result } = renderFiltersHook();
      act(() => {
        result.current.setSearchQuery('something');
        result.current.setFilters({
          ...result.current.filters,
          openOnly: true,
          department: 'Applied Mathematics',
        });
      });
      act(() => {
        result.current.resetFilters();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filters.openOnly).toBe(false);
      expect(result.current.filters.department).toBe('All Departments');
    });
  });
});
