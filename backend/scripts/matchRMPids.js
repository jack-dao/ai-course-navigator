const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const SCHOOL_ID = "U2Nob29sLTEwNzg="; 

const DEPT_MAP = {
    "AM": ["Applied Mathematics"],   
    "STAT": ["Statistics"],          
    "MATH": ["Mathematics"],         
    "CSE": ["Computer Science", "Computer Engineering"], 
    "ECE": ["Electrical Engineering", "Computer Engineering"],
    "BME": ["Biomolecular", "Bioinformatics", "Biology"],
    "CMPM": ["Computational Media", "Game Design"],
    "TIM": ["Technology", "Information Management"],
    
    "BIOL": ["Biology", "Biological"],
    "BIOC": ["Biochemistry"],
    "CHEM": ["Chemistry"],
    "PHYS": ["Physics"],
    "ASTR": ["Astronomy", "Astrophysics"],
    "EART": ["Earth Sciences", "Geology"],
    "OCEA": ["Ocean"],
    "METX": ["Microbiology", "Toxicology"],
    "ENVS": ["Environmental"],

    "ECON": ["Economics"],
    "PSYC": ["Psychology"],
    "SOCY": ["Sociology"],
    "ANTH": ["Anthropology"],
    "POLI": ["Politics", "Political Science"],
    "LALS": ["Latin American"],
    "LGST": ["Legal Studies"],
    "EDUC": ["Education"],

    "LIT": ["Literature", "English"],
    "WRIT": ["Writing", "Rhetoric"],
    "LING": ["Linguistics"],
    "HIS": ["History"],
    "PHIL": ["Philosophy"],
    "HAVC": ["History of Art", "Visual Culture"],
    
    "ART": ["Art", "Studio Art"],
    "ARTG": ["Art", "Game Design"],
    "FILM": ["Film"],
    "THEA": ["Theater"],
    "MUSC": ["Music"],
    
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
    const professors = await prisma.professor.findMany({
        include: { sections: { include: { course: true } } }
    });

    console.log(`🔍 Auditing ${professors.length} professors with STRICT logic...`);

    let matchCount = 0;

    for (const prof of professors) {
        const { lastName, firstInitial } = getPisaName(prof.name);
        
        if (lastName === 'Staff') continue;

        const taughtSubjects = [...new Set(prof.sections.map(s => s.course.department))]; 
        const taughtCodes = prof.sections.map(s => s.course.code.replace(/\s/g, ""));     

        let results = await searchRMP(`${lastName} ${firstInitial}`);
        if (results.length === 0) results = await searchRMP(lastName);

        const candidates = results.map(x => x.node);
        if (candidates.length === 0) continue;

        const scores = candidates.map(ins => {
            let score = 0;

            if (ins.lastName.toLowerCase() === lastName.toLowerCase()) {
                score += 2;
                if (firstInitial && ins.firstName.startsWith(firstInitial)) score += 2;
            } else {
                return { candidate: ins, score: -100 }; 
            }

            const rmpCourseNames = ins.courseCodes.map(c => c.courseName.toUpperCase());
            const hasPrefixMatch = taughtSubjects.some(pisaSubject => {
                return rmpCourseNames.some(rmpCode => rmpCode.startsWith(pisaSubject));
            });

            if (hasPrefixMatch) score += 5; 

            const rmpDept = (ins.department || "").toLowerCase();
            const matchesDeptText = taughtSubjects.some(pisaSubject => {
                const keywords = DEPT_MAP[pisaSubject] || []; 
                return keywords.some(k => rmpDept.includes(k.toLowerCase()));
            });

            if (matchesDeptText) score += 3;

            const rmpCleanCodes = rmpCourseNames.map(c => c.replace(/\s/g, ""));
            const matchesExactCode = taughtCodes.some(c => rmpCleanCodes.includes(c));
            
            if (matchesExactCode) score += 10;

            return { candidate: ins, score };
        });

        scores.sort((a, b) => b.score - a.score);
        const best = scores[0];

        if (best.score >= 5) {
            if (prof.rmpId !== best.candidate.legacyId.toString()) {
                const pisaName = prof.name.padEnd(25); 
                const rmpName = `${best.candidate.firstName} ${best.candidate.lastName}`;
                console.log(`   🔗 LINKED: ${pisaName} => ${rmpName}`);
                
                matchCount++;

                await prisma.professor.update({
                    where: { id: prof.id },
                    data: { rmpId: best.candidate.legacyId.toString() }
                });
            }
        } else {
            if (prof.rmpId && prof.rmpId === best.candidate.legacyId.toString()) {
                await prisma.professor.update({
                    where: { id: prof.id },
                    data: { rmpId: null, avgRating: null, avgDifficulty: null }
                });
            }
        }
        
        await new Promise(r => setTimeout(r, 200)); 
    }
    console.log(`\n✅ Done! Matched ${matchCount} professors.`);
}

run();