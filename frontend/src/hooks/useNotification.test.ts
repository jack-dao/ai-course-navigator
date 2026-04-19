import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from './useNotification';

describe('useNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with null notification', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification).toBeNull();
  });

  it('sets a success notification after the 10ms delay', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showNotification('Saved!');
    });

    // Before the 10ms setTimeout fires, notification is null (cleared synchronously)
    expect(result.current.notification).toBeNull();

    // Advance past the 10ms delay
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification).toEqual({
      message: 'Saved!',
      type: 'success',
    });
  });

  it('sets an error notification with explicit type', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showNotification('Something went wrong', 'error');
    });

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification).toEqual({
      message: 'Something went wrong',
      type: 'error',
    });
  });

  it('auto-dismisses the notification after 3000ms', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showNotification('Temporary message');
    });

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification).not.toBeNull();

    // Advance to 3000ms total (the dismiss timer)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notification).toBeNull();
  });

  it('replaces a previous notification when called again', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showNotification('First message');
    });

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification?.message).toBe('First message');

    // Call again with a new message
    act(() => {
      result.current.showNotification('Second message', 'info');
    });

    // The first call sets notification to null synchronously
    expect(result.current.notification).toBeNull();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification).toEqual({
      message: 'Second message',
      type: 'info',
    });
  });

  it('clears the old dismiss timer when a new notification is shown', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showNotification('First');
    });

    act(() => {
      vi.advanceTimersByTime(10);
    });

    // After 2 seconds, show a new notification (before first one auto-dismisses)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.showNotification('Second');
    });

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.notification?.message).toBe('Second');

    // The old 3000ms timer would have fired at t=3000, but it was cleared.
    // Advance 1000ms more (total ~3010ms from second call start)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Second notification should still be visible (only ~1010ms since it was shown)
    expect(result.current.notification?.message).toBe('Second');

    // Advance the remaining time for the second notification's 3000ms timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.notification).toBeNull();
  });
});
