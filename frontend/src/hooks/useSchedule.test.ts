import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSchedule } from './useSchedule';
import type { SelectedCourse, Section } from '../types';

// Mock authFetch to prevent real API calls
vi.mock('../utils/api', () => ({
  authFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

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
  mockLocalStorage.clear();
  vi.stubGlobal('localStorage', mockLocalStorage);
});

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
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
    instructor: 'Smith',
    instructionMode: 'In Person',
    ...overrides,
  };
}

function makeSelectedCourse(
  code: string,
  section: Partial<Section> = {}
): SelectedCourse {
  return {
    id: 1,
    code,
    name: `Course ${code}`,
    credits: 5,
    geCode: null,
    career: null,
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    selectedSection: makeSection(section),
  };
}

describe('useSchedule', () => {
  function renderScheduleHook() {
    return renderHook(() => useSchedule(null, null, [], '2026 Spring'));
  }

  describe('checkForConflicts', () => {
    it('returns conflicting course code when two classes overlap on the same day', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '9:30AM',
        endTime: '10:30AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBe('CSE101');
    });

    it('returns null when two classes are on the same day but do not overlap', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '10:00AM',
        endTime: '11:00AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBeNull();
    });

    it('returns null when two classes are on different days', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'TuTh',
        startTime: '9:00AM',
        endTime: '10:00AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBeNull();
    });

    it('returns null when a class has TBA days (no schedule)', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'TBA',
        startTime: '9:00AM',
        endTime: '10:00AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBeNull();
    });

    it('returns null when a class has null times', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '',
        endTime: '',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBeNull();
    });

    it('skips the course matching ignoreCode', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, 'CSE101');
      expect(conflict).toBeNull();
    });

    it('detects conflict when a lab in the existing course overlaps', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'F',
        startTime: '1:00PM',
        endTime: '2:00PM',
      });

      const existingSection = makeSection({
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
        selectedLab: {
          id: 2,
          classNumber: '10001',
          sectionNumber: '01A',
          sectionCode: '01A',
          days: 'F',
          startTime: '1:00PM',
          endTime: '2:00PM',
          location: 'Lab 201',
          status: 'Open',
          enrolled: 10,
          capacity: 15,
        },
      });

      const existing: SelectedCourse[] = [
        {
          id: 1,
          code: 'CSE101',
          name: 'Course CSE101',
          credits: 5,
          geCode: null,
          career: null,
          grading: null,
          term: '2026 Spring',
          schoolId: 1,
          selectedSection: existingSection,
        },
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBe('CSE101');
    });

    it('detects conflict when the new section has a lab that overlaps', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '8:00AM',
        endTime: '9:00AM',
        selectedLab: {
          id: 3,
          classNumber: '10002',
          sectionNumber: '02A',
          sectionCode: '02A',
          days: 'Tu',
          startTime: '2:00PM',
          endTime: '3:00PM',
          location: 'Lab 300',
          status: 'Open',
          enrolled: 5,
          capacity: 20,
        },
      });

      const existing: SelectedCourse[] = [
        makeSelectedCourse('MATH100', {
          days: 'TuTh',
          startTime: '2:00PM',
          endTime: '3:30PM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBe('MATH100');
    });

    it('returns null when there are no existing courses', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
      });

      const conflict = result.current.checkForConflicts(newSection, [], '');
      expect(conflict).toBeNull();
    });

    it('handles PM time parsing correctly (e.g., 12:00PM stays 12)', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '12:00PM',
        endTime: '1:00PM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '12:30PM',
          endTime: '1:30PM',
        }),
      ];

      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBe('CSE101');
    });

    it('handles edge case where one class ends exactly when another starts', () => {
      const { result } = renderScheduleHook();
      const newSection = makeSection({
        days: 'MWF',
        startTime: '10:00AM',
        endTime: '11:00AM',
      });
      const existing: SelectedCourse[] = [
        makeSelectedCourse('CSE101', {
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:00AM',
        }),
      ];

      // end === start => no overlap (strict inequality in the hook)
      const conflict = result.current.checkForConflicts(newSection, existing, '');
      expect(conflict).toBeNull();
    });
  });

  describe('totalUnits', () => {
    it('starts at 0 with no selected courses', () => {
      const { result } = renderScheduleHook();
      expect(result.current.totalUnits).toBe(0);
    });
  });
});
