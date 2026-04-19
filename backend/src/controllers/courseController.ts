import prisma from '../lib/prisma';
import type { Request, Response } from 'express';

const sortTermsDesc = (terms: string[]): string[] => {
  const seasonWeight: Record<string, number> = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };

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

function getSmartTerm(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 2) return `Winter ${year}`;
  if (month <= 5) return `Spring ${year}`;
  if (month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { term } = req.query;

    const courses = await prisma.course.findMany({
      where: term ? { term: term as string } : {},
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
          where: {
            parentId: null
          },
          orderBy: {
            sectionNumber: 'asc'
          },
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
                capacity: true
              }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Custom sort for "CSE 101" vs "CSE 15" logic
    const sortedCourses = courses.sort((a, b) => {
      const codeA = a.code || "";
      const codeB = b.code || "";

      const [numA] = codeA.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      const [numB] = codeB.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);

      return (parseInt(numA) || 0) - (parseInt(numB) || 0);
    });

    res.json(sortedCourses);
  }
  catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Fetch description/prereqs only when requested
const getCourseDescription = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const courseId = parseInt(id);

  if (isNaN(courseId)) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        description: true,
        prerequisites: true
      }
    });

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    res.json(course);
  } catch (error) {
    console.error("Description Fetch Error:", error);
    res.status(500).json({ error: 'Failed to fetch course description' });
  }
};

const getSchoolInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const distinctTerms = await prisma.course.findMany({
      select: { term: true },
      distinct: ['term']
    });

    let termsList = distinctTerms.map(t => t.term).filter(Boolean) as string[];
    let latestTerm: string | null = null;

    if (termsList.length > 0) {
      const sorted = sortTermsDesc(termsList);
      latestTerm = sorted[0];
    } else {
      latestTerm = getSmartTerm();
    }

    res.json({
      id: 'ucsc',
      name: 'UC Santa Cruz',
      shortName: 'UCSC',
      term: latestTerm,
      status: 'active'
    });
  } catch (error) {
    console.error("Metadata Error:", error);
    res.status(500).json({ error: 'Failed to fetch school info' });
  }
};

const getTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const terms = await prisma.course.findMany({
      select: { term: true },
      distinct: ['term'],
    });

    const sortedTerms = sortTermsDesc(terms.map(t => t.term).filter(Boolean) as string[]);
    res.json(sortedTerms);
  } catch (error) {
    console.error("Terms Error:", error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
};

export {
  getCourses,
  getCourseDescription,
  getSchoolInfo,
  getTerms
};
