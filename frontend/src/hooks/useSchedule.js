import { useState, useEffect, useMemo } from 'react';

export const useSchedule = (user, session, availableCourses, selectedTerm) => {
  const [selectedCourses, setSelectedCourses] = useState([]);

  const totalUnits = useMemo(() => {
    return selectedCourses.reduce((acc, course) => {
      const units = parseInt(course.credits || 0); 
      return acc + (isNaN(units) ? 0 : units);
    }, 0);
  }, [selectedCourses]);

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

  const getDaysArray = (dayStr) => {
    if (!dayStr || dayStr === 'TBA') return [];
    return dayStr.match(/Tu|Th|Sa|Su|M|W|F/g) || [];
  };

  const checkForConflicts = (newSection, existingCourses, ignoreCode) => {
    const getSegments = (sec) => {
        const segments = [];
        if (!sec) return segments;
        if (sec.days && sec.startTime && sec.endTime) {
            segments.push({ days: getDaysArray(sec.days), start: parseTime(sec.startTime), end: parseTime(sec.endTime) });
        }
        if (sec.selectedLab && sec.selectedLab.days && sec.selectedLab.startTime && sec.selectedLab.endTime) {
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
                    if (newSeg.start < exSeg.end && newSeg.end > exSeg.start) {
                        return existing.code;
                    }
                }
            }
        }
    }
    return null;
  };

  const restoreScheduleFromData = (savedCourses, allCourses) => {
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
          return { ...originalCourse, selectedSection: restoredSection };
      }).filter(Boolean); 
  };

  useEffect(() => {
    const fetchUserSchedule = async () => {
      if (user && session && availableCourses.length > 0 && selectedTerm) {
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiBase}/api/schedules?term=${encodeURIComponent(selectedTerm)}`, { 
              headers: { 'Authorization': `Bearer ${session.access_token}` } 
            });

            if (response.ok) {
              const data = await response.json();
              if (data.courses) {
                  const restored = restoreScheduleFromData(data.courses, availableCourses);
                  setSelectedCourses(restored);
              } else {
                  setSelectedCourses([]);
              }
            }
        } catch (err) { 
            console.error("Schedule Fetch Error:", err); 
        }
      } else if (!user) {
          setSelectedCourses([]);
      }
    };
    fetchUserSchedule();
  }, [user, session, availableCourses, selectedTerm]); 

  return { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits };
};