import React, { useEffect, useRef } from 'react';
import { X, Send, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import sammyChat from '../assets/sammy-chat.png';

const ChatSidebar = ({ onClose, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = React.useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col">
      <div className="p-6 border-b border-[#FDC700] bg-gradient-to-r from-[#003C6C] to-[#00508c] flex items-center justify-between shrink-0 shadow-sm relative z-10 overflow-visible h-[88px]">
        <div className="flex items-center pl-32 relative w-full">
          <img
            src={sammyChat}
            alt="Sammy"
            className="absolute -left-8 top-1/2 -translate-y-1/2 w-48 h-48 object-contain drop-shadow-2xl hover:scale-105 transition-transform z-20 pointer-events-none"
          />

          <div className="relative z-10">
            <h3 className="font-bold text-white text-xl tracking-tight">Sammy AI</h3>
            <p className="text-xs font-bold text-blue-200">Academic Advisor</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/70 hover:text-white z-30"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#F8FAFC]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center px-2">
            <div className="text-center mb-8 opacity-80">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-200">
                <Sparkles className="w-8 h-8 text-[#003C6C]" />
              </div>
              <h4 className="font-black text-slate-700 text-lg mb-2">How can I help you?</h4>
              <p className="text-xs font-bold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                I can help you find easy classes, build the perfect schedule, or avoid 8am lectures.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 ml-1 mb-2">Suggested Prompts</p>

              <button
                onClick={() =>
                  !isLoading && onSendMessage('What is an easy GE to take that fits in with my schedule?')
                }
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all group flex items-start gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-[#003C6C] transition-colors">
                    Find an easy GE
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">That fits my current schedule</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#FDC700] mt-1" />
              </button>

              <button
                onClick={() => !isLoading && onSendMessage('Build a schedule with no Friday classes')}
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all group flex items-start gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-[#003C6C] transition-colors">
                    No Friday classes
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Maximize my weekend</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#FDC700] mt-1" />
              </button>

              <button
                onClick={() => !isLoading && onSendMessage('What should I take to balance our course workload?')}
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#FDC700] hover:shadow-md transition-all group flex items-start gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-[#003C6C] transition-colors">
                    Balance workload
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    Mix major reqs with lighter classes
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#FDC700] mt-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`select-text max-w-[85%] rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#003C6C] text-white rounded-br-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&_strong]:text-[#003C6C]">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-slate-100 shrink-0">
        <div className="flex gap-2 relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!isLoading) handleSend();
              }
            }}
            placeholder={isLoading ? 'Sammy is thinking...' : 'Ask a question...'}
            className="flex-1 pl-5 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003C6C] focus:ring-0 outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#FDC700] text-[#003C6C] rounded-xl hover:bg-[#e5b600] transition-all shadow-sm active:scale-95 disabled:opacity-0 disabled:scale-50"
          >
            <Send className="w-4 h-4 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;