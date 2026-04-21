import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomDropdown from '../CustomDropdown';

describe('CustomDropdown', () => {
  it('renders with placeholder when no value', () => {
    render(<CustomDropdown value="" options={['A', 'B']} onChange={vi.fn()} placeholder="Select one" />);
    expect(screen.getByText('Select one')).toBeDefined();
  });

  it('renders with selected value', () => {
    render(<CustomDropdown value="Option A" options={['Option A', 'Option B']} onChange={vi.fn()} />);
    expect(screen.getByText('Option A')).toBeDefined();
  });

  it('opens dropdown on click', () => {
    render(<CustomDropdown value="" options={['Alpha', 'Beta']} onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('calls onChange when option selected', () => {
    const onChange = vi.fn();
    render(<CustomDropdown value="" options={['Alpha', 'Beta']} onChange={onChange} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    fireEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('Beta');
  });

  it('closes dropdown after selection', () => {
    render(<CustomDropdown value="" options={['Alpha', 'Beta']} onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    fireEvent.click(screen.getByText('Alpha'));
    // Dropdown should be closed — "Beta" should not be visible
    expect(screen.queryByText('Beta')).toBeNull();
  });

  it('renders prefix when provided', () => {
    render(<CustomDropdown value="Rating" options={['Rating']} onChange={vi.fn()} prefix="Sort: " />);
    expect(screen.getByText('Sort:')).toBeDefined();
  });
});
