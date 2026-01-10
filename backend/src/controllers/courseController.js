const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


function getSmartTerm() {
  const now = new Date();
  const month = now.getMonth(); 
  const year = now.getFullYear();

  if (month <= 2) return `Winter ${year}`;
  if (month <= 5) return `Spring ${year}`;
  if (month <= 8) return `Summer ${year}`;
  return `Fall ${year}`;
}

const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        school: true,
        sections: {
          where: { 
            parentId: null // Only show lectures (parents), hide sections/labs from top level
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

const getSchoolInfo = async (req, res) => {
  try {
    const school = await prisma.school.findFirst({
      where: { name: "UCSC" }
    });

    const dynamicTerm = school?.currentTerm || getSmartTerm();

    res.json({
      id: 'ucsc',
      name: 'UC Santa Cruz',
      shortName: 'UCSC',
      term: dynamicTerm, 
      status: 'active'
    });
  } catch (error) {
    console.error("Metadata Error:", error);
    res.status(500).json({ error: 'Failed to fetch school info' });
  }
};

module.exports = {
  getCourses,
  getSchoolInfo 
};