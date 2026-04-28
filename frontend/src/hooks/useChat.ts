import { useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authFetch } from '../utils/api';
import type { ChatMessage, SelectedCourse } from '../types';

export const useChat = (selectedTerm: string, selectedCourses: SelectedCourse[], session: Session | null) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!session) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'user' as const, text },
          { role: 'assistant' as const, text: 'Please sign in to chat with Sammy.' },
        ]);
        return;
      }

      setIsChatLoading(true);

      setChatMessages((prev) => [
        ...prev,
        { role: 'user' as const, text },
        { role: 'assistant' as const, text: 'Sammy is thinking...' },
      ]);

      try {
        const response = await authFetch('/api/chat', session, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            term: selectedTerm,
            userSchedule: selectedCourses.map((c) => ({
              code: c.code,
              name: c.name,
              days: c.selectedSection?.days,
              times: c.selectedSection ? `${c.selectedSection.startTime}-${c.selectedSection.endTime}` : 'TBA',
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Server connection failed');
        }

        if (!response.body) {
          throw new Error('Empty response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botReply = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          botReply += chunkText;

          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: botReply };
            return updated;
          });
        }
      } catch (error) {
        console.error('Streaming Error:', error);
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: 'Sorry, I had trouble connecting to the server. Please try again.',
          };
          return updated;
        });
      } finally {
        setIsChatLoading(false);
      }
    },
    [selectedTerm, selectedCourses, session]
  );

  return { chatMessages, isChatLoading, handleSendMessage };
};
