const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        school: true,

        sections: {
          where: { 
            // only show the lectures
            parentId: null   
          },
          orderBy: { 
            sectionNumber: 'asc' 
          },
          include: {
            subSections: {
              orderBy: { sectionNumber: 'asc' }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    const sortedCourses = courses.sort((a, b) => {
      const codeA = a.code || ""; 
      const codeB = b.code || "";
      
      const [numA] = codeA.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      const [numB] = codeB.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      
      return (parseInt(numA) || 0) - (parseInt(numB) || 0);
    });

    res.json(sortedCourses);
  } 
  catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

module.exports = {
  getCourses
};