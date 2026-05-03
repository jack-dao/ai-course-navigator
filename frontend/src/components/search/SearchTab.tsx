import { useState } from 'react';
import { Search, Filter, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { FilterSidebar } from '../filter';
import { CourseList } from '../course';
import { CustomDropdown } from '../common';
import type { Course, Section, CourseFilters, ProfessorRatingsMap } from '../../types';

const ITEMS_PER_PAGE = 20;

interface SearchTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: CourseFilters;
  setFilters: React.Dispatch<React.SetStateAction<CourseFilters>>;
  resetFilters: () => void;
  processedCourses: Course[];
  isCoursesLoading: boolean;
  isBackgroundFetching: boolean;
  selectedTerm: string;
  professorRatings: ProfessorRatingsMap;
  onAdd: (course: Course, section: Section) => void;
  onShowProfessor: (name: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const SearchTab = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  resetFilters,
  processedCourses,
  isCoursesLoading,
  isBackgroundFetching,
  selectedTerm,
  professorRatings,
  onAdd,
  onShowProfessor,
  showFilters,
  setShowFilters,
}: SearchTabProps) => {
  const [currentPage, setCurrentPage] = useState(() => parseInt(sessionStorage.getItem('currentPage') || '1') || 1);

  // Reset to page 1 when search or filters change
  const [prevSearch, setPrevSearch] = useState(searchQuery);
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevSearch !== searchQuery || prevFilters !== filters) {
    setCurrentPage(1);
    setPrevSearch(searchQuery);
    setPrevFilters(filters);
  }

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const currentCourses = processedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const scrollContainer = document.getElementById('search-results-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    sessionStorage.setItem('currentPage', String(page));
  };

  return (
    <>
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in slide-in-from-bottom-5 overflow-hidden pt-[70px] pb-[80px]">
          <div className="flex-1 overflow-y-auto">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              activeTab="search"
              onClose={() => setShowFilters(false)}
            />
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 py-4 border-b border-slate-100 bg-white z-30 shadow-sm shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
              className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${showFilters ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'}`}
            >
              <Filter className="w-5 h-5 text-slate-600" />
            </button>

            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ucsc-blue w-5 h-5 transition-colors" />
              <input
                type="text"
                placeholder="Search courses..."
                aria-label="Search courses"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-ucsc-blue outline-none transition-all shadow-sm bg-slate-50/50 text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  showFilters
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-ucsc-blue hover:text-ucsc-blue'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <CustomDropdown
                prefix="Sort: "
                value={filters.sort}
                options={['Best Match', 'Rating', 'Difficulty']}
                onChange={(val) => setFilters((prev) => ({ ...prev, sort: val as CourseFilters['sort'] }))}
                triggerClassName="flex items-center justify-between gap-2 bg-white border border-slate-200 hover:border-ucsc-blue rounded-full px-4 py-3 text-xs font-bold text-slate-600 hover:text-ucsc-blue transition-all cursor-pointer whitespace-nowrap min-w-[140px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-400">{processedCourses.length} results found</span>
              {isBackgroundFetching && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
            </div>
            <div className="md:hidden">
              <CustomDropdown
                value={filters.sort}
                options={['Best Match', 'Rating', 'Difficulty']}
                onChange={(val) => setFilters((prev) => ({ ...prev, sort: val as CourseFilters['sort'] }))}
                triggerClassName="flex items-center gap-1 text-xs font-bold text-slate-500 bg-transparent border-none p-0 cursor-pointer"
                prefix="Sort: "
              />
            </div>
          </div>
        </div>
      </div>

      <main id="search-results-container" className="flex-1 overflow-y-auto custom-scrollbar bg-white relative z-0">
        {isCoursesLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-ucsc-gold" />
            <p className="font-bold text-sm">Loading {selectedTerm}...</p>
          </div>
        ) : (
          <>
            <div className="p-4 md:p-8 grid grid-cols-1 gap-6">
              <CourseList
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                processedCourses={currentCourses}
                onAdd={onAdd}
                filters={filters}
                professorRatings={professorRatings}
                onShowProfessor={onShowProfessor}
                sortOption={filters.sort}
              />
            </div>
            {processedCourses.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-12 mb-8 px-4 md:px-8 border-t border-slate-200 pt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-default' : 'hover:border-ucsc-blue hover:text-ucsc-blue cursor-pointer'}`}
                >
                  Prev
                </button>
                <span className="font-bold text-slate-500 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-default' : 'hover:border-ucsc-blue hover:text-ucsc-blue cursor-pointer'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default SearchTab;
