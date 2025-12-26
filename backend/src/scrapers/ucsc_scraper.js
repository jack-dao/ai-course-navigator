// src/scrapers/ucsc_scraper.js
const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function scrapeAllClasses() {
  console.log("🚀 Launching Master Scraper (All Subjects)...");
  
  const browser = await puppeteer.launch({ headless: false }); 
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // --- 1. SETUP SCHOOL ---
    const ucsc = await prisma.school.upsert({
      where: { name: "UCSC" },
      update: {},
      create: { name: "UCSC" }
    });
    console.log(`🏫 Linked to School: ${ucsc.name} (ID: ${ucsc.id})`);

    // --- 2. GO TO SEARCH PAGE ---
    await page.goto('https://pisa.ucsc.edu/class_search/', { waitUntil: 'networkidle2' });

    // --- 3. DYNAMIC TERM DETECTION ---
    const currentTerm = await page.evaluate(() => document.querySelector('#term_dropdown').value);
    const currentTermName = await page.evaluate(() => {
        const select = document.querySelector('#term_dropdown');
        return select.options[select.selectedIndex].text;
    });
    console.log(`📅 Detected Active Term: ${currentTermName} (ID: ${currentTerm})`);

    // --- 4. GET ALL SUBJECTS ---
    const subjects = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('#subject option'));
        return options.map(opt => opt.value).filter(val => val !== "");
    });
    
    console.log(`📚 Found ${subjects.length} subjects to scrape.`);

    // --- 5. THE MEGA LOOP (Subject by Subject) ---
    for (const subject of subjects) {
        console.log(`\n-----------------------------------`);
        console.log(`🔍 Scraping Subject: ${subject}...`);

        try {
            // A. Reset Search Form
            await page.goto('https://pisa.ucsc.edu/class_search/', { waitUntil: 'networkidle2' });
            await page.select('#term_dropdown', currentTerm);
            await page.select('#subject', subject);

            // B. Select "All Classes"
            const statusDropdownId = await page.evaluate(() => {
                const option = document.querySelector('option[value="all"]');
                return option ? option.parentElement.id : null;
            });
            if (statusDropdownId) await page.select(`#${statusDropdownId}`, 'all');

            // C. Click Search
            await Promise.all([page.waitForNavigation(), page.click('.btn-primary')]);

            // D. Loop Pages for this Subject
            let keepGoing = true;
            let pageNum = 1;

            while (keepGoing) {
                // --- SCRAPE DATA (Your Original Logic) ---
                const scrapedData = await page.evaluate(() => {
                    const results = [];
                    const panels = document.querySelectorAll('.panel.panel-default');

                    panels.forEach(panel => {
                        const headerText = panel.querySelector('.panel-heading')?.innerText || '';
                        const bodyText = panel.querySelector('.panel-body')?.innerText || '';
                        
                        if (headerText.includes('Search Results')) return;

                        let status = 'Closed';
                        if (headerText.includes('Open')) status = 'Open';
                        if (headerText.includes('Wait List')) status = 'Wait List'; 

                        let cleanHeader = headerText.replace(/Open|Closed|Wait List/g, '').trim();
                        const parts = cleanHeader.split('-');
                        if (parts.length < 2) return;

                        const code = parts[0].trim(); 
                        const rest = parts.slice(1).join('-').trim();
                        const sectionMatch = rest.match(/^(\d+[A-Z]?)\s+(.*)/);
                        
                        let section = "01"; 
                        let title = rest;
                        if (sectionMatch) {
                            section = sectionMatch[1];
                            title = sectionMatch[2];
                        }

                        const lines = bodyText.split('\n').map(l => l.trim());
                        let instructor = "Staff";
                        let location = "TBA";
                        let meeting = "TBA";
                        let enrolled = 0;
                        let capacity = 0;

                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            if (line.includes('Instructor:')) instructor = lines[i+1] || "Staff";
                            if (line.includes('Location:')) location = lines[i+1] || "TBA"; 
                            if (line.includes('Day and Time:')) meeting = lines[i+1] || "TBA";
                            if (line.includes('Enrolled')) {
                                const matches = line.match(/(\d+)\s+of\s+(\d+)/);
                                if (matches) {
                                    enrolled = parseInt(matches[1]);
                                    capacity = parseInt(matches[2]);
                                }
                            }
                        }
                        
                        results.push({ code, title, section, instructor, meeting, location, status, enrolled, capacity });
                    });
                    return results;
                });

                // --- SAVE BATCH ---
                if (scrapedData.length > 0) {
                    await saveToDatabase(scrapedData, ucsc.id);
                    process.stdout.write(`   (Page ${pageNum}: ${scrapedData.length} classes)`);
                }

                // --- NEXT PAGE CHECK ---
                const nextButtonSelector = 'a[onclick*="action.value = \'next\'"]';
                const hasNextButton = await page.evaluate((selector) => !!document.querySelector(selector), nextButtonSelector);
                
                if (hasNextButton) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle2' }),
                        page.click(nextButtonSelector) 
                    ]);
                    pageNum++;
                } else {
                    keepGoing = false;
                }
            }
        } catch (e) {
            console.log(`   ❌ Skipped ${subject} (No classes found or error)`);
        }
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

// --- REUSED DATABASE LOGIC ---
async function saveToDatabase(courses, schoolId) {
  for (const course of courses) {
    try {
      // 1. Upsert Course
      const dbCourse = await prisma.course.upsert({
        where: { schoolId_code: { schoolId: schoolId, code: course.code } },
        update: { 
          name: course.title,
          instructor: course.instructor,
          department: course.code.split(' ')[0] // e.g., "MATH" or "CSE"
        },
        create: {
          code: course.code,
          name: course.title,
          credits: 5,
          instructor: course.instructor,
          department: course.code.split(' ')[0],
          schoolId: schoolId
        }
      });

      // 2. Upsert Section
      const days = course.meeting.split(' ')[0] || "TBA"; 
      const timeRange = course.meeting.split(' ').slice(1).join(' ') || "TBA";
      const uniqueSectionCode = `${course.code}-${course.section}`;

      const sectionData = {
        courseId: dbCourse.id,
        sectionNumber: course.section,
        sectionCode: uniqueSectionCode,
        sectionType: "LEC", 
        instructor: course.instructor,
        days: days,
        time: timeRange,
        startTime: timeRange.split('-')[0] || "TBA",
        endTime: timeRange.split('-')[1] || "TBA",
        location: course.location,
        enrolled: course.enrolled,
        capacity: course.capacity,
        status: course.status
      };

      const existingSection = await prisma.section.findFirst({
        where: { sectionCode: uniqueSectionCode }
      });

      if (existingSection) {
        await prisma.section.update({ where: { id: existingSection.id }, data: sectionData });
      } else {
        await prisma.section.create({ data: sectionData });
      }
    } catch (e) {
      // Ignore duplicates or minor errors
    }
  }
}

scrapeAllClasses();