import { PrismaClient } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import logger from '../src/lib/logger';

const prisma = new PrismaClient();

interface RMPRatingNode {
    comment: string;
    date: string;
    class: string;
    grade: string;
    helpfulRating: number;
    clarityRating: number;
    difficultyRating: number;
    wouldTakeAgain: number;
    ratingTags: string | null;
}

interface RMPTeacherNode {
    avgRating: number;
    numRatings: number;
    avgDifficulty: number;
    wouldTakeAgainPercent: number | null;
    department: string;
    ratings: {
        edges: Array<{ node: RMPRatingNode }>;
    };
}

interface CleanReview {
    comment: string;
    date: string;
    course: string;
    grade: string;
    rating: number;
    difficulty: number;
    wouldTakeAgain: boolean;
    tags: string[];
}

interface FetchDetailsResult {
    avgRating: number;
    numRatings: number;
    avgDifficulty: number;
    wouldTakeAgainPercent: number | null;
    department: string;
    reviews: CleanReview[];
}

async function fetchDetails(legacyId: string): Promise<FetchDetailsResult | null> {
    const b64Id = Buffer.from(`Teacher-${legacyId}`).toString('base64');
    try {
        const resp: AxiosResponse = await axios.post("https://www.ratemyprofessors.com/graphql", {
            query: `query ($id: ID!) {
                node(id: $id) {
                  ... on Teacher {
                    avgRating
                    numRatings
                    avgDifficulty
                    wouldTakeAgainPercent
                    department
                    ratings(first: 20) {
                      edges {
                        node {
                          comment
                          date
                          class
                          grade
                          helpfulRating
                          clarityRating
                          difficultyRating
                          wouldTakeAgain
                          ratingTags
                        }
                      }
                    }
                  }
                }
            }`,
            variables: { id: b64Id }
        }, { headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" } });

        const instructor: RMPTeacherNode | undefined = resp.data?.data?.node;
        if (!instructor) return null;

        const cleanReviews: CleanReview[] = instructor.ratings.edges.map(edge => ({
            comment: edge.node.comment,
            date: edge.node.date,
            course: edge.node.class,
            grade: edge.node.grade,
            rating: (edge.node.helpfulRating + edge.node.clarityRating) / 2,
            difficulty: edge.node.difficultyRating,
            wouldTakeAgain: edge.node.wouldTakeAgain === 1,
            tags: edge.node.ratingTags ? edge.node.ratingTags.split("--").filter(t => t) : []
        }));

        return {
            avgRating: instructor.avgRating,
            numRatings: instructor.numRatings,
            avgDifficulty: instructor.avgDifficulty,
            wouldTakeAgainPercent: instructor.wouldTakeAgainPercent,
            department: instructor.department,
            reviews: cleanReviews
        };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error(`Error fetching RMP: ${message}`);
        return null;
    }
}

async function run(): Promise<void> {
    const professors = await prisma.professor.findMany({
        where: { rmpId: { not: null } }
    });

    logger.info(`Updating ratings for ${professors.length} professors...`);

    for (const prof of professors) {
        const data = await fetchDetails(prof.rmpId!);

        if (data) {
            const takeAgainRaw = data.wouldTakeAgainPercent;
            const takeAgainVal = (takeAgainRaw !== null && takeAgainRaw !== -1)
                ? Math.round(takeAgainRaw).toString()
                : "N/A";

            const rmpLink = `https://www.ratemyprofessors.com/professor/${prof.rmpId}`;

            logger.info(`${prof.name}: ${data.avgRating}/5 | ${takeAgainVal}% Again | ${data.reviews.length} reviews`);

            await prisma.professor.update({
                where: { id: prof.id },
                data: {
                    avgRating: data.avgRating,
                    avgDifficulty: data.avgDifficulty,
                    numRatings: data.numRatings,
                    wouldTakeAgain: takeAgainVal,
                    rmpLink: rmpLink,
                    reviews: data.reviews as unknown as any
                }
            });
        }
        await new Promise(r => setTimeout(r, 200));
    }
    logger.info("Ratings refresh complete!");
}

run()
    .catch(e => logger.error("Unhandled error:", e))
    .finally(async () => await prisma.$disconnect());
