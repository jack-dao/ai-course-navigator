import { useState, useMemo, useEffect } from 'react';
import { DEPARTMENTS } from '../utils/departments';

export const useCourseFilters = (availableCourses, professorRatings) => {
  // 1. Initialize State from SessionStorage (so it survives refresh)
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('searchQuery') || '';
  });

  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem('courseFilters');
    return saved ? JSON.parse(saved) : {
      openOnly: false,
      minRating: 0,
      minUnits: 0,
      days: [],
      department: 'All Departments',
      sort: 'Best Match',
      timeRange: [7, 23]
    };
  });

  // 2. Save State to SessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('searchQuery', searchQuery);
    sessionStorage.setItem('courseFilters', JSON.stringify(filters));
  }, [searchQuery, filters]);

  const resetFilters = () => {
    const defaultFilters = {
      openOnly: false, minRating: 0, minUnits: 0, days: [],
      department: 'All Departments', sort: 'Best Match', timeRange: [7, 23]
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    
    // Clear storage
    sessionStorage.removeItem('searchQuery');
    sessionStorage.setItem('courseFilters', JSON.stringify(defaultFilters));
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)(AM|PM)/);
    if (!match) return null;
    let [_, h, m, period] = match;
    h = parseInt(h);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h + (parseInt(m) / 60);
  };

  const processedCourses = useMemo(() => {
    let results = [...availableCourses];
    const lowerQuery = searchQuery.toLowerCase();

    // 1. Department Filter
    if (filters.department !== 'All Departments') {
        const deptObj = DEPARTMENTS.find(d => d.name === filters.department);
        if (deptObj && deptObj.prefix) {
            results = results.filter(course => course.code.startsWith(deptObj.prefix));
        }
    }

    // 2. Search Logic (with Scoring)
    if (searchQuery) {
        results = results.map(course => {
            let score = 0;
            if (course.code.toLowerCase() === lowerQuery) score += 1000;
            else if (course.code.toLowerCase().includes(lowerQuery)) score += 100;
            if (course.sections?.some(sec => (sec.instructor || "").toLowerCase().includes(lowerQuery))) score += 50;
            if (course.name.toLowerCase().includes(lowerQuery)) score += 10;
            return { ...course, _searchScore: score };
        }).filter(c => c._searchScore > 0);
    }

    // 3. Filters
    if (filters.openOnly) {
        results = results.filter(course => course.sections?.some(sec => sec.status !== 'Closed' && sec.status !== 'Wait List'));
    }
    if (filters.minUnits > 0) {
        results = results.filter(course => parseInt(course.credits) === filters.minUnits);
    }
    if (filters.days.length > 0) {
        results = results.filter(course => course.sections?.some(sec => {
            const secDays = sec.days || ""; 
            return filters.days.some(day => secDays.includes(day));
        }));
    }
    if (filters.timeRange[0] > 7 || filters.timeRange[1] < 23) {
        results = results.filter(course => course.sections?.some(sec => {
            const start = parseTime(sec.startTime);
            const end = parseTime(sec.endTime);
            // ⚡️ FIX: If time is NULL (TBA), exclude it when a specific range is requested
            if (start === null || end === null) return false;
            return start >= filters.timeRange[0] && end <= filters.timeRange[1];
        }));
    }
    if (filters.minRating > 0) {
        results = results.filter(course => course.sections?.some(sec => {
            const stats = professorRatings[sec.instructor];
            return stats && stats.avgRating >= filters.minRating;
        }));
    }

    // 4. Sorting Logic
    const getBestStats = (course) => {
        let maxRating = -1;
        let minDifficulty = 6;
        let hasData = false;
        course.sections?.forEach(sec => {
            const stats = professorRatings[sec.instructor];
            if (stats) {
                hasData = true;
                if (stats.avgRating > maxRating) maxRating = stats.avgRating;
                if (stats.avgDifficulty < minDifficulty && stats.avgDifficulty > 0) minDifficulty = stats.avgDifficulty;
            }
        });
        return { maxRating, minDifficulty, hasData };
    };

    if (filters.sort === 'Rating') {
        results.sort((a, b) => {
            const statsA = getBestStats(a);
            const statsB = getBestStats(b);
            if (!statsA.hasData) return 1; 
            if (!statsB.hasData) return -1;
            return statsB.maxRating - statsA.maxRating; 
        });
    } else if (filters.sort === 'Difficulty') {
        results.sort((a, b) => {
            const statsA = getBestStats(a);
            const statsB = getBestStats(b);
            if (!statsA.hasData) return 1;
            if (!statsB.hasData) return -1;
            return statsA.minDifficulty - statsB.minDifficulty;
        });
    } else {
        if (searchQuery) {
            results.sort((a, b) => b._searchScore - a._searchScore); 
        } else {
            results.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
        }
    }

    return results;
  }, [availableCourses, searchQuery, filters, professorRatings]);

  return { filters, setFilters, searchQuery, setSearchQuery, resetFilters, processedCourses };
};