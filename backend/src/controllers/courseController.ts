import { termQuerySchema, courseIdSchema } from '../validators/course';
import {
  fetchCourses,
  fetchCourseDescription,
  fetchSchoolInfo,
  fetchTerms,
  sortTermsDesc,
  getSmartTerm,
} from '../services/courseService';
import type { Request, Response } from 'express';

const getCourses = async (req: Request, res: Response): Promise<void> => {
  const { term } = termQuerySchema.parse(req.query);

  const courses = await fetchCourses(term);

  res.set('Cache-Control', 'public, max-age=300');
  res.json(courses);
};

const getCourseDescription = async (req: Request, res: Response): Promise<void> => {
  const { id } = courseIdSchema.parse(req.params);

  const course = await fetchCourseDescription(id);

  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.set('Cache-Control', 'public, max-age=86400');
  res.json(course);
};

const getSchoolInfo = async (_req: Request, res: Response): Promise<void> => {
  const info = await fetchSchoolInfo();

  res.set('Cache-Control', 'public, max-age=3600');
  res.json(info);
};

const getTerms = async (_req: Request, res: Response): Promise<void> => {
  const terms = await fetchTerms();

  res.set('Cache-Control', 'public, max-age=3600');
  res.json(terms);
};

export { getCourses, getCourseDescription, getSchoolInfo, getTerms, sortTermsDesc, getSmartTerm };
