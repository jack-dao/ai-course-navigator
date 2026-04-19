import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CourseList from '../CourseList';
import type { Course } from '../../../types';

function makeCourse(code: string): Course {
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
    sections: [
      {
        id: 1,
        classNumber: '10000',
        sectionNumber: '01',
        sectionCode: `${code}-01`,
        days: 'MWF',
        startTime: '9:00AM',
        endTime: '10:00AM',
        location: 'Room 101',
        status: 'Open',
        enrolled: 20,
        capacity: 30,
        instructor: 'Staff',
        instructionMode: 'In Person',
      },
    ],
  };
}

describe('CourseList', () => {
  it('renders course cards for each course', () => {
    const courses = [makeCourse('CSE 101'), makeCourse('MATH 100')];
    render(
      <CourseList
        searchQuery=""
        processedCourses={courses}
        onAdd={vi.fn()}
        filters={{
          openOnly: false,
          minRating: 0,
          minUnits: 0,
          days: [],
          department: 'All Departments',
          sort: 'Best Match',
          timeRange: [7, 23],
        }}
        professorRatings={{}}
        onShowProfessor={vi.fn()}
        sortOption="Best Match"
      />
    );
    expect(screen.getByText('CSE 101')).toBeDefined();
    expect(screen.getByText('MATH 100')).toBeDefined();
  });

  it('shows empty state when no courses match search', () => {
    render(
      <CourseList
        searchQuery="nonexistent"
        processedCourses={[]}
        onAdd={vi.fn()}
        filters={{
          openOnly: false,
          minRating: 0,
          minUnits: 0,
          days: [],
          department: 'All Departments',
          sort: 'Best Match',
          timeRange: [7, 23],
        }}
        professorRatings={{}}
        onShowProfessor={vi.fn()}
        sortOption="Best Match"
      />
    );
    expect(screen.getByText('No courses found')).toBeDefined();
  });

  it('shows browse state when no search query and no courses', () => {
    render(
      <CourseList
        searchQuery=""
        processedCourses={[]}
        onAdd={vi.fn()}
        filters={{
          openOnly: false,
          minRating: 0,
          minUnits: 0,
          days: [],
          department: 'All Departments',
          sort: 'Best Match',
          timeRange: [7, 23],
        }}
        professorRatings={{}}
        onShowProfessor={vi.fn()}
        sortOption="Best Match"
      />
    );
    expect(screen.getByText('Browse the Catalog')).toBeDefined();
  });
});
