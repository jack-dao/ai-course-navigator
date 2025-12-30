import React, { useEffect, useRef } from 'react'; 
import { X, Bot, Send, Sparkles } from 'lucide-react'; 

const ChatSidebar = ({ 
  isOpen,           
  onClose,          
  messages,         
  onSendMessage,    
  schoolName        
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input); 
    setInput('');         
  };
  
  if (!isOpen) return null;

  return (
    <div className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[calc(100vh-140px)] sticky top-24 overflow-hidden animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="p-5 border-b border-[#FDC700] bg-gradient-to-r from-[#003C6C] to-[#00508c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm">
            <Bot className="w-6 h-6 text-[#FDC700]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Sammy AI</h3>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Academic Advisor</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center py-10 opacity-60">
                <Sparkles className="w-12 h-12 text-[#003C6C] mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">Ask me about GEs, easy professors, or schedule planning!</p>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#003C6C] text-white rounded-br-sm' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
            }`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex gap-2 relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question..."
            className="flex-1 pl-5 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003C6C] focus:ring-0 outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
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