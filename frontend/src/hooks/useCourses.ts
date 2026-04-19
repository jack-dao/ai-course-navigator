import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { apiFetch } from '../utils/api';
import type { Course, ProfessorRatingsMap } from '../types';

export const useCourses = (selectedTerm: string) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [professorRatings, setProfessorRatings] = useState<ProfessorRatingsMap>({});
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchCourses = async () => {
      if (!selectedTerm) return;

      const cacheKeyCourses = `courses_${selectedTerm}`;
      const cacheKeyRatings = `ratings`;

      try {
        const cachedCourses = await get<Course[]>(cacheKeyCourses);
        const cachedRatings = await get<ProfessorRatingsMap>(cacheKeyRatings);

        if (isActive && cachedCourses && cachedCourses.length > 0) {
          setAvailableCourses(cachedCourses);
          if (cachedRatings) setProfessorRatings(cachedRatings);
          setIsCoursesLoading(false);
          setIsBackgroundFetching(true);
        } else if (isActive) {
          setIsCoursesLoading(true);
        }
      } catch (e) {
        console.warn("Cache read failed", e);
        if (isActive) setIsCoursesLoading(true);
      }

      try {
        const [cRes, rRes] = await Promise.all([
          apiFetch(`/api/courses?term=${encodeURIComponent(selectedTerm)}`),
          apiFetch('/api/ratings')
        ]);

        if (isActive && cRes.ok) {
          const courses: Course[] = await cRes.json();
          setAvailableCourses(courses);
          set(cacheKeyCourses, courses).catch(err => console.warn('Cache failed', err));
        }
        if (isActive && rRes.ok) {
          const ratings: ProfessorRatingsMap = await rRes.json();
          setProfessorRatings(ratings);
          set(cacheKeyRatings, ratings).catch(err => console.warn('Cache failed', err));
        }
      } catch (e) {
        console.error("Network Load Error:", e);
      } finally {
        if (isActive) {
          setIsCoursesLoading(false);
          setIsBackgroundFetching(false);
        }
      }
    };

    fetchCourses();

    return () => { isActive = false; };
  }, [selectedTerm]);

  return { availableCourses, professorRatings, isCoursesLoading, isBackgroundFetching };
};
