import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterSection from '../FilterSection';

describe('FilterSection', () => {
  it('renders title and children when open', () => {
    render(
      <FilterSection title="Department">
        <span>Content here</span>
      </FilterSection>
    );
    expect(screen.getByText('Department')).toBeDefined();
    expect(screen.getByText('Content here')).toBeDefined();
  });

  it('collapses children when title clicked', () => {
    render(
      <FilterSection title="Days">
        <span>Day buttons</span>
      </FilterSection>
    );
    fireEvent.click(screen.getByText('Days'));
    expect(screen.queryByText('Day buttons')).toBeNull();
  });

  it('re-expands when clicked again', () => {
    render(
      <FilterSection title="Days">
        <span>Day buttons</span>
      </FilterSection>
    );
    fireEvent.click(screen.getByText('Days'));
    fireEvent.click(screen.getByText('Days'));
    expect(screen.getByText('Day buttons')).toBeDefined();
  });

  it('starts collapsed when isOpen=false', () => {
    render(
      <FilterSection title="Units" isOpen={false}>
        <span>Slider</span>
      </FilterSection>
    );
    expect(screen.queryByText('Slider')).toBeNull();
  });
});
