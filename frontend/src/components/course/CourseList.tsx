import React from 'react';
import { Search, BookOpen } from 'lucide-react';
import CourseCard from './CourseCard';
import type { Course, Section, CourseFilters, ProfessorRatingsMap } from '../../types';

interface CourseListProps {
  searchQuery: string;
  setSearchQuery?: (q: string) => void;
  processedCourses: Course[];
  onAdd: (course: Course, section: Section) => void;
  filters: CourseFilters;
  professorRatings: ProfessorRatingsMap;
  onShowProfessor: (name: string) => void;
  sortOption: string;
}

const CourseList = ({
  searchQuery,
  processedCourses,
  onAdd,
  filters,
  professorRatings,
  onShowProfessor,
  sortOption,
}: CourseListProps) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {processedCourses.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No courses found</h3>
                <p className="text-gray-500 text-sm">We couldn't find anything matching "{searchQuery}"</p>
              </>
            ) : (
              <>
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Browse the Catalog</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Start typing to find classes.</p>
              </>
            )}
          </div>
        ) : (
          processedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onAdd={onAdd}
              filters={filters}
              professorRatings={professorRatings}
              onShowProfessor={onShowProfessor}
              sortOption={sortOption}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CourseList;
