import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const sortTerms = (terms) => {
  const seasons = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };
  return terms.sort((a, b) => {
    const partsA = a.split(' ');
    const partsB = b.split(' ');
    const yearA = parseInt(partsA[0]);
    const seasonA = partsA[1];
    const yearB = parseInt(partsB[0]);
    const seasonB = partsB[1];

    if (yearA !== yearB) return yearB - yearA;
    return (seasons[seasonB] || 0) - (seasons[seasonA] || 0);
  });
};

export const useTerms = () => {
  const [ucscSchool, setUcscSchool] = useState({
    id: 'ucsc',
    name: 'UC Santa Cruz',
    shortName: 'UCSC',
    term: 'Loading...',
    status: 'active'
  });

  const [availableTerms, setAvailableTerms] = useState(() => {
    try {
      const saved = localStorage.getItem('cachedTerms');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedTerm, setSelectedTerm] = useState(() => {
    return localStorage.getItem('lastSelectedTerm') || (availableTerms.length > 0 ? availableTerms[0] : '');
  });

  useEffect(() => {
    if (selectedTerm) localStorage.setItem('lastSelectedTerm', selectedTerm);
  }, [selectedTerm]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [infoRes, termsRes] = await Promise.all([
          apiFetch('/api/courses/info'),
          apiFetch('/api/courses/terms')
        ]);

        if (infoRes.ok) setUcscSchool(await infoRes.json());

        if (termsRes.ok) {
          const dbTerms = await termsRes.json();
          if (dbTerms.length > 0) {
            const sorted = sortTerms(dbTerms);
            setAvailableTerms(sorted);
            localStorage.setItem('cachedTerms', JSON.stringify(sorted));

            if (!selectedTerm) {
              setSelectedTerm(sorted[0]);
            }
          }
        }
      } catch (e) {
        console.error("Metadata Load Error:", e);
      }
    };
    fetchMetadata();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run on mount

  return { ucscSchool, availableTerms, selectedTerm, setSelectedTerm };
};
