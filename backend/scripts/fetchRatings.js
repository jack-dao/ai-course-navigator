const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function fetchDetails(legacyId) {
    const b64Id = Buffer.from(`Teacher-${legacyId}`).toString('base64');
    try {
        const resp = await axios.post("https://www.ratemyprofessors.com/graphql", {
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

        const instructor = resp.data?.data?.node;
        if (!instructor) return null;

        const cleanReviews = instructor.ratings.edges.map(edge => ({
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
            ...instructor,
            reviews: cleanReviews
        };
    } catch (e) { 
        console.error("Error fetching RMP:", e.message);
        return null; 
    }
}

async function run() {
    const professors = await prisma.professor.findMany({
        where: { rmpId: { not: null } }
    });

    console.log(`⭐ Updating ratings for ${professors.length} professors...`);

    for (const prof of professors) {
        const data = await fetchDetails(prof.rmpId);
        
        if (data) {
            const takeAgainRaw = data.wouldTakeAgainPercent;
            const takeAgainVal = (takeAgainRaw !== null && takeAgainRaw !== -1) 
                ? Math.round(takeAgainRaw).toString() 
                : "N/A";

            const rmpLink = `https://www.ratemyprofessors.com/professor/${prof.rmpId}`;

            console.log(`   📝 ${prof.name}: ${data.avgRating}/5 | ${takeAgainVal}% Again | ${data.reviews.length} reviews`);
            
            await prisma.professor.update({
                where: { id: prof.id },
                data: {
                    avgRating: data.avgRating,
                    avgDifficulty: data.avgDifficulty,
                    numRatings: data.numRatings,
                    wouldTakeAgain: takeAgainVal, 
                    rmpLink: rmpLink,
                    reviews: data.reviews
                }
            });
        }
        await new Promise(r => setTimeout(r, 200)); 
    }
    console.log("✅ Ratings refresh complete!");
}

run()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());