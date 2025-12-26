// src/components/CourseCard.jsx
import React, { useState } from 'react';
import { Clock, User, Plus, Check } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor }) => {
  const [selectedLabs, setSelectedLabs] = useState({});

  // HELPER: Format "Moulds,G.B." -> "Moulds, G.B."
  const formatInstructor = (name) => {
    if (!name) return "Staff";
    return name.replace(/,/g, ', ');
  };

  const handleLabSelection = (lectureId, labId) => {
    setSelectedLabs(prev => ({
      ...prev,
      [lectureId]: labId
    }));
  };

  const handleAddClick = (section) => {
    const hasLabs = section.subSections && section.subSections.length > 0;
    const selectedLabId = selectedLabs[section.id];
    let finalSectionData = section;

    if (hasLabs) {
       if (!selectedLabId) {
         alert("Please select a Lab/Discussion section first.");
         return;
       }
       const lab = section.subSections.find(l => l.id === parseInt(selectedLabId));
       finalSectionData = { ...section, selectedLab: lab };
    }
    onAdd(course, finalSectionData);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm">
      
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{course.code}</h3>
            <p className="text-gray-600 font-medium">{course.name}</p>
          </div>
          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded">
            {course.credits} Units
          </div>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-4">
        {course.sections && course.sections.length > 0 ? (
          course.sections.map((section) => {
             const hasLabs = section.subSections && section.subSections.length > 0;
             const isLabSelected = selectedLabs[section.id];

             return (
              <div key={section.id} className="group">
                <div className="flex items-start justify-between gap-4">
                  
                  {/* LEFT: Lecture Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 text-sm">Section {section.sectionNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        section.status === 'Open' ? 'bg-green-100 text-green-700' : 
                        section.status === 'Wait List' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {section.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {/* USE THE FORMATTER HERE */}
                        <span className="truncate max-w-[150px]" title={section.instructor}>
                          {formatInstructor(section.instructor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{section.days} {section.startTime}-{section.endTime}</span>
                      </div>
                    </div>
                    
                    {/* LAB DROPDOWN */}
                    {hasLabs && (
                        <div className="mt-3">
                            <select 
                                className="w-full text-xs border border-gray-300 rounded p-1.5 bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={selectedLabs[section.id] || ""}
                                onChange={(e) => handleLabSelection(section.id, e.target.value)}
                            >
                                <option value="">-- Select a Lab/Discussion --</option>
                                {section.subSections.map(lab => (
                                    <option key={lab.id} value={lab.id}>
                                        {lab.sectionNumber} • {lab.days} {lab.startTime} • {formatInstructor(lab.instructor)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                  </div>

                  {/* RIGHT: Add Button */}
                  <button
                    onClick={() => handleAddClick(section)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                       hasLabs && !isLabSelected 
                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                       : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    }`}
                    disabled={hasLabs && !isLabSelected}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="h-px bg-gray-100 mt-4 group-last:hidden" />
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 text-sm py-2">No sections available</div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;