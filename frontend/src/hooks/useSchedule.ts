import { useState, useEffect, useMemo, useRef } from 'react';
import { authFetch } from '../utils/api';
import type { User, Session } from '@supabase/supabase-js';
import type { SelectedCourse, Section, Course, SubSection } from '../types';

interface SavedCourseItem {
  code: string;
  sectionCode?: string;
  labCode?: string;
}

interface TimeSegment {
  days: string[];
  start: number | null;
  end: number | null;
}

export const useSchedule = (user: User | null, session: Session | null, availableCourses: Course[], selectedTerm: string) => {
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>(() => {
    try {
      const savedDraft = localStorage.getItem(`draft_${selectedTerm}`);
      return savedDraft ? JSON.parse(savedDraft) : [];
    } catch {
      return [];
    }
  });

  const [prevTerm, setPrevTerm] = useState(selectedTerm);

  if (selectedTerm !== prevTerm) {
    setPrevTerm(selectedTerm);
    try {
      const savedDraft = localStorage.getItem(`draft_${selectedTerm}`);
      setSelectedCourses(savedDraft ? JSON.parse(savedDraft) : []);
    } catch {
      setSelectedCourses([]);
    }
  }

  const fetchedTerms = useRef(new Set<string>());

  const totalUnits = useMemo(() => {
    return selectedCourses.reduce((acc: number, course: SelectedCourse) => {
      const units = parseInt(String(course.credits || 0));
      return acc + (isNaN(units) ? 0 : units);
    }, 0);
  }, [selectedCourses]);

  const parseTime = (timeStr: string | null | undefined): number | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)(AM|PM)/);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3];
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h + (m / 60);
  };

  const getDaysArray = (dayStr: string | null | undefined): string[] => {
    if (!dayStr || dayStr === 'TBA') return [];
    return dayStr.match(/Tu|Th|Sa|Su|M|W|F/g) || [];
  };

  const checkForConflicts = (newSection: Section, existingCourses: SelectedCourse[], ignoreCode: string): string | null => {
    const getSegments = (sec: Section | SubSection | undefined): TimeSegment[] => {
      const segments: TimeSegment[] = [];
      if (!sec) return segments;
      if (sec.days && sec.startTime && sec.endTime) {
        segments.push({ days: getDaysArray(sec.days), start: parseTime(sec.startTime), end: parseTime(sec.endTime) });
      }
      if ('selectedLab' in sec && sec.selectedLab && sec.selectedLab.days && sec.selectedLab.startTime && sec.selectedLab.endTime) {
        segments.push({ days: getDaysArray(sec.selectedLab.days), start: parseTime(sec.selectedLab.startTime), end: parseTime(sec.selectedLab.endTime) });
      }
      return segments;
    };

    const newSegments = getSegments(newSection);
    for (const existing of existingCourses) {
      if (existing.code === ignoreCode) continue;
      const existingSegments = getSegments(existing.selectedSection);
      for (const newSeg of newSegments) {
        for (const exSeg of existingSegments) {
          const dayOverlap = newSeg.days.some(d => exSeg.days.includes(d));
          if (dayOverlap) {
            if (newSeg.start !== null && newSeg.end !== null && exSeg.start !== null && exSeg.end !== null) {
              if (newSeg.start < exSeg.end && newSeg.end > exSeg.start) {
                return existing.code;
              }
            }
          }
        }
      }
    }
    return null;
  };

  const restoreScheduleFromData = (savedCourses: SavedCourseItem[], allCourses: Course[]): SelectedCourse[] => {
    if (!savedCourses || !Array.isArray(savedCourses)) return [];
    if (!allCourses || allCourses.length === 0) return [];
    return savedCourses.map(savedItem => {
      const courseCode = typeof savedItem === 'string' ? savedItem : savedItem.code;
      const originalCourse = allCourses.find(c => c.code === courseCode);
      if (!originalCourse) return null;
      let restoredSection = originalCourse.sections?.find(s => String(s.sectionCode) === String(savedItem.sectionCode));
      if (restoredSection && savedItem.labCode && restoredSection.subSections) {
        const restoredLab = restoredSection.subSections.find(lab => String(lab.sectionCode) === String(savedItem.labCode));
        if (restoredLab) restoredSection = { ...restoredSection, selectedLab: restoredLab };
      }
      return { ...originalCourse, selectedSection: restoredSection } as SelectedCourse;
    }).filter(Boolean) as SelectedCourse[];
  };

  useEffect(() => {
    if (!selectedTerm || selectedCourses.length === 0) return;
    localStorage.setItem(`draft_${selectedTerm}`, JSON.stringify(selectedCourses));
  }, [selectedCourses, selectedTerm]);

  useEffect(() => {
    const fetchUserSchedule = async () => {
      if (!user || !session || availableCourses.length === 0 || !selectedTerm) return;
      if (fetchedTerms.current.has(selectedTerm)) return;

      try {
        const response = await authFetch(`/api/schedules?term=${encodeURIComponent(selectedTerm)}`, session);

        if (response.ok) {
          const data = await response.json();
          if (data.courses) {
            const restored = restoreScheduleFromData(data.courses, availableCourses);

            const localDraft = localStorage.getItem(`draft_${selectedTerm}`);
            if (!localDraft || JSON.parse(localDraft).length === 0) {
              setSelectedCourses(restored);
            }
          }
          fetchedTerms.current.add(selectedTerm);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserSchedule();
  }, [user, session, availableCourses, selectedTerm]);  

  return { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits };
};
