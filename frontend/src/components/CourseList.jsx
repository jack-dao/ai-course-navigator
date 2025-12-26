import React from 'react';
import { Search, BookOpen } from 'lucide-react'; // Added BookOpen icon
import CourseCard from './CourseCard';

const CourseList = ({ 
  searchQuery, 
  setSearchQuery, 
  processedCourses, 
  onAdd 
}) => {
  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by course name, code, or instructor..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {processedCourses.length === 0 ? (
          // --- EMPTY STATES ---
          <div className="text-center py-12">
            {searchQuery ? (
              // CASE 1: User typed something, but found nothing
              <>
                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                   <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No courses found</h3>
                <p className="text-gray-500 text-sm">
                  We couldn't find anything matching "{searchQuery}"
                </p>
              </>
            ) : (
              // CASE 2: Search is empty (Initial State or Empty DB)
              <>
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                   <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Browse the Catalog</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Start typing to find classes.
                </p>
              </>
            )}
          </div>
        ) : (
          // --- RESULTS LIST ---
          processedCourses.map(course => (
            <CourseCard 
              key={course.id}
              course={course}
              onAdd={onAdd}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CourseList;