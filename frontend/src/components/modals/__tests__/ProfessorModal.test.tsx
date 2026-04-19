import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfessorModal from '../ProfessorModal';

const professor = {
  name: 'Smith,Alice',
  avgRating: 4.5,
  avgDifficulty: 2.0,
  wouldTakeAgain: '90',
  numRatings: 50,
  rmpLink: 'https://rmp.com/alice',
  department: 'CSE',
  reviews: [
    {
      comment: 'Great professor!',
      date: '2025-12-01',
      course: 'CSE 101',
      grade: 'A',
      rating: 5,
      difficulty: 2,
      wouldTakeAgain: true,
      tags: ['Caring', 'Clear grading'],
    },
  ],
};

describe('ProfessorModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ProfessorModal professor={professor} isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when professor is null', () => {
    const { container } = render(<ProfessorModal professor={null} isOpen={true} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders professor name when open', () => {
    render(<ProfessorModal professor={professor} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Smith, Alice')).toBeDefined();
  });

  it('renders rating stats', () => {
    render(<ProfessorModal professor={professor} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('4.5 / 5')).toBeDefined();
    expect(screen.getByText('2 / 5')).toBeDefined();
    expect(screen.getByText('90%')).toBeDefined();
  });

  it('renders reviews', () => {
    render(<ProfessorModal professor={professor} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('"Great professor!"')).toBeDefined();
    expect(screen.getByText('CSE 101')).toBeDefined();
    expect(screen.getByText('Grade: A')).toBeDefined();
  });

  it('renders review tags', () => {
    render(<ProfessorModal professor={professor} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Caring')).toBeDefined();
    expect(screen.getByText('Clear grading')).toBeDefined();
  });

  it('renders RMP link', () => {
    render(<ProfessorModal professor={professor} isOpen={true} onClose={vi.fn()} />);
    const link = screen.getByText('View on RMP');
    expect(link.closest('a')?.href).toBe('https://rmp.com/alice');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ProfessorModal professor={professor} isOpen={true} onClose={onClose} />);
    // Click the X button (find by role)
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when no reviews', () => {
    const profNoReviews = { ...professor, reviews: [] };
    render(<ProfessorModal professor={profNoReviews} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('No written reviews available.')).toBeDefined();
  });
});
