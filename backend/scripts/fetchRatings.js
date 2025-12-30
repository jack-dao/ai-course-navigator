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
                  }
                }
            }`,
            variables: { id: b64Id }
        }, { headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" } });
        return resp.data?.data?.node;
    } catch (e) { return null; }
}

async function run() {
    // 1. Find professors who have an ID but NO rating yet
    const professors = await prisma.professor.findMany({
        where: { 
            rmpId: { not: null },
            rating: null 
        }
    });

    console.log(`⭐ Fetching ratings for ${professors.length} professors...`);

    for (const prof of professors) {
        const data = await fetchDetails(prof.rmpId);
        
        if (data) {
            console.log(`   updated ${prof.name}: ${data.avgRating} / 5.0`);
            
            await prisma.professor.update({
                where: { id: prof.id },
                data: {
                    rating: data.avgRating,
                    difficulty: data.avgDifficulty,
                    numRatings: data.numRatings
                }
            });
        }
        await new Promise(r => setTimeout(r, 200)); 
    }
}

run();