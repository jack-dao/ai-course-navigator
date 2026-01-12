import React, { useEffect, useRef, useState } from 'react';
import { Send, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import sammyChat from '../assets/sammy-chat.png';

const ChatSidebar = ({ onClose, messages = [], onSendMessage, isLoading, schoolName }) => {
  const [input, setInput] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC]">
      {/* Desktop only header */}
      <div className="hidden md:flex items-center gap-4 px-5 py-4 bg-[#003C6C] border-b border-[#FDC700]">
        {/* Bigger logo */}
        <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-visible">
          <img
            src={sammyChat}
            alt="Sammy"
            className="w-full h-full object-contain drop-shadow-sm scale-[2.35] origin-center"
            draggable={false}
          />
        </div>

        <div className="min-w-0">
          <div className="text-white font-extrabold text-lg leading-tight">Sammy AI</div>
          <div className="text-white/80 text-sm font-semibold leading-tight">
            {(schoolName || 'UCSC')} academic advisor
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div
        ref={chatContainerRef}
        className={`flex-1 min-h-0 overscroll-contain custom-scrollbar px-4 md:px-5 py-5 ${
          messages.length === 0 ? 'overflow-y-auto md:overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        {messages.length === 0 ? (
          <div className="min-h-full flex flex-col justify-center md:justify-start">
            <div className="w-full max-w-[420px] mx-auto pt-4 md:pt-3 pb-6 md:pb-16">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-3xl font-black text-[#003C6C] tracking-tight">
                  How can I help?
                </h2>

                <p className="mt-3 text-base font-medium text-slate-600 leading-relaxed">
                  Ask for easy classes, conflict free schedules, or ways to avoid early lectures.
                </p>
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold text-slate-400 mb-3">Suggested prompts</p>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      !isLoading && onSendMessage('What is an easy GE to take that fits in with my schedule?')
                    }
                    className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all flex items-start gap-3"
                    disabled={isLoading}
                  >
                    <div className="flex-1">
                      <div className="text-base font-extrabold text-slate-800">Find an easy GE</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">
                        That fits my current schedule
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 mt-1" />
                  </button>

                  <button
                    onClick={() => !isLoading && onSendMessage('Build a schedule with no Friday classes')}
                    className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all flex items-start gap-3"
                    disabled={isLoading}
                  >
                    <div className="flex-1">
                      <div className="text-base font-extrabold text-slate-800">No Friday classes</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Maximize my weekend</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 mt-1" />
                  </button>

                  <button
                    onClick={() => !isLoading && onSendMessage('What should I take to balance my course workload?')}
                    className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all flex items-start gap-3"
                    disabled={isLoading}
                  >
                    <div className="flex-1">
                      <div className="text-base font-extrabold text-slate-800">Balance workload</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">
                        Mix major reqs with lighter classes
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 mt-1" />
                  </button>
                </div>

                <p className="mt-6 text-sm font-semibold text-slate-400 text-center">
                  Tip: mention units, days, and any “no mornings” rules you have.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`select-text max-w-[92%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-[#003C6C] text-white rounded-br-md'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_strong]:text-[#003C6C]">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-4 md:px-5 py-4 shrink-0">
        {/* The input pill is now the container, so the button is always perfectly centered */}
        <div className="w-full min-h-[54px] flex items-center gap-3 px-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:bg-white focus-within:border-[#003C6C] transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) handleSend();
              }
            }}
            rows={1}
            placeholder={isLoading ? 'Sammy is thinking...' : 'Ask a question...'}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 py-3 leading-5"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 shrink-0 rounded-xl bg-[#FDC700] text-[#003C6C] flex items-center justify-center shadow-sm hover:bg-[#e5b600] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden md:block mt-2 text-xs font-semibold text-slate-400">
          Enter to send, Shift plus Enter for a new line
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
