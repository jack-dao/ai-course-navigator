import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseCard from '../CourseCard';
import type { Course, Section, ProfessorRatingsMap } from '../../../types';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 1,
    code: 'CSE 101',
    name: 'Algorithms and Abstract Data Types',
    credits: 5,
    geCode: null,
    career: 'Undergraduate',
    grading: 'Student Option',
    term: '2026 Spring',
    schoolId: 1,
    sections: [
      {
        id: 10,
        classNumber: '20001',
        sectionNumber: '01',
        sectionCode: 'CSE101-01',
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:10AM',
        location: 'CLASSROOM 101',
        status: 'Open',
        enrolled: 150,
        capacity: 200,
        instructor: 'Tantalo,Patrick',
        instructionMode: 'In Person',
      },
    ],
    ...overrides,
  };
}

const ratings: ProfessorRatingsMap = {
  'Tantalo,Patrick': {
    avgRating: 4.2,
    avgDifficulty: 3.1,
    wouldTakeAgain: '85%',
    numRatings: 120,
    rmpLink: null,
    reviews: [],
  },
};

describe('CourseCard', () => {
  it('renders course code and name', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('CSE 101')).toBeDefined();
    expect(screen.getByText('Algorithms and Abstract Data Types')).toBeDefined();
  });

  it('renders units badge', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('5 Units')).toBeDefined();
  });

  it('renders instructor name', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('Tantalo, Patrick')).toBeDefined();
  });

  it('renders professor ratings when available', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} professorRatings={ratings} />);
    expect(screen.getByText('4.2 (120)')).toBeDefined();
  });

  it('shows "No ratings" when professor has no data', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} professorRatings={{}} />);
    expect(screen.getByText('No ratings')).toBeDefined();
  });

  it('renders GE code when present', () => {
    const course = makeCourse({ geCode: 'MF' });
    render(<CourseCard course={course} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText(/Mathematical and Formal Reasoning/)).toBeDefined();
  });

  it('does not render GE section when geCode is null', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.queryByText('General Education')).toBeNull();
  });

  it('renders enrollment status', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('150/200')).toBeDefined();
    expect(screen.getByText('Open')).toBeDefined();
  });

  it('renders Add Class button', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('Add Class')).toBeDefined();
  });

  it('calls onAdd when Add Class button clicked (no discussions)', () => {
    const onAdd = vi.fn();
    render(<CourseCard course={makeCourse()} onAdd={onAdd} onShowProfessor={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Class'));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CSE 101' }),
      expect.objectContaining({ id: 10 })
    );
  });

  it('shows "Closed (Add Anyway)" for closed sections', () => {
    const course = makeCourse({
      sections: [
        {
          id: 10,
          classNumber: '20001',
          sectionNumber: '01',
          sectionCode: 'CSE101-01',
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:10AM',
          location: 'ROOM 101',
          status: 'Closed',
          enrolled: 200,
          capacity: 200,
          instructor: 'Staff',
          instructionMode: 'In Person',
        },
      ],
    });
    render(<CourseCard course={course} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('Closed (Add Anyway)')).toBeDefined();
  });

  it('calls onShowProfessor when instructor name clicked', () => {
    const onShowProfessor = vi.fn();
    render(
      <CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={onShowProfessor} professorRatings={ratings} />
    );
    fireEvent.click(screen.getByText('Tantalo, Patrick'));
    expect(onShowProfessor).toHaveBeenCalledWith('Tantalo,Patrick', ratings['Tantalo,Patrick']);
  });

  it('renders description toggle button', () => {
    render(<CourseCard course={makeCourse()} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('Show Description & Prerequisites')).toBeDefined();
  });

  it('shows discussion dropdown when section has subSections', () => {
    const course = makeCourse({
      sections: [
        {
          id: 10,
          classNumber: '20001',
          sectionNumber: '01',
          sectionCode: 'CSE101-01',
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:10AM',
          location: 'ROOM 101',
          status: 'Open',
          enrolled: 100,
          capacity: 200,
          instructor: 'Staff',
          instructionMode: 'In Person',
          subSections: [
            {
              id: 20,
              classNumber: '20002',
              sectionNumber: '01A',
              sectionCode: 'CSE101-01A',
              days: 'Tu',
              startTime: '4:00PM',
              endTime: '5:05PM',
              location: 'Lab 201',
              status: 'Open',
              enrolled: 20,
              capacity: 25,
            },
          ],
        },
      ],
    });
    render(<CourseCard course={course} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    expect(screen.getByText('Select Discussion')).toBeDefined();
  });

  it('does NOT render phantom "0" when subSections is empty', () => {
    const course = makeCourse({
      sections: [
        {
          id: 10,
          classNumber: '20001',
          sectionNumber: '01',
          sectionCode: 'CSE101-01',
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:10AM',
          location: 'ROOM 101',
          status: 'Open',
          enrolled: 100,
          capacity: 200,
          instructor: 'Staff',
          instructionMode: 'In Person',
          subSections: [],
        },
      ],
    });
    render(<CourseCard course={course} onAdd={vi.fn()} onShowProfessor={vi.fn()} />);
    // The bug we fixed: "0" rendering above the Add Class button
    expect(screen.queryByText('Select Discussion')).toBeNull();
    // Check no stray "0" text node near the button
    const addButton = screen.getByText('Add Class');
    const parent = addButton.closest('div');
    expect(parent?.textContent).not.toMatch(/^0/);
  });

  it('shows error state when Add clicked without selecting discussion', () => {
    const course = makeCourse({
      sections: [
        {
          id: 10,
          classNumber: '20001',
          sectionNumber: '01',
          sectionCode: 'CSE101-01',
          days: 'MWF',
          startTime: '9:00AM',
          endTime: '10:10AM',
          location: 'ROOM 101',
          status: 'Open',
          enrolled: 100,
          capacity: 200,
          instructor: 'Staff',
          instructionMode: 'In Person',
          subSections: [
            {
              id: 20,
              classNumber: '20002',
              sectionNumber: '01A',
              sectionCode: 'CSE101-01A',
              days: 'Tu',
              startTime: '4:00PM',
              endTime: '5:05PM',
              location: 'Lab 201',
              status: 'Open',
              enrolled: 20,
              capacity: 25,
            },
          ],
        },
      ],
    });
    const onAdd = vi.fn();
    render(<CourseCard course={course} onAdd={onAdd} onShowProfessor={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Class'));
    // Should NOT call onAdd since no discussion selected
    expect(onAdd).not.toHaveBeenCalled();
  });
});
