import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchTab from '../SearchTab';
import type { CourseFilters, Course } from '../../../types';

vi.mock('../../filter', () => ({
  FilterSidebar: () => <div data-testid="filter-sidebar" />,
}));
vi.mock('../../course', () => ({
  CourseList: () => <div data-testid="course-list" />,
}));

function makeCourse(code: string): Course {
  return {
    id: Math.random(),
    code,
    name: `Course ${code}`,
    credits: 5,
    geCode: null,
    career: null,
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    sections: [],
  };
}

const defaultFilters: CourseFilters = {
  openOnly: false,
  minRating: 0,
  minUnits: 0,
  days: [],
  department: 'All Departments',
  sort: 'Best Match',
  timeRange: [7, 23],
};

const defaultProps = {
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filters: defaultFilters,
  setFilters: vi.fn(),
  resetFilters: vi.fn(),
  processedCourses: [] as Course[],
  isCoursesLoading: false,
  isBackgroundFetching: false,
  selectedTerm: '2026 Spring',
  professorRatings: {},
  onAdd: vi.fn(),
  onShowProfessor: vi.fn(),
  showFilters: false,
  setShowFilters: vi.fn(),
};

describe('SearchTab', () => {
  it('renders search input', () => {
    render(<SearchTab {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search courses...')).toBeDefined();
  });

  it('shows "0 results found" when no courses', () => {
    render(<SearchTab {...defaultProps} />);
    expect(screen.getByText('0 results found')).toBeDefined();
  });

  it('shows loading spinner when loading', () => {
    render(<SearchTab {...defaultProps} isCoursesLoading={true} />);
    expect(screen.getByText(/Loading 2026 Spring/)).toBeDefined();
  });

  it('shows results count matching processedCourses length', () => {
    const courses = Array.from({ length: 5 }, (_, i) => makeCourse(`CSE${i}`));
    render(<SearchTab {...defaultProps} processedCourses={courses} />);
    expect(screen.getByText('5 results found')).toBeDefined();
  });

  it('calls setSearchQuery when typing', () => {
    const setSearchQuery = vi.fn();
    render(<SearchTab {...defaultProps} setSearchQuery={setSearchQuery} />);
    fireEvent.change(screen.getByPlaceholderText('Search courses...'), { target: { value: 'CSE' } });
    expect(setSearchQuery).toHaveBeenCalledWith('CSE');
  });

  it('shows pagination when more than 20 courses', () => {
    const courses = Array.from({ length: 25 }, (_, i) => makeCourse(`CSE${i}`));
    render(<SearchTab {...defaultProps} processedCourses={courses} />);
    expect(screen.getByText(/Page 1 of 2/)).toBeDefined();
  });

  it('does NOT show pagination when 20 or fewer courses', () => {
    const courses = Array.from({ length: 15 }, (_, i) => makeCourse(`CSE${i}`));
    render(<SearchTab {...defaultProps} processedCourses={courses} />);
    expect(screen.queryByText(/Page/)).toBeNull();
  });

  it('has accessible search input label', () => {
    render(<SearchTab {...defaultProps} />);
    expect(screen.getByLabelText('Search courses')).toBeDefined();
  });
});
