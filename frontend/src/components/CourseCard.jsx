import React, { useState } from 'react';
import { Clock, Plus, Star, MapPin, Users, ChevronDown } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor }) => {
  const [selectedSubSections, setSelectedSubSections] = useState({});
  const [errors, setErrors] = useState({});

  // Helper: Strip leading zero (05:20 -> 5:20)
  const formatTime = (time) => {
    if (!time) return '';
    return time.replace(/^0/, '');
  };

  // Helper: Proper case for locations
  const formatLocation = (loc) => {
    if (!loc) return 'Location TBA';
    return loc.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatInstructor = (name) => {
    if (!name) return 'Staff';
    return name.replace(/,/g, ', ');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5`}>
        {[...Array(5)].map((_, i) => {
          const fillPercent = Math.min(Math.max((rating - i) * 100, 0), 100);
          return (
            <div key={i} className="relative">
              <Star className="w-3.5 h-3.5 text-slate-200" />
              <div className="absolute top-0 left-0 overflow-hidden h-full" style={{ width: `${fillPercent}%` }}>
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getCapacityStyles = (enrolled, capacity) => {
    const ratio = capacity > 0 ? enrolled / capacity : 0;
    if (ratio >= 1) return 'text-rose-600';
    if (ratio >= 0.85) return 'text-amber-600';
    return 'text-indigo-600';
  };

  const handleAddClick = (section) => {
    const hasDiscussions = section.subSections && section.subSections.length > 0;
    if (hasDiscussions) {
      const selectedId = selectedSubSections[section.id];
      if (!selectedId) {
        setErrors(prev => ({ ...prev, [section.id]: true }));
        return;
      }
      const discussion = section.subSections.find(s => String(s.id) === String(selectedId));
      onAdd(course, { ...section, selectedLab: discussion });
    } else {
      onAdd(course, section);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all mb-6 overflow-hidden">
      
      {/* HEADER: Tighter Padding & Noticeable Units */}
      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{course.code}</h3>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <p className="text-slate-500 font-bold text-sm tracking-tight hidden sm:block">{course.name}</p>
        </div>
        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm">
          {course.credits} Units
        </span>
      </div>

      {/* GRID HEADERS: Legible colors, No all-caps */}
      <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.2fr_180px] px-8 py-3 bg-white border-b border-slate-50 text-[11px] font-bold text-slate-400">
        <span>Instructor & Metrics</span>
        <span>Schedule & Location</span>
        <span>Availability</span>
        <span className="text-right pr-4">Action</span>
      </div>

      <div className="divide-y divide-slate-50">
        {course.sections?.map((section) => {
          const hasDiscussions = section.subSections && section.subSections.length > 0;
          const ratingData = professorRatings && professorRatings[section.instructor];
          const fillPercentage = Math.min((section.enrolled / section.capacity) * 100, 100);
          const hasError = errors[section.id];

          return (
            <div key={section.id} className="p-6 lg:px-8 hover:bg-indigo-50/5 transition-colors group">
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.2fr_180px] items-start lg:items-center gap-8">
                
                {/* INSTRUCTOR: Indigo Text */}
                <div className="space-y-2">
                  <button 
                    onClick={() => onShowProfessor(section.instructor, ratingData)}
                    className="text-[17px] font-bold text-indigo-600 hover:underline cursor-pointer transition-all text-left leading-none tracking-tight"
                  >
                    {formatInstructor(section.instructor)}
                  </button>
                  {ratingData && (
                    <div className="flex items-center gap-3 bg-white w-fit px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                      {renderStars(ratingData.avgRating)}
                      <span className="text-xs font-bold text-slate-400">{ratingData.avgRating}</span>
                    </div>
                  )}
                </div>

                {/* SCHEDULE: Formatted Time & Case */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 leading-none">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>{section.days} • {formatTime(section.startTime)}—{formatTime(section.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    <span>{formatLocation(section.location)}</span>
                  </div>
                </div>

                {/* AVAILABILITY */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded border ${
                      section.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {section.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{section.enrolled}/{section.capacity}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${fillPercentage}%` }} />
                  </div>
                </div>

                {/* ACTION: Purple Button */}
                <div className="flex flex-col gap-2">
                  {hasDiscussions && (
                    <div className="relative">
                      <select 
                        className={`w-full text-xs font-bold border rounded-xl p-2.5 bg-white appearance-none outline-none transition-all cursor-pointer ${
                          hasError ? 'border-rose-300 bg-rose-50/50' : 'border-slate-100 hover:border-slate-300 focus:border-indigo-500'
                        }`}
                        value={selectedSubSections[section.id] || ""}
                        onChange={(e) => {
                          setSelectedSubSections(prev => ({ ...prev, [section.id]: e.target.value }));
                          setErrors(prev => ({ ...prev, [section.id]: false }));
                        }}
                      >
                        <option value="">Select Discussion...</option>
                        {section.subSections.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.sectionNumber} ({formatTime(sub.startTime)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleAddClick(section)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer transition-all hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
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