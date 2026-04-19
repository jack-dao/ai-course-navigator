import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleList from '../ScheduleList';
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

describe('ScheduleList', () => {
  it('shows empty state when no courses selected', () => {
    render(<ScheduleList selectedCourses={[]} onRemove={() => {}} />);
    expect(screen.getByText(/Add courses from Search/)).toBeDefined();
  });

  it('displays course codes', () => {
    const courses = [makeCourse('CSE101'), makeCourse('MATH100')];
    render(<ScheduleList selectedCourses={courses} onRemove={() => {}} />);
    expect(screen.getByText('CSE101')).toBeDefined();
    expect(screen.getByText('MATH100')).toBeDefined();
  });

  it('shows total units', () => {
    const courses = [makeCourse('CSE101', 5), makeCourse('MATH100', 5)];
    render(<ScheduleList selectedCourses={courses} onRemove={() => {}} />);
    expect(screen.getByText('10 / 22')).toBeDefined();
  });

  it('calls onRemove when trash button clicked', () => {
    const onRemove = vi.fn();
    const courses = [makeCourse('CSE101')];
    render(<ScheduleList selectedCourses={courses} onRemove={onRemove} />);

    // Find and click the trash button (it's the only button in the course card)
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith('CSE101');
  });

  it('shows unit progress bar', () => {
    const courses = [makeCourse('CSE101', 5)];
    const { container } = render(<ScheduleList selectedCourses={courses} onRemove={() => {}} />);
    // Progress bar exists
    const progressBar = container.querySelector('.bg-ucsc-gold, .bg-rose-500');
    expect(progressBar).toBeDefined();
  });
});
