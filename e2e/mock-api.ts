import type { Page } from '@playwright/test';

const mockSchoolInfo = {
  id: 'ucsc',
  name: 'UC Santa Cruz',
  shortName: 'UCSC',
  term: '2026 Spring',
  status: 'active',
};

const mockTerms = ['2026 Spring', '2026 Winter', '2025 Fall'];

const mockCourses = [
  {
    id: 1,
    code: 'CSE 101',
    name: 'Algorithms and Abstract Data Types',
    credits: 5,
    geCode: null,
    career: 'Undergraduate',
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    sections: [
      {
        id: 1,
        classNumber: '10001',
        sectionNumber: '01',
        sectionCode: 'CSE 101-01',
        instructor: 'Tantalo,Patrick',
        days: 'MWF',
        startTime: '9:20AM',
        endTime: '10:25AM',
        location: 'BSOE 100',
        status: 'Open',
        enrolled: 120,
        capacity: 200,
        instructionMode: 'In Person',
        subSections: [],
      },
    ],
  },
  {
    id: 2,
    code: 'CSE 130',
    name: 'Principles of Computer Systems Design',
    credits: 5,
    geCode: null,
    career: 'Undergraduate',
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    sections: [
      {
        id: 2,
        classNumber: '10002',
        sectionNumber: '01',
        sectionCode: 'CSE 130-01',
        instructor: 'Miller,Ethan',
        days: 'TuTh',
        startTime: '1:30PM',
        endTime: '3:05PM',
        location: 'ENGR2 194',
        status: 'Open',
        enrolled: 80,
        capacity: 150,
        instructionMode: 'In Person',
        subSections: [],
      },
    ],
  },
  {
    id: 3,
    code: 'MATH 21',
    name: 'Linear Algebra',
    credits: 5,
    geCode: 'MF',
    career: 'Undergraduate',
    grading: null,
    term: '2026 Spring',
    schoolId: 1,
    sections: [
      {
        id: 3,
        classNumber: '10003',
        sectionNumber: '01',
        sectionCode: 'MATH 21-01',
        instructor: 'Boltje,Robert',
        days: 'MWF',
        startTime: '11:00AM',
        endTime: '12:05PM',
        location: 'THIM 101',
        status: 'Open',
        enrolled: 150,
        capacity: 200,
        instructionMode: 'In Person',
        subSections: [],
      },
    ],
  },
];

const mockRatings = {
  'Tantalo,Patrick': {
    avgRating: 4.2,
    avgDifficulty: 3.1,
    wouldTakeAgain: '85%',
    numRatings: 120,
    rmpLink: null,
    reviews: [],
  },
  'Miller,Ethan': {
    avgRating: 3.8,
    avgDifficulty: 3.5,
    wouldTakeAgain: '70%',
    numRatings: 80,
    rmpLink: null,
    reviews: [],
  },
  'Boltje,Robert': {
    avgRating: 4.0,
    avgDifficulty: 2.8,
    wouldTakeAgain: '90%',
    numRatings: 60,
    rmpLink: null,
    reviews: [],
  },
};

/**
 * Intercept all API calls and return mock data.
 * Call this before navigating to any page.
 */
export async function mockApi(page: Page) {
  await page.route('**/api/courses/info', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSchoolInfo) })
  );

  await page.route('**/api/courses/terms', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTerms) })
  );

  await page.route('**/api/courses?**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCourses) })
  );

  await page.route('**/api/ratings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRatings) })
  );

  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }) })
  );

  // Auth-required endpoints return empty/unauthorized
  await page.route('**/api/schedules**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ courses: [] }) })
  );

  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 401 })
  );
}
