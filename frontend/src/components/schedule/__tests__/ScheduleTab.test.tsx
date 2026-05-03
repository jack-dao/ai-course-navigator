import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleTab from '../ScheduleTab';
import type { SelectedCourse } from '../../../types';

function makeCourse(code: string, credits: number = 5): SelectedCourse {
  return {
    id: 1,
    code,
    name: `Course ${code}`,
    credits,
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
  };
}

describe('ScheduleTab', () => {
  const defaultProps = {
    selectedCourses: [] as SelectedCourse[],
    onRemove: vi.fn(),
    onSave: vi.fn(),
    notification: null,
  };

  it('shows "My Schedule" heading', () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText('My Schedule')).toBeDefined();
  });

  it('shows empty state when no courses', () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText(/Add courses from Search/)).toBeDefined();
  });

  it('shows Save Schedule button', () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText('Save Schedule')).toBeDefined();
  });

  it('calls onSave when save button clicked', () => {
    const onSave = vi.fn();
    render(<ScheduleTab {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save Schedule'));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows mobile list/calendar toggle', () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText('List View')).toBeDefined();
    expect(screen.getByText('Calendar View')).toBeDefined();
  });

  it('shows notification when provided', () => {
    render(<ScheduleTab {...defaultProps} notification={{ message: 'Saved!', type: 'success' }} />);
    expect(screen.getByText('Saved!')).toBeDefined();
  });

  it('displays course when provided', () => {
    const courses = [makeCourse('CSE101')];
    render(<ScheduleTab {...defaultProps} selectedCourses={courses} />);
    expect(screen.getAllByText('CSE101').length).toBeGreaterThan(0);
  });
});
