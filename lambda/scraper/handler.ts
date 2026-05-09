import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import type { Handler } from 'aws-lambda';

interface AppSecrets {
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
}

interface Discussion {
  sectionNumber: string;
  sectionType: string;
  days: string;
  time: string;
  location: string;
  enrolled: number;
  capacity: number;
  status: 'Open' | 'Closed';
}

interface ScrapedCourse {
  code: string;
  title: string;
  section: string;
  instructor: string;
  meeting: string;
  location: string;
  status: string;
  enrolled: number;
  capacity: number;
  discussions: Discussion[];
  geCode: string | null;
  prerequisites: string | null;
  description: string | null;
  career: string | null;
  grading: string | null;
  classNumber: string | null;
  instructionMode: string | null;
  credits: number;
}

let prisma: PrismaClient | undefined;

async function getSecrets(): Promise<AppSecrets> {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-west-2' });
  const command = new GetSecretValueCommand({ SecretId: process.env.SECRETS_ARN });
  const response = await client.send(command);
  if (!response.SecretString) throw new Error('Empty SecretString from Secrets Manager');
  return JSON.parse(response.SecretString) as AppSecrets;
}

async function initPrisma(): Promise<PrismaClient> {
  if (prisma) return prisma;
  const secrets = await getSecrets();
  // Use DIRECT_URL to bypass PgBouncer session pool limits
  process.env.DATABASE_URL = secrets.DIRECT_URL || secrets.DATABASE_URL;
  process.env.DIRECT_URL = secrets.DIRECT_URL;
  prisma = new PrismaClient({
    datasources: { db: { url: secrets.DIRECT_URL || secrets.DATABASE_URL } },
  });
  return prisma;
}

// ─── COURSE SCRAPER ───

const agent = new https.Agent({ keepAlive: true, maxSockets: 15 });
const httpClient = axios.create({
  httpsAgent: agent,
  timeout: 30000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
});

const BASE_URL = 'https://pisa.ucsc.edu/class_search/index.php';

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

function parseDiscussions(detail$: cheerio.CheerioAPI): Discussion[] {
  const results: Discussion[] = [];
  const targetHeader = detail$('.panel-heading').filter((_, el) => detail$(el).text().includes('Associated'));
  if (targetHeader.length === 0) return [];

  const panel = targetHeader.closest('.panel');
  const rows = panel.find('.row.row-striped');

  rows.each((_, row) => {
    const text = detail$(row).text().replace(/[\n\r]+/g, ' ').trim();
    const headerMatch = text.match(/#(\d+)\s+([A-Z]+)\s+(\d+[A-Z]?)/);
    if (!headerMatch) return;

    const type = headerMatch[2];
    const sectionNum = headerMatch[3];
    let time = 'TBA';
    let location = 'TBA';
    let enrolled = 0;
    let capacity = 0;
    let days = 'TBA';

    const timeMatch = text.match(/(\d{2}:\d{2}[AP]M-\d{2}:\d{2}[AP]M)/);
    if (timeMatch) time = timeMatch[1];
    const dayMatch = text.match(/\b(M|Tu|W|Th|F|MW|TuTh|MWF|Sa|Su)\b/);
    if (dayMatch) days = dayMatch[1];

    const locMatch = text.match(/Loc:\s*(.*?)(?=\s+(Enrl|Wait|Staff|$))/);
    if (locMatch) location = locMatch[1].trim();

    const statsMatch = text.match(/Enrl:\s*(\d+)\s*\/\s*(\d+)/);
    if (statsMatch) {
      enrolled = parseInt(statsMatch[1]);
      capacity = parseInt(statsMatch[2]);
    }

    results.push({
      sectionNumber: sectionNum,
      sectionType: type,
      days,
      time,
      location,
      enrolled,
      capacity,
      status: enrolled >= capacity && capacity > 0 ? 'Closed' : 'Open',
    });
  });
  return results;
}

async function saveToDatabase(course: ScrapedCourse, schoolId: number, termName: string): Promise<void> {
  if (!prisma) throw new Error('Prisma not initialized');
  try {
    const dbCourse = await prisma.course.upsert({
      where: { schoolId_code_term: { schoolId, code: course.code, term: termName } },
      update: {
        name: course.title,
        instructor: course.instructor,
        department: course.code.split(' ')[0],
        geCode: course.geCode,
        prerequisites: course.prerequisites,
        description: course.description,
        career: course.career,
        grading: course.grading,
        credits: course.credits,
      },
      create: {
        code: course.code,
        name: course.title,
        term: termName,
        credits: course.credits,
        instructor: course.instructor,
        department: course.code.split(' ')[0],
        schoolId,
        geCode: course.geCode,
        prerequisites: course.prerequisites,
        description: course.description,
        career: course.career,
        grading: course.grading,
      },
    });

    const days = course.meeting.split(' ')[0] || 'TBA';
    const timeRange = course.meeting.split(' ').slice(1).join(' ') || 'TBA';
    const uniqueSectionCode = `${course.code}-${course.section}-${termName}`;

    const lectureData = {
      courseId: dbCourse.id,
      sectionNumber: course.section,
      sectionCode: uniqueSectionCode,
      sectionType: 'LEC',
      instructor: course.instructor,
      days,
      time: timeRange,
      startTime: timeRange.split('-')[0] || 'TBA',
      endTime: timeRange.split('-')[1] || 'TBA',
      location: course.location,
      enrolled: course.enrolled,
      capacity: course.capacity,
      status: course.status,
      classNumber: course.classNumber,
      instructionMode: course.instructionMode,
    };

    const existingSection = await prisma.section.findUnique({ where: { sectionCode: uniqueSectionCode } });
    let lectureId: number;

    if (existingSection) {
      const updated = await prisma.section.update({ where: { id: existingSection.id }, data: lectureData });
      lectureId = updated.id;
    } else {
      const created = await prisma.section.create({ data: lectureData });
      lectureId = created.id;
    }

    if (course.discussions && course.discussions.length > 0) {
      for (const dis of course.discussions) {
        const uniqueDisCode = `${course.code}-${dis.sectionNumber}-${termName}`;
        const disData = {
          courseId: dbCourse.id,
          parentId: lectureId,
          sectionCode: uniqueDisCode,
          sectionNumber: dis.sectionNumber,
          sectionType: dis.sectionType,
          instructor: 'Staff',
          days: dis.days,
          time: dis.time,
          startTime: dis.time.split('-')[0] || 'TBA',
          endTime: dis.time.split('-')[1] || 'TBA',
          location: dis.location,
          enrolled: dis.enrolled,
          capacity: dis.capacity,
          status: dis.status,
        };

        const existingDis = await prisma.section.findUnique({ where: { sectionCode: uniqueDisCode } });
        if (existingDis) {
          await prisma.section.update({ where: { id: existingDis.id }, data: disData });
        } else {
          await prisma.section.create({ data: disData });
        }
      }
    }
  } catch (e) {
    console.error(`Error saving ${course.code}: ${(e as Error).message}`);
  }
}

async function processClass($: cheerio.CheerioAPI, el: any, schoolId: number, termName: string): Promise<void> {
  const header = $(el).find('.panel-heading').text().trim();
  if (header.includes('Search Results')) return;

  const status = header.includes('Open') ? 'Open' : header.includes('Wait List') ? 'Wait List' : 'Closed';
  const cleanHeader = header.replace(/Open|Closed|Wait List/g, '').trim();
  const parts = cleanHeader.split('-');
  if (parts.length < 2) return;

  const code = parts[0].trim();
  const rest = parts.slice(1).join('-').trim();
  const sectionMatch = rest.match(/^(\d+[A-Z]?)\s+(.*)/);
  const section = sectionMatch ? sectionMatch[1] : '01';
  let title = sectionMatch ? sectionMatch[2] : rest;

  const instructor = $(el).find('.panel-body .row > div:nth-child(2)').text().split(':')[1]?.trim() || 'Staff';
  const location =
    $(el).find('.panel-body .row > div:nth-child(3) > div:nth-child(1)').text().replace('Location:', '').trim() || 'TBA';
  const meeting =
    $(el).find('.panel-body .row > div:nth-child(3) > div:nth-child(2)').text().replace('Day and Time:', '').trim() || 'TBA';

  let enrolled = 0;
  let capacity = 0;
  const enrollText = $(el).find('.panel-body .row > div:nth-child(4)').text();
  const enrollMatch = enrollText.match(/(\d+)\s+of\s+(\d+)/);
  if (enrollMatch) {
    enrolled = parseInt(enrollMatch[1]);
    capacity = parseInt(enrollMatch[2]);
  }

  let discussions: Discussion[] = [];
  let geCode: string | null = null;
  let prerequisites: string | null = null;
  let description: string | null = null;
  let career: string | null = null;
  let grading: string | null = null;
  let classNumber: string | null = null;
  let instructionMode: string | null = null;
  let credits = 5;

  let detailsLinkHref = $(el).find('h2 a').attr('href');
  if (!detailsLinkHref) detailsLinkHref = $(el).find('.panel-heading a').attr('href');
  if (!detailsLinkHref) detailsLinkHref = $(el).find('a').first().attr('href');

  if (detailsLinkHref) {
    try {
      const detailsUrl = `${BASE_URL.replace('index.php', '')}${detailsLinkHref}`;
      const detailsRes = await httpClient.get(detailsUrl);
      const detail$ = cheerio.load(detailsRes.data);

      discussions = parseDiscussions(detail$);

      let fullHeader = '';
      detail$('h2').each((_, h2) => {
        const text = detail$(h2).text().replace(/ /g, ' ').trim();
        if (text.startsWith(code)) {
          fullHeader = text;
          return false;
        }
      });

      if (fullHeader) {
        let remaining = fullHeader.substring(code.length).trim();
        remaining = remaining.replace(/^[-–\s]+/, '').trim();
        remaining = remaining.replace(/^\d+[A-Z]?\s+/, '').trim();
        if (remaining.length > 0) title = remaining;
      }

      const panelText = detail$('.panel-body').text().replace(/\s+/g, ' ');

      const classNumMatch = panelText.match(/Class Number\s*:?\s*(\d{5})/i);
      if (classNumMatch) classNumber = classNumMatch[1];

      const creditsMatch = panelText.match(/Credits\s*:?\s*(\d+)\s*units?/i);
      if (creditsMatch) credits = parseInt(creditsMatch[1]);

      const modeMatch = panelText.match(/Instruction Mode\s*:?\s*(.+?)\s*(?:Credits|General)/i);
      if (modeMatch) instructionMode = modeMatch[1].trim();

      const careerMatch = panelText.match(/Career\s*:?\s*(Undergraduate|Graduate)/i);
      if (careerMatch) career = careerMatch[1].trim();

      const gradingMatch = panelText.match(/Grading\s*:?\s*(.+?)\s*Class Number/i);
      if (gradingMatch) grading = gradingMatch[1].trim();

      const geMatch = panelText.match(/General Education(?:[:\s]*(?:Code\(s\))?[:\s]*)?([A-Z\s,-]+?)(?=\.?\s*Status)/i);
      if (geMatch) {
        const rawGe = geMatch[1].trim();
        if (rawGe.length < 15 && rawGe !== '.') geCode = rawGe;
      }

      const prereqMatch = panelText.match(
        /Enrollment Requirements\s*([\s\S]+?)(?=\s*(?:Class Notes|Meeting Information|Description|$))/i
      );
      if (prereqMatch) prerequisites = prereqMatch[1].trim();

      const descMatch = panelText.match(
        /Description\s*:?\s*([\s\S]+?)(?=\s*(?:Class Notes|Meeting Information|Enrollment Requirements|$))/i
      );
      if (descMatch) description = descMatch[1].trim();
    } catch (_err) {
      /* skip detail fetch failures */
    }
  }

  await saveToDatabase(
    {
      code,
      title,
      section,
      instructor,
      meeting,
      location,
      status,
      enrolled,
      capacity,
      discussions,
      geCode,
      prerequisites,
      description,
      career,
      grading,
      classNumber,
      instructionMode,
      credits,
    },
    schoolId,
    termName
  );
}

async function scrapeCourses(): Promise<void> {
  if (!prisma) throw new Error('Prisma not initialized');
  console.log('Starting course scraper...');

  const initRes = await httpClient.get(BASE_URL);
  let $ = cheerio.load(initRes.data);

  const termName = $('#term_dropdown option[selected]').text().trim() || 'Winter 2026';
  const termId = $('#term_dropdown option[selected]').val() || $('#term_dropdown option').eq(0).val();
  console.log(`Term: ${termName} (ID: ${termId})`);

  const ucsc = await prisma.school.upsert({
    where: { name: 'UCSC' },
    update: { currentTerm: termName },
    create: { name: 'UCSC', currentTerm: termName },
  });

  const formData = new URLSearchParams({
    action: 'results',
    'binds[:term]': String(termId),
    'binds[:reg_status]': 'all',
    'binds[:subject]': '',
    rec_start: '0',
    rec_dur: '5000',
  });

  const megaResponse = await httpClient.post(BASE_URL, formData.toString());
  $ = cheerio.load(megaResponse.data);
  const panels = $('.panel.panel-default').toArray();
  console.log(`Found ${panels.length} classes`);

  if (panels.length === 0) return;

  // Pre-sync professors
  const uniqueInstructors = new Set<string>();
  panels.forEach((el) => {
    const header = $(el).find('.panel-heading').text().trim();
    if (header.includes('Search Results')) return;
    const instructor = $(el).find('.panel-body .row > div:nth-child(2)').text().split(':')[1]?.trim() || 'Staff';
    if (instructor) uniqueInstructors.add(instructor);
  });

  await prisma.professor.createMany({
    data: Array.from(uniqueInstructors).map((name) => ({ name })),
    skipDuplicates: true,
  });

  const batches = chunk(panels, 10);
  let processed = 0;
  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map((el) => processClass($, el, ucsc.id, termName)));
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Batch had ${failures.length} failure(s):`, failures.map((f) => (f as PromiseRejectedResult).reason?.message || f));
    }
    processed += batch.length;
    console.log(`Processed ${processed}/${panels.length}`);
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log('Course scrape complete!');
}

// ─── RMP MATCHING ───

const SCHOOL_ID = 'U2Nob29sLTEwNzg=';

const DEPT_MAP: Record<string, string[]> = {
  AM: ['Applied Mathematics'],
  STAT: ['Statistics'],
  MATH: ['Mathematics'],
  CSE: ['Computer Science', 'Computer Engineering'],
  ECE: ['Electrical Engineering', 'Computer Engineering'],
  BME: ['Biomolecular', 'Bioinformatics', 'Biology'],
  CMPM: ['Computational Media', 'Game Design'],
  BIOL: ['Biology', 'Biological'],
  BIOC: ['Biochemistry'],
  CHEM: ['Chemistry'],
  PHYS: ['Physics'],
  ASTR: ['Astronomy', 'Astrophysics'],
  EART: ['Earth Sciences', 'Geology'],
  ENVS: ['Environmental'],
  ECON: ['Economics'],
  PSYC: ['Psychology'],
  SOCY: ['Sociology'],
  ANTH: ['Anthropology'],
  POLI: ['Politics', 'Political Science'],
  EDUC: ['Education'],
  LIT: ['Literature', 'English'],
  WRIT: ['Writing', 'Rhetoric'],
  LING: ['Linguistics'],
  HIS: ['History'],
  PHIL: ['Philosophy'],
  HAVC: ['History of Art', 'Visual Culture'],
  ART: ['Art', 'Studio Art'],
  FILM: ['Film'],
  THEA: ['Theater'],
  MUSC: ['Music'],
  SPAN: ['Spanish'],
  FREN: ['French'],
  JAPN: ['Japanese'],
  CHIN: ['Chinese'],
};

async function searchRMP(queryText: string): Promise<any[]> {
  try {
    const resp = await axios.post(
      'https://www.ratemyprofessors.com/graphql',
      {
        query: `query ($query: TeacherSearchQuery!, $count: Int) {
        newSearch { teachers(query: $query, first: $count) { edges { node {
          legacyId firstName lastName department numRatings avgRating
          courseCodes { courseName }
        } } } }
      }`,
        variables: { query: { schoolID: SCHOOL_ID, text: queryText }, count: 100 },
      },
      { headers: { Authorization: 'Basic dGVzdDp0ZXN0', 'Content-Type': 'application/json' } }
    );
    return resp.data?.data?.newSearch?.teachers?.edges || [];
  } catch (_e) {
    return [];
  }
}

async function matchProfessors(): Promise<void> {
  if (!prisma) throw new Error('Prisma not initialized');
  console.log('Starting RMP matching...');

  try {
    await prisma.professor.updateMany({
      where: { rmpId: { not: null }, OR: [{ numRatings: 0 }, { numRatings: null }] },
      data: { rmpId: null, numRatings: null, avgRating: null },
    });
  } catch (_e) {
    /* skip if column missing */
  }

  const professors = await prisma.professor.findMany({ include: { sections: { include: { course: true } } } });
  console.log(`Matching ${professors.length} professors...`);

  let matchCount = 0;
  for (const prof of professors) {
    if (prof.rmpId && prof.numRatings && prof.numRatings > 0) continue;

    const split = prof.name.split(',');
    const lastName = split[0].trim();
    const firstNamePart = split[1] ? split[1].trim() : '';
    const firstInitial = firstNamePart.charAt(0);
    if (lastName === 'Staff') continue;

    const taughtSubjects = [...new Set(prof.sections.map((s) => s.course.department))];
    const taughtCodes = prof.sections.map((s) => s.course.code.replace(/\s/g, ''));
    const deptKeywords = taughtSubjects.flatMap((code) => DEPT_MAP[code] || []);
    const primaryDept = deptKeywords[0] || '';

    let results: any[] = [];
    if (firstNamePart.length > 1) results.push(...(await searchRMP(`${firstNamePart} ${lastName}`)));
    if (primaryDept) results.push(...(await searchRMP(`${lastName} ${primaryDept}`)));

    const hasRated = results.some((r) => r.node.numRatings > 0);
    if (results.length === 0 || !hasRated || lastName.length <= 3) {
      results.push(...(await searchRMP(lastName)));
    }

    const uniqueResults = new Map<number, any>();
    results.forEach((r) => uniqueResults.set(r.node.legacyId, r));
    const candidates = Array.from(uniqueResults.values()).map((x) => x.node);
    if (candidates.length === 0) continue;

    const scores = candidates.map((ins) => {
      let score = 0;
      const rmpLast = ins.lastName.trim().toLowerCase();
      const rmpFirst = ins.firstName.trim();
      if (rmpLast === lastName.toLowerCase()) {
        score += 2;
        if (firstInitial && rmpFirst.startsWith(firstInitial)) score += 2;
      } else return { candidate: ins, score: -100 };

      const rmpCourseNames = ins.courseCodes.map((c: any) => c.courseName.toUpperCase());
      if (taughtSubjects.some((s) => rmpCourseNames.some((rc: string) => rc.startsWith(s)))) score += 5;

      const rmpDept = (ins.department || '').toLowerCase();
      if (deptKeywords.some((k) => rmpDept.includes(k.toLowerCase()))) score += 5;

      const rmpCleanCodes = rmpCourseNames.map((c: string) => c.replace(/\s/g, ''));
      if (taughtCodes.some((c) => rmpCleanCodes.includes(c))) score += 10;

      if (ins.numRatings > 0) {
        score += 20;
        score += Math.min(ins.numRatings, 5);
      }
      return { candidate: ins, score };
    });

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    if (best.score >= 5 && prof.rmpId !== best.candidate.legacyId.toString()) {
      matchCount++;
      await prisma.professor.update({ where: { id: prof.id }, data: { rmpId: best.candidate.legacyId.toString() } });
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`Matched ${matchCount} professors`);
}

// ─── FETCH RATINGS ───

async function fetchRatings(): Promise<void> {
  if (!prisma) throw new Error('Prisma not initialized');
  console.log('Starting ratings fetch...');

  const professors = await prisma.professor.findMany({ where: { rmpId: { not: null } } });
  console.log(`Updating ratings for ${professors.length} professors...`);

  for (const prof of professors) {
    try {
      const b64Id = Buffer.from(`Teacher-${prof.rmpId}`).toString('base64');
      const resp = await axios.post(
        'https://www.ratemyprofessors.com/graphql',
        {
          query: `query ($id: ID!) { node(id: $id) { ... on Teacher {
          avgRating numRatings avgDifficulty wouldTakeAgainPercent department
          ratings(first: 20) { edges { node {
            comment date class grade helpfulRating clarityRating difficultyRating wouldTakeAgain ratingTags
          } } }
        } } }`,
          variables: { id: b64Id },
        },
        { headers: { Authorization: 'Basic dGVzdDp0ZXN0', 'Content-Type': 'application/json' } }
      );

      const data = resp.data?.data?.node;
      if (!data) continue;

      const reviews = data.ratings.edges.map((e: any) => ({
        comment: e.node.comment,
        date: e.node.date,
        course: e.node.class,
        grade: e.node.grade,
        rating: (e.node.helpfulRating + e.node.clarityRating) / 2,
        difficulty: e.node.difficultyRating,
        wouldTakeAgain: e.node.wouldTakeAgain === 1,
        tags: e.node.ratingTags ? e.node.ratingTags.split('--').filter((t: string) => t) : [],
      }));

      const takeAgain =
        data.wouldTakeAgainPercent !== null && data.wouldTakeAgainPercent !== -1
          ? Math.round(data.wouldTakeAgainPercent).toString()
          : 'N/A';

      await prisma.professor.update({
        where: { id: prof.id },
        data: {
          avgRating: data.avgRating,
          avgDifficulty: data.avgDifficulty,
          numRatings: data.numRatings,
          wouldTakeAgain: takeAgain,
          rmpLink: `https://www.ratemyprofessors.com/professor/${prof.rmpId}`,
          reviews: reviews,
        },
      });
    } catch (_e) {
      /* skip individual failures */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('Ratings fetch complete!');
}

// ─── LAMBDA HANDLER ───

export const handler: Handler = async (event) => {
  console.log('Lambda scraper triggered', JSON.stringify(event));

  try {
    await initPrisma();

    await scrapeCourses();
    await matchProfessors();
    await fetchRatings();

    return { statusCode: 200, body: 'Scraper completed successfully' };
  } catch (error) {
    console.error('Scraper failed:', error);
    throw error;
  } finally {
    if (prisma) await prisma.$disconnect();
  }
};
