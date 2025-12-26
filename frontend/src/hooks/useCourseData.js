// src/hooks/useCourseData.js
import { useState, useEffect, useMemo } from 'react';

export const useCourseData = () => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) throw new Error('Failed to connect to server');
        const data = await response.json();
        setAvailableCourses(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const getProcessedCourses = (searchQuery) => {
    let filtered = availableCourses;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = availableCourses.filter(course => 
        (course.code || "").toLowerCase().includes(lowerQuery) ||
        (course.name || "").toLowerCase().includes(lowerQuery) ||
        (course.instructor || "").toLowerCase().includes(lowerQuery)
      );
    }

    return filtered.sort((a, b) => {
      const codeA = a.code || ""; 
      const codeB = b.code || "";
      const [numA, textA] = codeA.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      const [numB, textB] = codeB.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);

      const numberA = parseInt(numA);
      const numberB = parseInt(numB);

      if (!isNaN(numberA) && !isNaN(numberB) && numberA !== numberB) {
        return numberA - numberB;
      }
      if (!textA) return -1; 
      if (!textB) return 1;
      return textA.localeCompare(textB);
    });
  };

  return { availableCourses, loading, error, getProcessedCourses };
};