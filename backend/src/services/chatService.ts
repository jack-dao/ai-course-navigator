import { geminiModel } from '../config/gemini';
import prisma from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// Known UCSC department prefixes for keyword extraction
const DEPT_PREFIXES = [
  'CSE',
  'CMPM',
  'CMPE',
  'ECE',
  'AM',
  'MATH',
  'STAT',
  'PHYS',
  'CHEM',
  'BIOL',
  'ECON',
  'PSYC',
  'LING',
  'HIST',
  'PHIL',
  'POLI',
  'SOCY',
  'ART',
  'MUSC',
  'LIT',
  'WRIT',
  'ANTH',
  'ENVS',
  'OCEA',
  'EART',
  'SPAN',
  'FMST',
  'THEA',
  'DANM',
  'HAVC',
  'LALS',
  'CRES',
  'PORT',
  'GERM',
  'CLNI',
  'TIM',
];

const GE_CODES = ['CC', 'ER', 'IM', 'MF', 'SI', 'SR', 'TA', 'PE-E', 'PE-H', 'PE-T', 'PR-E', 'PR-C', 'PR-S', 'C', 'DC'];

/**
 * Extract search filters from the user's message to find relevant courses.
 * Returns a Prisma OR clause that matches department, course code, GE, or keywords.
 */
function buildCourseFilter(message: string, term?: string): Prisma.CourseWhereInput {
  const base: Prisma.CourseWhereInput = term ? { term } : {};
  const orConditions: Prisma.CourseWhereInput[] = [];

  const upperMsg = message.toUpperCase();

  // Match specific course codes (e.g., "CSE 101", "MATH23A")
  const codeMatches = message.match(/\b[A-Z]{2,5}\s*\d{1,3}[A-Z]?\b/gi);
  if (codeMatches) {
    for (const code of codeMatches) {
      const normalized = code.replace(/\s+/g, ' ').trim().toUpperCase();
      orConditions.push({ code: { contains: normalized, mode: 'insensitive' } });
    }
  }

  // Match department mentions (e.g., "any CSE class", "MATH electives")
  for (const dept of DEPT_PREFIXES) {
    if (upperMsg.includes(dept)) {
      orConditions.push({ code: { startsWith: `${dept} ` } });
    }
  }

  // Match GE code mentions (e.g., "MF requirement", "need a SI class")
  for (const ge of GE_CODES) {
    if (upperMsg.includes(ge)) {
      orConditions.push({ geCode: ge });
    }
  }

  // Keyword fallback — search course names for significant words
  if (orConditions.length === 0) {
    const stopWords = new Set([
      'i',
      'a',
      'an',
      'the',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'do',
      'does',
      'did',
      'have',
      'has',
      'had',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'shall',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'about',
      'that',
      'this',
      'it',
      'its',
      'my',
      'me',
      'what',
      'which',
      'who',
      'how',
      'when',
      'where',
      'why',
      'not',
      'no',
      'so',
      'if',
      'or',
      'and',
      'but',
      'any',
      'some',
      'take',
      'class',
      'classes',
      'course',
      'courses',
      'need',
      'want',
      'looking',
      'find',
      'get',
      'good',
      'best',
      'easy',
      'schedule',
      'fit',
      'fits',
    ]);
    const words = message.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));
    for (const word of words.slice(0, 3)) {
      orConditions.push({ name: { contains: word, mode: 'insensitive' } });
    }
  }

  if (orConditions.length > 0) {
    return { ...base, OR: orConditions };
  }

  // Final fallback — just return courses for the term
  return base;
}

export const buildChatStream = async (
  message: string,
  term?: string,
  userSchedule?: { code: string; name: string; days?: string; times?: string }[],
  history?: { role: 'user' | 'assistant'; text: string }[]
) => {
  const scheduleString =
    userSchedule && userSchedule.length > 0
      ? userSchedule.map((c) => `• ${c.code} (${c.name}): ${c.days} @ ${c.times}`).join('\n')
      : 'No classes enrolled yet.';

  const relevantCourses = await prisma.course.findMany({
    where: buildCourseFilter(message, term),
    take: 20,
    include: {
      sections: {
        where: { parentId: null },
        select: {
          instructor: true,
          days: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
  });

  const courseContextString = relevantCourses
    .map(
      (c) =>
        `- ${c.code}: ${c.name} (${c.credits} units). GE: ${c.geCode || 'None'}. Prereqs: ${c.prerequisites || 'None'}.\n` +
        `  Sections: ${
          c.sections
            ?.map((s) => `[${s.instructor} | ${s.days} ${s.startTime}-${s.endTime} | Status: ${s.status || 'Unknown'}]`)
            .join(', ') || 'Staff'
        }`
    )
    .join('\n');

  // System instruction — separate from user message to prevent prompt injection
  const systemInstruction = `You are "Sammy", an academic advisor for UC Santa Cruz.

The user is CURRENTLY ENROLLED in these classes. You MUST respect these times:
${scheduleString}

Course Catalog Matches (based on their query):
${courseContextString}

IMPORTANT INSTRUCTIONS:
1. START your response by explicitly confirming you see their schedule.
2. IF the user asks for a class that "fits", do NOT recommend classes that overlap with the times listed above.
3. IF the user asks for "easy" classes, prioritize high Professor Ratings and lower division numbers (1-99).
4. IF a class is marked "Status: Closed" or "Waitlist", you MUST warn the user.
5. Do not write extremely long responses. Keep it conversational.
6. Only recommend courses from the catalog matches above. If none match, say so.`;

  // Build conversation history for multi-turn context
  const contents = [
    ...(history || []).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  return geminiModel.generateContentStream({
    contents,
    systemInstruction: { role: 'user' as const, parts: [{ text: systemInstruction }] },
  });
};
