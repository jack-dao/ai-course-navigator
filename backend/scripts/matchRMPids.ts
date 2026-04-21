import { PrismaClient } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import logger from '../src/lib/logger';

const prisma = new PrismaClient();

const SCHOOL_ID = "U2Nob29sLTEwNzg="; // UCSC ID

const DEPT_MAP: Record<string, string[]> = {
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

interface PisaNameParts {
    lastName: string;
    firstNamePart: string;
    firstInitial: string;
}

interface RMPTeacherCandidate {
    legacyId: number;
    firstName: string;
    lastName: string;
    department: string;
    numRatings: number;
    avgRating: number;
    courseCodes: Array<{ courseName: string }>;
}

interface ScoredCandidate {
    candidate: RMPTeacherCandidate;
    score: number;
}

function getPisaName(name: string): PisaNameParts {
    const split = name.split(",");
    const lastName = split[0].trim();
    const firstNamePart = split[1] ? split[1].trim() : "";
    const firstInitial = firstNamePart.charAt(0);
    return { lastName, firstNamePart, firstInitial };
}

async function searchRMP(queryText: string): Promise<Array<{ node: RMPTeacherCandidate }>> {
    try {
        const resp: AxiosResponse = await axios.post("https://www.ratemyprofessors.com/graphql", {
            query: `query ($query: TeacherSearchQuery!, $count: Int) {
                newSearch { teachers(query: $query, first: $count) { edges { node {
                    legacyId firstName lastName department numRatings avgRating
                    courseCodes { courseName }
                } } } }
            }`,
            variables: {
                query: { schoolID: SCHOOL_ID, text: queryText },
                count: 100
            }
        }, { headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" } });
        return resp.data?.data?.newSearch?.teachers?.edges || [];
    } catch (_e) { return []; }
}

async function run(): Promise<void> {
    logger.info("Wiping 'Ghost Profile' matches (0 ratings) to force retry...");

    try {
        await prisma.professor.updateMany({
            where: {
                rmpId: { not: null },
                OR: [{ numRatings: 0 }, { numRatings: null }]
            },
            data: { rmpId: null, numRatings: null, avgRating: null }
        });
    } catch (_e) {
        logger.warn("Skipping auto-purge: numRatings column might be missing");
    }

    const professors = await prisma.professor.findMany({
        include: { sections: { include: { course: true } } }
    });

    logger.info(`Auditing ${professors.length} professors...`);

    let matchCount = 0;

    for (const prof of professors) {
        if (prof.rmpId && prof.numRatings && prof.numRatings > 0) continue;

        const { lastName, firstNamePart, firstInitial } = getPisaName(prof.name);

        if (lastName === 'Staff') continue;

        const taughtSubjects = [...new Set(prof.sections.map(s => s.course.department))];
        const taughtCodes = prof.sections.map(s => s.course.code.replace(/\s/g, ""));

        const deptKeywords = taughtSubjects.flatMap(code => DEPT_MAP[code as string] || []);
        const primaryDept = deptKeywords[0] || "";

        let results: Array<{ node: RMPTeacherCandidate }> = [];

        if (firstNamePart.length > 1) {
            const res = await searchRMP(`${firstNamePart} ${lastName}`);
            results.push(...res);
        }

        if (primaryDept) {
            const res = await searchRMP(`${lastName} ${primaryDept}`);
            results.push(...res);
        }

        const hasRated = results.some(r => r.node.numRatings > 0);
        if (results.length === 0 || !hasRated || lastName.length <= 3) {
            const broad = await searchRMP(lastName);
            results.push(...broad);
        }

        const uniqueResults = new Map<number, { node: RMPTeacherCandidate }>();
        results.forEach(r => uniqueResults.set(r.node.legacyId, r));
        const candidates = Array.from(uniqueResults.values()).map(x => x.node);

        if (candidates.length === 0) continue;

        const scores: ScoredCandidate[] = candidates.map(ins => {
            let score = 0;

            const rmpLastName = ins.lastName.trim().toLowerCase();
            const rmpFirstName = ins.firstName.trim();
            const targetLast = lastName.toLowerCase();

            if (rmpLastName === targetLast) {
                score += 2;
                if (firstInitial && rmpFirstName.startsWith(firstInitial)) score += 2;
            } else {
                return { candidate: ins, score: -100 };
            }

            const rmpCourseNames = ins.courseCodes.map(c => c.courseName.toUpperCase());
            const hasPrefixMatch = taughtSubjects.some(pisaSubject => {
                return rmpCourseNames.some(rmpCode => rmpCode.startsWith(pisaSubject as string));
            });
            if (hasPrefixMatch) score += 5;

            const rmpDept = (ins.department || "").toLowerCase();
            const matchesDeptText = deptKeywords.some(k => rmpDept.includes(k.toLowerCase()));
            if (matchesDeptText) score += 5;

            const rmpCleanCodes = rmpCourseNames.map(c => c.replace(/\s/g, ""));
            const matchesExactCode = taughtCodes.some(c => rmpCleanCodes.includes(c));
            if (matchesExactCode) score += 10;

            if (ins.numRatings > 0) {
                score += 20;
                score += Math.min(ins.numRatings, 5);
            }

            return { candidate: ins, score };
        });

        scores.sort((a, b) => b.score - a.score);
        const best = scores[0];

        if (best.score >= 5) {
            const newRmpId = best.candidate.legacyId.toString();

            if (prof.rmpId !== newRmpId) {
                const pisaName = prof.name.padEnd(25);
                const rmpName = `${best.candidate.firstName} ${best.candidate.lastName}`;
                const ratings = `${best.candidate.numRatings} ratings`;

                logger.info(`LINKED: ${pisaName} => ${rmpName} (${ratings}) [Score: ${best.score}]`);
                matchCount++;

                await prisma.professor.update({
                    where: { id: prof.id },
                    data: { rmpId: newRmpId }
                });
            }
        }

        await new Promise(r => setTimeout(r, 50));
    }
    logger.info(`Done! Matched ${matchCount} professors.`);
}

run();
