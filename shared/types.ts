export interface SubSection {
  id: number;
  classNumber: string | null;
  sectionNumber: string;
  sectionCode?: string;
  days: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  enrolled: number;
  capacity: number;
}

export interface Section extends SubSection {
  instructor: string;
  instructionMode: string | null;
  subSections?: SubSection[];
  selectedLab?: SubSection;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number | string;
  geCode: string | null;
  career: string | null;
  grading: string | null;
  term: string;
  schoolId: number;
  description?: string | null;
  prerequisites?: string | null;
  sections?: Section[];
  _searchScore?: number;
}

export interface SelectedCourse extends Course {
  selectedSection?: Section;
}

export interface Review {
  comment: string;
  date: string;
  course: string;
  grade: string | null;
  rating: number;
  difficulty: number;
  wouldTakeAgain: boolean;
  tags: string[];
}

export interface ProfessorRating {
  avgRating: number;
  avgDifficulty: number;
  wouldTakeAgain: string;
  numRatings: number;
  rmpLink: string | null;
  reviews: Review[];
}

export interface ProfessorModalData {
  name: string;
  avgRating?: number;
  avgDifficulty?: number;
  wouldTakeAgain?: string;
  numRatings?: number;
  rmpLink?: string | null;
  department?: string;
  reviews: Review[];
}

export type ProfessorRatingsMap = Record<string, ProfessorRating>;

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface CourseFilters {
  openOnly: boolean;
  minRating: number;
  minUnits: number;
  days: string[];
  department: string;
  sort: 'Best Match' | 'Rating' | 'Difficulty';
  timeRange: [number, number];
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  term: string;
  status: string;
}

export interface Department {
  name: string;
  prefix: string;
}

export type TabName = 'search' | 'schedule' | 'about';

export interface SavedScheduleCourse {
  code: string;
  sectionCode: string;
  labCode: string;
}
