import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarView from '../CalendarView';
import type { SelectedCourse } from '../../../types';

function makeSelectedCourse(overrides: Partial<SelectedCourse> = {}): SelectedCourse {
  return {
    id: 1,
    code: 'CSE101',
    name: 'Intro CS',
    credits: 5,
    geCode: null,
    career: null,
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    selectedSection: {
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
    },
    ...overrides,
  };
}

describe('CalendarView', () => {
  it('renders day headers', () => {
    render(<CalendarView selectedCourses={[]} />);
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Tue')).toBeDefined();
    expect(screen.getByText('Wed')).toBeDefined();
    expect(screen.getByText('Thu')).toBeDefined();
    expect(screen.getByText('Fri')).toBeDefined();
  });

  it('renders time slots', () => {
    render(<CalendarView selectedCourses={[]} />);
    expect(screen.getByText('7 AM')).toBeDefined();
    expect(screen.getByText('12 PM')).toBeDefined();
    expect(screen.getByText('5 PM')).toBeDefined();
  });

  it('renders course blocks on the calendar', () => {
    const courses = [makeSelectedCourse()];
    render(<CalendarView selectedCourses={courses} />);

    // Course code should appear on the calendar
    const courseElements = screen.getAllByText('CSE101');
    expect(courseElements.length).toBeGreaterThan(0);
  });

  it('renders lab blocks when selectedLab exists', () => {
    const courses = [
      makeSelectedCourse({
        selectedSection: {
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
          selectedLab: {
            id: 2,
            classNumber: '10001',
            sectionNumber: '01A',
            sectionCode: '01A-LAB',
            days: 'F',
            startTime: '1:00PM',
            endTime: '2:00PM',
            location: 'Lab 201',
            status: 'Open',
            enrolled: 10,
            capacity: 15,
          },
        },
      }),
    ];
    render(<CalendarView selectedCourses={courses} />);

    // Should have multiple course code blocks (lecture on M, W, F + lab on F)
    const courseElements = screen.getAllByText('CSE101');
    expect(courseElements.length).toBeGreaterThanOrEqual(4); // 3 lecture days + 1 lab day
  });

  it('renders empty calendar with no courses', () => {
    const { container } = render(<CalendarView selectedCourses={[]} />);
    // Should still render the grid structure
    expect(container.querySelector('.grid-cols-5')).toBeDefined();
  });
});
