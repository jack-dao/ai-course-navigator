import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export const useChat = (selectedTerm, selectedCourses) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = useCallback(async (text) => {
    setIsChatLoading(true);

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: "Sammy is thinking..." }
    ]);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          term: selectedTerm,
          userSchedule: selectedCourses.map(c => ({
            code: c.code,
            name: c.name,
            days: c.selectedSection?.days,
            times: c.selectedSection ? `${c.selectedSection.startTime}-${c.selectedSection.endTime}` : 'TBA'
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Server connection failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        botReply += chunkText;

        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: botReply };
          return updated;
        });
      }

    } catch (error) {
      console.error("Streaming Error:", error);
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], text: "Sorry, I had trouble connecting to the server. Please try again." };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  }, [selectedTerm, selectedCourses]);

  return { chatMessages, isChatLoading, handleSendMessage };
};
