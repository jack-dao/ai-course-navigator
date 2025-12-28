import React, { useState } from 'react';
import { Clock, User, Plus, Star, Users, CheckCircle2, MapPin, ChevronDown, AlertCircle } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor }) => {
  const [selectedLabs, setSelectedLabs] = useState({});

  const formatInstructor = (name) => {
    if (!name) return "Staff";
    return name.replace(/,/g, ', ');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          const fillPercent = Math.min(Math.max((rating - i) * 100, 0), 100);
          return (
            <div key={i} className="relative">
              <Star className="w-3.5 h-3.5 text-slate-200" />
              <div 
                className="absolute top-0 left-0 overflow-hidden h-full transition-all duration-500" 
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getCapacityStyles = (enrolled, capacity) => {
    if (!capacity || capacity === 0) return { text: 'text-slate-500', bar: 'bg-slate-200' };
    const ratio = enrolled / capacity;
    if (ratio >= 1) return { text: 'text-rose-600', bar: 'bg-rose-500' };
    if (ratio >= 0.85) return { text: 'text-amber-600', bar: 'bg-amber-500' };
    return { text: 'text-emerald-600', bar: 'bg-emerald-500' };
  };

  const handleAddClick = (section) => {
    const hasLabs = section.subSections && section.subSections.length > 0;
    const selectedLabId = selectedLabs[section.id];
    if (hasLabs && !selectedLabId) {
      alert("Please select a Lab/Discussion section first.");
      return;
    }
    const finalSectionData = hasLabs 
      ? { ...section, selectedLab: section.subSections.find(l => l.id === parseInt(selectedLabId)) }
      : section;
    onAdd(course, finalSectionData);
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 mb-6 overflow-hidden">
      
      {/* 1. HEADER: Bold hierarchy to break white space */}
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{course.code}</h3>
          <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-indigo-100">
            {course.credits} Units
          </span>
        </div>
        <p className="text-slate-500 font-bold text-sm tracking-tight">{course.name}</p>
      </div>

      {/* 2. GRID HEADERS: Solves the "Floaty" problem by aligning columns */}
      <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.5fr_160px] px-8 py-3 bg-white border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>Instructor & Rating</span>
        <span>Schedule & Location</span>
        <span>Availability</span>
        <span className="text-right pr-4">Action</span>
      </div>

      {/* 3. SECTIONS LIST */}
      <div className="divide-y divide-slate-50">
        {course.sections?.map((section) => {
          const hasLabs = section.subSections && section.subSections.length > 0;
          const isLabSelected = selectedLabs[section.id];
          const ratingData = professorRatings && professorRatings[section.instructor];
          const fillPercentage = Math.min((section.enrolled / section.capacity) * 100, 100);
          const capStyle = getCapacityStyles(section.enrolled, section.capacity);

          return (
            <div key={section.id} className="p-6 lg:px-8 hover:bg-indigo-50/10 transition-colors group">
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.5fr_160px] items-center gap-8">
                
                {/* COLUMN: INSTRUCTOR */}
                <div className="space-y-1.5">
                  <button 
                    onClick={() => onShowProfessor(section.instructor, ratingData)}
                    className="text-lg font-black text-slate-800 hover:text-indigo-600 transition-colors text-left block"
                  >
                    {formatInstructor(section.instructor)}
                  </button>
                  {ratingData && (
                    <div className="flex items-center gap-2">
                      {renderStars(ratingData.avgRating)}
                      <span className="text-xs font-bold text-slate-400">{ratingData.avgRating}</span>
                    </div>
                  )}
                </div>

                {/* COLUMN: SCHEDULE */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span>{section.days} {section.startTime}—{section.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    <span>{section.location || 'Location TBA'}</span>
                  </div>
                </div>

                {/* COLUMN: AVAILABILITY (Progress bar tied to numbers) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 font-black uppercase rounded-lg border shadow-sm ${
                      section.status === 'Open' ? 'bg-emerald-500 text-white border-emerald-600' : 
                      section.status === 'Wait List' ? 'bg-orange-500 text-white border-orange-600' : 'bg-rose-500 text-white border-rose-600'
                    }`}>
                      {section.status}
                    </span>
                    <span className={`text-xs font-black ${capStyle.text}`}>
                      {section.enrolled} / {section.capacity}
                    </span>
                  </div>
                  <div className="w-full lg:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${capStyle.bar}`} 
                      style={{ width: `${fillPercentage}%` }} 
                    />
                  </div>
                </div>

                {/* COLUMN: ACTION (Clear, labeled button) */}
                <div className="flex flex-col gap-2">
                  {hasLabs ? (
                    <div className="space-y-2">
                      <select 
                        className={`w-full text-[11px] font-black border-2 rounded-xl p-2.5 bg-white appearance-none outline-none transition-all cursor-pointer ${
                          !isLabSelected ? 'border-amber-200 bg-amber-50/30 text-amber-700 animate-pulse' : 'border-slate-100 focus:border-indigo-500'
                        }`}
                        value={selectedLabs[section.id] || ""}
                        onChange={(e) => setSelectedLabs(prev => ({ ...prev, [section.id]: e.target.value }))}
                      >
                        <option value="">Select Lab...</option>
                        {section.subSections.map(lab => (
                          <option key={lab.id} value={lab.id}>{lab.sectionNumber} • {lab.days} ({lab.enrolled}/{lab.capacity})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAddClick(section)}
                        className={`w-full py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                          !isLabSelected ? 'bg-slate-50 text-slate-300 border-slate-100 opacity-50 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                        }`}
                        disabled={!isLabSelected}
                      >
                        Add Class
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddClick(section)}
                      className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Class
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCard;