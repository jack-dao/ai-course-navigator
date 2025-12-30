const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const SCHOOL_ID = "U2Nob29sLTEwNzg="; // UCSC ID

// --- STRICT 1:1 DEPARTMENT MAPPING ---
// Only matches if the RMP department text explicitly includes these specific words.
const DEPT_MAP = {
    // ENGINEERING & MATH (Strict Separation)
    "AM": ["Applied Mathematics"],   // Removed "Math"
    "STAT": ["Statistics"],          // Removed "Math"
    "MATH": ["Mathematics"],         // Strictly Math
    "CSE": ["Computer Science", "Computer Engineering"], 
    "ECE": ["Electrical Engineering", "Computer Engineering"],
    "BME": ["Biomolecular", "Bioinformatics", "Biology"],
    "CMPM": ["Computational Media", "Game Design"],
    "TIM": ["Technology", "Information Management"],
    
    // SCIENCES
    "BIOL": ["Biology", "Biological"],
    "BIOC": ["Biochemistry"],
    "CHEM": ["Chemistry"],
    "PHYS": ["Physics"],
    "ASTR": ["Astronomy", "Astrophysics"],
    "EART": ["Earth Sciences", "Geology"],
    "OCEA": ["Ocean"],
    "METX": ["Microbiology", "Toxicology"],
    "ENVS": ["Environmental"],

    // SOCIAL SCIENCES
    "ECON": ["Economics"],
    "PSYC": ["Psychology"],
    "SOCY": ["Sociology"],
    "ANTH": ["Anthropology"],
    "POLI": ["Politics", "Political Science"],
    "LALS": ["Latin American"],
    "LGST": ["Legal Studies"],
    "EDUC": ["Education"],

    // HUMANITIES
    "LIT": ["Literature", "English"],
    "WRIT": ["Writing", "Rhetoric"],
    "LING": ["Linguistics"],
    "HIS": ["History"],
    "PHIL": ["Philosophy"],
    "HAVC": ["History of Art", "Visual Culture"],
    
    // ARTS
    "ART": ["Art", "Studio Art"],
    "ARTG": ["Art", "Game Design"],
    "FILM": ["Film"],
    "THEA": ["Theater"],
    "MUSC": ["Music"],
    
    // LANGUAGES
    "SPAN": ["Spanish"],
    "FREN": ["French"],
    "GERM": ["German"],
    "ITAL": ["Italian"],
    "JAPN": ["Japanese"],
    "CHIN": ["Chinese"]
};

function getPisaName(name) {
    const split = name.split(",");
    const lastName = split[0].trim();
    const firstInitial = split[1] ? split[1].trim().charAt(0) : "";
    return { lastName, firstInitial };
}

async function searchRMP(queryText) {
    try {
        const resp = await axios.post("https://www.ratemyprofessors.com/graphql", {
            query: `query ($query: TeacherSearchQuery!) {
                newSearch { teachers(query: $query) { edges { node { 
                    legacyId firstName lastName department 
                    courseCodes { courseName } 
                } } } }
            }`,
            variables: { query: { schoolID: SCHOOL_ID, text: queryText } }
        }, { headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" } });
        return resp.data?.data?.newSearch?.teachers?.edges || [];
    } catch (e) { return []; }
}

async function run() {
    // 1. Fetch ALL professors to re-verify everyone
    const professors = await prisma.professor.findMany({
        include: { sections: { include: { course: true } } }
    });

    console.log(`🔍 Auditing ${professors.length} professors with STRICT logic...`);

    for (const prof of professors) {
        const { lastName, firstInitial } = getPisaName(prof.name);
        
        // PISA DATA: What does this professor teach according to our scrape?
        const taughtSubjects = [...new Set(prof.sections.map(s => s.course.department))]; // e.g. ["AM"]
        const taughtCodes = prof.sections.map(s => s.course.code.replace(/\s/g, ""));     // e.g. ["AM10"]

        // SEARCH RMP
        let results = await searchRMP(`${lastName} ${firstInitial}`);
        if (results.length === 0) results = await searchRMP(lastName);

        const candidates = results.map(x => x.node);
        if (candidates.length === 0) continue;

        // --- SCORING SYSTEM (Now including Prefix Matching) ---
        const scores = candidates.map(ins => {
            let score = 0;

            // 1. NAME CHECK
            if (ins.lastName.toLowerCase() === lastName.toLowerCase()) {
                score += 2;
                if (firstInitial && ins.firstName.startsWith(firstInitial)) score += 2;
            } else {
                return { candidate: ins, score: -100 }; // Wrong person
            }

            // 2. PREFIX MATCH (+5 Points) - The "SlugSchedule" Method
            // If PISA says "AM", and RMP has a class starting with "AM", it's a match.
            const rmpCourseNames = ins.courseCodes.map(c => c.courseName.toUpperCase());
            
            const hasPrefixMatch = taughtSubjects.some(pisaSubject => {
                // Check if any RMP course starts with "AM" (e.g. "AM10", "AM 20")
                return rmpCourseNames.some(rmpCode => rmpCode.startsWith(pisaSubject));
            });

            if (hasPrefixMatch) score += 5; 

            // 3. DEPARTMENT TEXT MATCH (+3 Points) - Fallback
            // Only used if they haven't listed courses, or as extra confirmation.
            const rmpDept = (ins.department || "").toLowerCase();
            const matchesDeptText = taughtSubjects.some(pisaSubject => {
                const keywords = DEPT_MAP[pisaSubject] || []; 
                return keywords.some(k => rmpDept.includes(k.toLowerCase()));
            });

            if (matchesDeptText) score += 3;

            // 4. EXACT COURSE MATCH (+10 Points) - The "Golden Ticket"
            const rmpCleanCodes = rmpCourseNames.map(c => c.replace(/\s/g, ""));
            const matchesExactCode = taughtCodes.some(c => rmpCleanCodes.includes(c));
            
            if (matchesExactCode) score += 10;

            return { candidate: ins, score };
        });

        // Pick Winner
        scores.sort((a, b) => b.score - a.score);
        const best = scores[0];

        // LOGIC: 
        // We need at least 5 points to update.
        // Name(4) is not enough. You need Name + (Prefix OR Dept OR ExactCode).
        if (best.score >= 5) {
            if (prof.rmpId !== best.candidate.legacyId.toString()) {
                console.log(`   ✅ FIXED: ${prof.name} -> ${best.candidate.firstName} ${best.candidate.lastName} (Score: ${best.score})`);
                await prisma.professor.update({
                    where: { id: prof.id },
                    data: { rmpId: best.candidate.legacyId.toString() }
                });
            }
        } else {
            // If the score is weak (e.g. 4), and we currently have this person linked, UNLINK them.
            // This fixes "David Lee" (Score 4) being linked to "Dongwook Lee's" class.
            if (prof.rmpId && prof.rmpId === best.candidate.legacyId.toString()) {
                console.log(`   ❌ DROPPING: ${prof.name} (Score ${best.score} too low)`);
                await prisma.professor.update({
                    where: { id: prof.id },
                    data: { rmpId: null, rating: null, difficulty: null }
                });
            }
        }
        await new Promise(r => setTimeout(r, 200)); 
    }
}

run();