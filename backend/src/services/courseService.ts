import prisma from '../lib/prisma';

const seasonWeight: Record<string, number> = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };

export const sortTermsDesc = (terms: string[]): string[] => {
  return terms.sort((a, b) => {
    const partsA = a.split(' ');
    const partsB = b.split(' ');

    const yearA = parseInt(partsA[0]);
    const seasonA = partsA[1];

    const yearB = parseInt(partsB[0]);
    const seasonB = partsB[1];

    if (yearA !== yearB) {
      return yearB - yearA;
    }
    return (seasonWeight[seasonB] || 0) - (seasonWeight[seasonA] || 0);
  });
};

export function getSmartTerm(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 2) return `Winter ${year}`;
  if (month <= 5) return `Spring ${year}`;
  if (month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

export const fetchCourses = async (term?: string) => {
  const courses = await prisma.course.findMany({
    where: term ? { term } : {},
    select: {
      id: true,
      code: true,
      name: true,
      credits: true,
      geCode: true,
      career: true,
      grading: true,
      term: true,
      schoolId: true,
      sections: {
        where: { parentId: null },
        orderBy: { sectionNumber: 'asc' },
        select: {
          id: true,
          classNumber: true,
          sectionNumber: true,
          instructor: true,
          days: true,
          startTime: true,
          endTime: true,
          location: true,
          status: true,
          enrolled: true,
          capacity: true,
          instructionMode: true,
          subSections: {
            orderBy: { sectionNumber: 'asc' },
            select: {
              id: true,
              classNumber: true,
              sectionNumber: true,
              days: true,
              startTime: true,
              endTime: true,
              location: true,
              status: true,
              enrolled: true,
              capacity: true,
            },
          },
        },
      },
    },
  });

  // Natural sort so "CSE 5" comes before "CSE 101" — can't be done in Postgres without a computed column
  return courses.sort((a, b) => {
    const codeA = a.code || '';
    const codeB = b.code || '';

    const [numA] = codeA
      .replace('CSE ', '')
      .split(/([0-9]+)/)
      .filter(Boolean);
    const [numB] = codeB
      .replace('CSE ', '')
      .split(/([0-9]+)/)
      .filter(Boolean);

    return (parseInt(numA) || 0) - (parseInt(numB) || 0);
  });
};

export const fetchCourseDescription = async (id: number) => {
  return prisma.course.findUnique({
    where: { id },
    select: { description: true, prerequisites: true },
  });
};

export const fetchSchoolInfo = async () => {
  const distinctTerms = await prisma.course.findMany({
    select: { term: true },
    distinct: ['term'],
  });

  let termsList = distinctTerms.map((t) => t.term).filter(Boolean) as string[];
  let latestTerm: string | null = null;

  if (termsList.length > 0) {
    const sorted = sortTermsDesc(termsList);
    latestTerm = sorted[0];
  } else {
    latestTerm = getSmartTerm();
  }

  return {
    id: 'ucsc',
    name: 'UC Santa Cruz',
    shortName: 'UCSC',
    term: latestTerm,
    status: 'active',
  };
};

export const fetchTerms = async () => {
  const terms = await prisma.course.findMany({
    select: { term: true },
    distinct: ['term'],
  });

  return sortTermsDesc(terms.map((t) => t.term).filter(Boolean) as string[]);
};
