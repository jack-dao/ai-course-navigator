import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast', () => {
  it('renders success notification message', () => {
    render(<Toast notification={{ message: 'Schedule saved!', type: 'success' }} />);
    expect(screen.getByText('Schedule saved!')).toBeDefined();
  });

  it('renders error notification with rose background', () => {
    const { container } = render(<Toast notification={{ message: 'Failed', type: 'error' }} />);
    const toast = container.firstElementChild as HTMLElement;
    expect(toast.className).toContain('bg-rose-600');
  });

  it('renders info notification with ucsc-blue background', () => {
    const { container } = render(<Toast notification={{ message: 'Saving...', type: 'info' }} />);
    const toast = container.firstElementChild as HTMLElement;
    expect(toast.className).toContain('bg-ucsc-blue');
  });

  it('has role="status" and aria-live="polite"', () => {
    render(<Toast notification={{ message: 'Test', type: 'success' }} />);
    const toast = screen.getByRole('status');
    expect(toast).toBeDefined();
    expect(toast.getAttribute('aria-live')).toBe('polite');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Toast notification={{ message: 'Test', type: 'success' }} className="custom-class" />
    );
    const toast = container.firstElementChild as HTMLElement;
    expect(toast.className).toContain('custom-class');
  });
});
