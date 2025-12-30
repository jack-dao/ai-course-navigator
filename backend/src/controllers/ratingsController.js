// backend/src/controllers/ratingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRatings = async (req, res) => {
  try {
    // 1. Fetch all professors from the DB who actually have a rating
    const professors = await prisma.professor.findMany({
      where: {
        rating: { not: null }
      }
    });

    // 2. Convert array to the Map format your Frontend expects:
    // { "Tantalo, P.": { avgRating: 4.5, ... } }
    const ratingsMap = {};
    
    professors.forEach(prof => {
      ratingsMap[prof.name] = {
        avgRating: prof.rating,
        avgDifficulty: prof.difficulty,
        numRatings: prof.numRatings,
        rmpId: prof.rmpId,
        // If you saved reviews or 'wouldTakeAgain' in your DB, add them here.
        // Otherwise, the frontend handles missing fields gracefully.
      };
    });

    res.json(ratingsMap);
  } catch (err) {
    console.error("Error fetching ratings from DB:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
};

module.exports = {
    getRatings
};