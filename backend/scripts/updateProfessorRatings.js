const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function fetchRatings(legacyId) {
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
                  }
                }
            }`,
            variables: { id: b64Id }
        }, {
            headers: {
                Authorization: "Basic dGVzdDp0ZXN0",
                "Content-Type": "application/json"
            }
        });

        return resp.data?.data?.node || null;
    } 
    catch (err) {
        console.log(`   ⚠️ Error fetching ratings for ID ${legacyId}: ${err.message}`);
        return null;
    }
}

async function buildRatingsMap() {
    const dataDir = path.join(__dirname, '../src/data');
    const idsPath = path.join(dataDir, 'rmp_ids.json');
    const ratingsPath = path.join(dataDir, 'rmp_ratings.json');

    try {
        if (!fs.existsSync(idsPath)) {
            return console.error("❌ Error: rmp_ids.json not found. Run updateProfessorIDs.js first.");
        }

        const idMap = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
        let ratingsMap = fs.existsSync(ratingsPath) ? JSON.parse(fs.readFileSync(ratingsPath, 'utf8')) : {};
        
        const names = Object.keys(idMap);
        console.log(`🚀 Fetching ratings for ${names.length} professors...`);

        for (const name of names) {
            const legacyId = idMap[name];
            console.log(`📊 Fetching: ${name} (ID: ${legacyId})`);
            
            const stats = await fetchRatings(legacyId);
            
            if (stats) {
                ratingsMap[name] = {
                    avgRating: stats.avgRating,
                    numRatings: stats.numRatings,
                    avgDifficulty: stats.avgDifficulty,
                    wouldTakeAgain: stats.wouldTakeAgainPercent !== -1 ? Math.round(stats.wouldTakeAgainPercent) : "N/A"
                };
                console.log(`   ✅ Success: ${stats.avgRating}/5`);
            }

            await new Promise(r => setTimeout(r, 1000));
        }

        fs.writeFileSync(ratingsPath, JSON.stringify(ratingsMap, null, 2));
        console.log(`\n🎉 Success! Updated ratings for ${Object.keys(ratingsMap).length} professors.`);

    }
    catch (err) {
        console.error("Fatal Error:", err.message);
    }
}

buildRatingsMap();