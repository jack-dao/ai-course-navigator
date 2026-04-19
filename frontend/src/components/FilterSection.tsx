import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
}

const FilterSection = ({ title, children, isOpen = true }: FilterSectionProps) => {
  const [open, setOpen] = useState(isOpen);
  return (
    <div className="border-b border-slate-100 py-6 last:border-0">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center justify-between w-full mb-4 group cursor-pointer outline-none"
      >
        <h4 className="font-bold text-sm text-[#003C6C] group-hover:text-[#FDC700] transition-colors">{title}</h4>
        {open ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>
      {open && <div className="space-y-3 animate-in slide-in-from-top-1">{children}</div>}
    </div>
  );
};

export default FilterSection;