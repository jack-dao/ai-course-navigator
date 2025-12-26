import React from 'react';
import { X } from 'lucide-react';

const ScheduleList = ({ selectedCourses, onRemove }) => {
  const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Selected ({totalCredits} units)</h2>
      {selectedCourses.length === 0 ? (
          <div className="text-gray-500 italic">No courses added yet.</div>
      ) : (
          selectedCourses.map(course => (
          <div key={course.code} className="border p-4 rounded-lg flex justify-between mb-2 bg-gray-50">
              <div>
                  <h3 className="font-bold text-gray-800">{course.code}</h3>
                  <p className="text-sm text-gray-600">{course.name}</p>
                  
                  <p className="text-sm text-blue-700 mt-2 font-medium">
                      {course.selectedSection ? 
                          `Section ${course.selectedSection.sectionCode}: ${course.selectedSection.days} ${course.selectedSection.time}` : 
                          'No section selected'}
                  </p>
                  
                  {course.selectedSection?.selectedLab && (
                      <p className="text-sm text-indigo-700 ml-2 mt-1">
                          ↳ Lab: {course.selectedSection.selectedLab.sectionCode} • {course.selectedSection.selectedLab.days} {course.selectedSection.selectedLab.time}
                      </p>
                  )}
              </div>
              <button 
                onClick={() => onRemove(course.code)} 
                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors h-10 w-10 flex items-center justify-center"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>
          ))
      )}
    </div>
  );
};

export default ScheduleList;