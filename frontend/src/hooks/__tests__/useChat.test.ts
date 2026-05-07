import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import type { Session } from '@supabase/supabase-js';

vi.mock('../../utils/api', () => ({
  authFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { authFetch } from '../../utils/api';
const mockAuthFetch = authFetch as ReturnType<typeof vi.fn>;

const mockSession = { access_token: 'test-token' } as Session;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useChat', () => {
  it('starts with empty messages and not loading', () => {
    const { result } = renderHook(() => useChat('2026 Spring', [], null));
    expect(result.current.chatMessages).toEqual([]);
    expect(result.current.isChatLoading).toBe(false);
  });

  it('adds sign-in prompt when no session', async () => {
    const { result } = renderHook(() => useChat('2026 Spring', [], null));

    await act(async () => {
      await result.current.handleSendMessage('Hello');
    });

    expect(result.current.chatMessages).toHaveLength(2);
    expect(result.current.chatMessages[0]).toEqual({ role: 'user', text: 'Hello' });
    expect(result.current.chatMessages[1].text).toContain('sign in');
  });

  it('does not call API when no session', async () => {
    const { result } = renderHook(() => useChat('2026 Spring', [], null));

    await act(async () => {
      await result.current.handleSendMessage('Hello');
    });

    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('adds user message and placeholder when session exists', async () => {
    // Mock a stream response
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Hi there!'));
        controller.close();
      },
    });
    mockAuthFetch.mockResolvedValue({ ok: true, body: stream });

    const { result } = renderHook(() => useChat('2026 Spring', [], mockSession));

    await act(async () => {
      await result.current.handleSendMessage('Help me');
    });

    expect(result.current.chatMessages[0]).toEqual({ role: 'user', text: 'Help me' });
    // Final message should contain the streamed response
    expect(result.current.chatMessages[1].role).toBe('assistant');
    expect(result.current.chatMessages[1].text).toBe('Hi there!');
  });

  it('sets loading state during API call', async () => {
    let resolveResponse: (value: unknown) => void;
    const pending = new Promise((r) => {
      resolveResponse = r;
    });
    mockAuthFetch.mockReturnValue(pending);

    const { result } = renderHook(() => useChat('2026 Spring', [], mockSession));

    // Start sending — don't await
    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.handleSendMessage('Test');
    });

    expect(result.current.isChatLoading).toBe(true);

    // Resolve with error to clean up
    await act(async () => {
      resolveResponse!({ ok: false });
      await sendPromise!;
    });

    expect(result.current.isChatLoading).toBe(false);
  });

  it('shows error message when API fails', async () => {
    mockAuthFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useChat('2026 Spring', [], mockSession));

    await act(async () => {
      await result.current.handleSendMessage('Hello');
    });

    const lastMsg = result.current.chatMessages[result.current.chatMessages.length - 1];
    expect(lastMsg.text).toContain('trouble connecting');
  });

  it('sends selected courses in request body', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
    mockAuthFetch.mockResolvedValue({ ok: true, body: stream });

    const courses = [
      {
        id: 1,
        code: 'CSE101',
        name: 'Algorithms',
        credits: 5,
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
          startTime: '10:00AM',
          endTime: '11:00AM',
          location: 'Room 101',
          status: 'Open',
          enrolled: 20,
          capacity: 30,
          instructor: 'Smith',
          instructionMode: 'In Person',
        },
      },
    ];

    const { result } = renderHook(() => useChat('2026 Spring', courses, mockSession));

    await act(async () => {
      await result.current.handleSendMessage('What fits?');
    });

    const callBody = JSON.parse(mockAuthFetch.mock.calls[0][2].body);
    expect(callBody.userSchedule[0].code).toBe('CSE101');
    expect(callBody.userSchedule[0].days).toBe('MWF');
    expect(callBody.term).toBe('2026 Spring');
  });
});
