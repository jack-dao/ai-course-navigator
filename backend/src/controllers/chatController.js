const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const handleChat = async (req, res) => {
  try {
    const { message, contextCourses, userSchedule } = req.body;
    const relevantCourses = contextCourses ? contextCourses.slice(0, 50) : [];

    const courseContextString = relevantCourses.map(c => 
      `- ${c.code}: ${c.name} (${c.credits} units). Instructors: ${c.sections?.map(s => s.instructor).join(', ') || 'Staff'}`
    ).join('\n');

    const scheduleString = userSchedule && userSchedule.length > 0
      ? userSchedule.map(c => `${c.code} (${c.selectedSection?.days || 'TBA'} ${c.selectedSection?.startTime || ''})`).join(', ')
      : "No classes enrolled yet.";

    const systemPrompt = `
      You are "Sammy", a helpful academic advisor for UC Santa Cruz.
      
      CONTEXT (Courses visible to user):
      ${courseContextString}

      USER'S CURRENT SCHEDULE:
      ${scheduleString}

      USER QUESTION:
      "${message}"

      INSTRUCTIONS:
      - Answer based ONLY on the provided Context and Schedule.
      - If the user asks for "easy" classes, look for high RMP ratings or lower division numbers if available.
      - If the user asks about conflicts, check the times in their schedule against the Context.
      - Keep it brief and friendly. Use emojis (🐌) sparingly.
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ reply: "My brain froze! Please try asking again. 🐌" });
  }
};

module.exports = {
    handleChat
};