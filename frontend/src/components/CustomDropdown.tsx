import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  triggerClassName?: string;
}

const CustomDropdown = ({ value, options, onChange, placeholder, prefix = "", triggerClassName }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClassName || "w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 hover:border-[#003C6C] transition-all shadow-sm active:scale-[0.99] cursor-pointer"}
      >
        <span className="truncate flex items-center gap-1">
            {prefix && <span className="text-slate-500 font-normal">{prefix}</span>}
            <span className={prefix ? "text-slate-900" : ""}>{value || placeholder}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[160px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-0.5 last:mb-0 transition-colors flex items-center justify-between cursor-pointer ${
                  value === opt 
                    ? 'bg-[#003C6C]/10 text-[#003C6C]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3 text-[#003C6C]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;