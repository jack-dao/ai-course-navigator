import { geminiModel } from '../config/gemini';
import prisma from '../lib/prisma';

export const buildChatStream = async (
  message: string,
  term?: string,
  userSchedule?: { code: string; name: string; days?: string; times?: string }[]
) => {
  const scheduleString =
    userSchedule && userSchedule.length > 0
      ? userSchedule.map((c) => `• ${c.code} (${c.name}): ${c.days} @ ${c.times}`).join('\n')
      : 'No classes enrolled yet.';

  const relevantCourses = await prisma.course.findMany({
    where: term ? { term } : {},
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

  const systemPrompt = `
      You are "Sammy", an academic advisor for UC Santa Cruz.

      STEP 1: REVIEW USER'S SCHEDULE
      The user is CURRENTLY ENROLLED in these classes. You MUST respect these times:
      ${scheduleString}

      STEP 2: USER'S REQUEST
      "${message}"

      STEP 3: SEARCH CATALOG & CHECK CONFLICTS
      Course Catalog Matches:
      ${courseContextString}

      IMPORTANT INSTRUCTIONS:
      1. START your response by explicitly confirming you see their schedule.
      2. IF the user asks for a class that "fits", CHECK Step 1. Do NOT recommend classes that overlap with the times listed in Step 1.
      3. IF the user asks for "easy" classes, prioritize high Professor Ratings and lower division numbers (1-99).
      4. IF a class is marked "Status: Closed" or "Waitlist", you MUST warn the user.
      5. Do not write extremely long responses. Keep it conversational.
    `;

  return geminiModel.generateContentStream(systemPrompt);
};
