import React, { useEffect } from 'react'; 
import { X, Bot, MessageSquare } from 'lucide-react'; 

const ChatSidebar = ({ 
  isOpen,           
  onClose,          
  messages,         
  onSendMessage,    
  schoolName        
}) => {
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input); 
    setInput('');         
  };
  
  if (!isOpen) return null;

  return (
    <div className="w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-200px)] sticky top-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm group">
            <Bot className="w-5 h-5 text-white group-hover:animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">AI Assistant</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{schoolName}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm font-medium leading-relaxed ${
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-none'
            }`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about courses and scheduling advice"
            className="flex-1 pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim()}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;