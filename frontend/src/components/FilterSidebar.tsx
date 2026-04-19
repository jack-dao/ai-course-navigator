import React from 'react';
import { RotateCcw, Star, List, X } from 'lucide-react';
import { DEPARTMENTS } from '../utils/departments';
import CustomDropdown from './CustomDropdown';
import FilterSection from './FilterSection';
import type { CourseFilters } from '../types';

interface FilterSidebarProps {
    filters: CourseFilters;
    setFilters: React.Dispatch<React.SetStateAction<CourseFilters>>;
    onReset: () => void;
    activeTab: string;
    onClose?: () => void;
}

const FilterSidebar = ({
    filters,
    setFilters,
    onReset,
    activeTab,
    onClose
}: FilterSidebarProps) => {

    const formatHour = (h: number): string => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:00 ${ampm}`;
    };

    const toggleDay = (day: string) => {
        setFilters(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const handleTimeChange = (index: number, value: string) => {
        const newRange: [number, number] = [...filters.timeRange];
        newRange[index] = parseInt(value);
        if (newRange[0] > newRange[1]) {
            if (index === 0) newRange[1] = newRange[0];
            else newRange[0] = newRange[1];
        }
        setFilters(prev => ({ ...prev, timeRange: newRange }));
    };

    if (activeTab === 'schedule') {
        return (
            <aside className="hidden md:flex w-[260px] shrink-0 sticky top-[80px] h-[calc(100vh-80px)] border-r border-slate-100 bg-white p-6 z-40 flex-col items-center justify-center text-slate-400">
                <List className="w-12 h-12 mb-2 opacity-50" />
                <p className="font-bold text-sm">Viewing Schedule</p>
            </aside>
        );
    }

    return (
        // ⚡️ FIX: Removed 'p-6' from here so the header is flush with the top
        <aside className="w-full md:w-[260px] h-full md:h-[calc(100vh-80px)] md:sticky md:top-[80px] shrink-0 overflow-y-auto custom-scrollbar md:border-r border-slate-100 bg-white md:z-40 relative">

            {/* Header: Flush at the top with its own padding */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <h3 className="font-bold text-2xl text-[#003C6C]">Filters</h3>
                </div>
                <button onClick={onReset} className="text-sm font-bold text-slate-500 hover:text-rose-500 hover:underline transition-colors flex items-center gap-1 cursor-pointer">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* ⚡️ FIX: Added content wrapper with padding so filters aren't squished */}
            <div className="p-6 pt-2">
                <FilterSection title="Department">
                    <CustomDropdown
                        value={filters.department !== 'All Departments' ? filters.department : ''}
                        placeholder="All Departments"
                        options={DEPARTMENTS.map(d => d.name)}
                        onChange={(val: string) => setFilters(prev => ({...prev, department: val}))}
                    />
                </FilterSection>

                <FilterSection title="Days">
                    <div className="flex justify-between gap-1">
                        {['M', 'Tu', 'W', 'Th', 'F'].map(day => (
                            <button key={day} onClick={() => toggleDay(day)} className={`w-10 h-10 rounded-xl text-[10px] font-bold transition-all border-2 shadow-sm cursor-pointer ${filters.days.includes(day) ? 'bg-[#003C6C] text-white border-[#003C6C] shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-[#FDC700] hover:text-[#003C6C]'}`}>{day}</button>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Units">
                    <div className="px-2 py-4">
                        <div className="relative h-4 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full">
                                <div className="absolute h-full bg-[#FDC700] opacity-60 rounded-full left-0" style={{ width: `${(filters.minUnits / 10) * 100}%` }} />
                            </div>
                            <input type="range" min="0" max="10" step="1" value={filters.minUnits} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minUnits: parseInt(e.target.value) }))} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#003C6C] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-md z-20"/>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4">
                            <span>0</span>
                            <span>{filters.minUnits > 0 ? `${filters.minUnits} Units` : 'Any'}</span>
                            <span>10</span>
                        </div>
                    </div>
                </FilterSection>

                <FilterSection title="Time Range">
                    <div className="px-2 py-4">
                        <div className="relative h-4 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full">
                                <div className="absolute h-full bg-[#FDC700] opacity-60 rounded-full" style={{ left: `${(filters.timeRange[0] - 7) / 16 * 100}%`, right: `${100 - ((filters.timeRange[1] - 7) / 16 * 100)}%` }} />
                            </div>
                            <input type="range" min="7" max="23" step="1" value={filters.timeRange[0]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(0, e.target.value)} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#003C6C] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-md z-20"/>
                            <input type="range" min="7" max="23" step="1" value={filters.timeRange[1]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(1, e.target.value)} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#003C6C] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-md z-20"/>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4">
                            <span>{formatHour(filters.timeRange[0])}</span>
                            <span>{formatHour(filters.timeRange[1])}</span>
                        </div>
                    </div>

                </FilterSection>

                            <FilterSection title="Instructor Rating">
                    <div className="px-2 py-2">
                        <input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({...prev, minRating: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#003C6C]" />
                        <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500">
                            <span className="opacity-50">Any</span>
                            <div className="flex items-center gap-1 text-[#003C6C]"><span className="text-lg font-black">{filters.minRating}+</span><Star className="w-3 h-3 fill-[#FDC700] text-[#FDC700]" /></div>
                            <span className="opacity-50">5.0</span>
                        </div>
                    </div>
                </FilterSection>

                <FilterSection title="Availability">
                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#FDC700] transition-all">
                        <input type="checkbox" checked={filters.openOnly} onChange={() => setFilters(prev => ({...prev, openOnly: !prev.openOnly}))} className="accent-[#003C6C] cursor-pointer w-4 h-4" />
                        <span className="text-xs font-bold text-slate-700">Open Classes Only</span>
                    </label>
                </FilterSection>
            </div>
        </aside>
    );
};

export default FilterSidebar;
