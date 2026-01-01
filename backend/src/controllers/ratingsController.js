const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRatings = async (req, res) => {
  try {
    console.log("🌟 Fetching fresh ratings from DB...");

    const professors = await prisma.professor.findMany({
      select: {
        name: true,
        avgRating: true,      
        avgDifficulty: true,  
        wouldTakeAgain: true, 
        numRatings: true,
        rmpLink: true,        
        reviews: true         
      }
    });

    const ratingsMap = {};
    
    professors.forEach(prof => {
      ratingsMap[prof.name] = {
        avgRating: prof.avgRating || 0,
        avgDifficulty: prof.avgDifficulty || 0,
        wouldTakeAgain: prof.wouldTakeAgain || "N/A", 
        numRatings: prof.numRatings || 0,
        rmpLink: prof.rmpLink,
        reviews: prof.reviews || [] 
      };
    });

    console.log(`✅ Served ratings for ${Object.keys(ratingsMap).length} professors.`);
    res.json(ratingsMap);

  } catch (err) {
    console.error("❌ Error fetching ratings from DB:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
};

module.exports = { getRatings };