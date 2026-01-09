const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

const handleChat = async (req, res) => {
  try {
    const { message, contextCourses, userSchedule } = req.body;
    
    console.log("📝 User Schedule:", userSchedule?.length > 0 ? userSchedule.length + " classes" : "Empty");

    const scheduleString = userSchedule && userSchedule.length > 0
      ? userSchedule.map(c => 
          `• ${c.code} (${c.name}): ${c.days} @ ${c.times}`
        ).join('\n')
      : "No classes enrolled yet.";

    const relevantCourses = Array.isArray(contextCourses) ? contextCourses : [];
    
    const courseContextString = relevantCourses.map(c => 
      `- ${c.code}: ${c.name} (${c.credits} units). GE: ${c.geCode || "None"}. Prereqs: ${c.prerequisites || "None"}.\n` + 
      `  Sections: ${c.sections?.map(s => 
          `[${s.instructor} | ${s.days} ${s.startTime}-${s.endTime} | Status: ${s.status || 'Unknown'}]`
      ).join(', ') || 'Staff'}`
    ).join('\n');

    const systemPrompt = `
      You are "Sammy", an academic advisor for UC Santa Cruz.
      
      🛑 STEP 1: REVIEW USER'S SCHEDULE
      The user is CURRENTLY ENROLLED in these classes. You MUST respect these times:
      ${scheduleString}

      🛑 STEP 2: USER'S REQUEST
      "${message}"

      🛑 STEP 3: SEARCH CATALOG & CHECK CONFLICTS
      Course Catalog:
      ${courseContextString}

      🚨 IMPORTANT INSTRUCTIONS:
      1. START your response by explicitly confirming you see their schedule. Say: "I see you are taking [Class 1] and [Class 2]..."
      2. IF the user asks for a class that "fits", CHECK Step 1. Do NOT recommend classes that overlap with the times listed in Step 1.
      3. IF the user asks for "easy" classes, prioritize:
         - High Professor Ratings (if available in context).
         - Lower division numbers (1-99).
         - Classes with "None" or minimal Prerequisites.
      4. IF a class is marked "Status: Closed" or "Waitlist", you MUST warn the user that the class is full but they might be able to waitlist.
      5. Do not write extremely long responses.
      6. IF the schedule is empty, say "Your schedule is wide open!"
      
      REMINDER - USER'S BUSY TIMES:
      ${scheduleString}
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