import React, { useEffect, useRef } from 'react';
import { X, Send, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import sammyChat from '../assets/sammy-chat.png';

const ChatSidebar = ({ onClose, messages, onSendMessage, isLoading, schoolName }) => {
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
    <div className="w-full h-full bg-slate-50 flex flex-col relative">
      
      {/* ⚡️ FIX: Floating Close Button (Visible only on mobile) */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 md:hidden"
      >
        <X className="w-5 h-5" />
      </button>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar bg-[#F8FAFC]">
        
        {/* ⚡️ FIX: Integrated Branding (Sammy Image inside chat) */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
             <div className="relative w-32 h-32 md:w-40 md:h-40 mb-4">
                {/* Yellow Glow Effect behind Sammy */}
                <div className="absolute inset-0 bg-[#FDC700]/20 blur-2xl rounded-full" />
                <img
                  src={sammyChat}
                  alt="Sammy"
                  className="relative w-full h-full object-contain drop-shadow-xl z-10"
                />
             </div>
             <h3 className="font-black text-[#003C6C] text-2xl tracking-tight mb-1">Sammy AI</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">{schoolName || 'UCSC'} Academic Advisor</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-start px-2">
            <div className="text-center mb-8 opacity-80">
              <p className="text-sm font-medium text-slate-500 max-w-[260px] mx-auto leading-relaxed">
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
          <div className="space-y-6 pt-4">
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

      <div className="p-4 md:p-5 bg-white border-t border-slate-100 shrink-0">
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