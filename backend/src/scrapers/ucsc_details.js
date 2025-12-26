const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// --- CONFIGURATION ---
// TRUE  = Only scrape CSE classes (Fast, good for testing code)
// FALSE = Scrape EVERY course in the DB (Slow, run this overnight)
const TEST_MODE = false; 
// ---------------------

async function scrapeDetails() {
  console.log(`🤖 Launching Universal Details Scraper (TEST_MODE: ${TEST_MODE})...`);
  
  let courses;

  if (TEST_MODE) {
      console.log("⚠️ RUNNING IN FAST MODE: Only checking CSE courses.");
      courses = await prisma.course.findMany({
          where: { code: { startsWith: 'CSE' } },
          orderBy: { code: 'asc' }
      });
  } else {
      console.log("🐢 RUNNING IN PRODUCTION MODE: Checking ALL courses.");
      courses = await prisma.course.findMany({
          orderBy: { code: 'asc' }
      });
  }

  console.log(`📚 Found ${courses.length} courses to process.`);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Detect Current Term
  await page.goto('https://pisa.ucsc.edu/class_search/', { waitUntil: 'networkidle2' });
  const currentTerm = await page.evaluate(() => document.querySelector('#term_dropdown').value);
  console.log(`📅 Using Active Term ID: ${currentTerm}`);

  let processedCount = 0;

  for (const course of courses) {
    processedCount++;
    
    // Log progress periodically so you know it hasn't frozen
    if (processedCount % 10 === 0) {
        console.log(`   [${processedCount} / ${courses.length}] Processing...`);
    }

    try {
      // --- PARSE CODE ---
      // "CSE 101" -> subject="CSE", number="101"
      // "ART 10"  -> subject="ART", number="10"
      const parts = course.code.split(' ');
      const subject = parts[0]; 
      const courseNumber = parts.slice(1).join(' '); 

      // 2. Search
      await page.goto('https://pisa.ucsc.edu/class_search/', { waitUntil: 'networkidle2' });
      await page.select('#term_dropdown', currentTerm); 
      await page.select('#subject', subject);           
      await page.type('#catalog_nbr', courseNumber);    
      
      const statusDropdownId = await page.evaluate(() => {
        const option = document.querySelector('option[value="all"]');
        return option ? option.parentElement.id : null;
      });
      if (statusDropdownId) await page.select(`#${statusDropdownId}`, 'all');

      await Promise.all([page.waitForNavigation(), page.click('.btn-primary')]);

      // 3. Get Lecture IDs
      const lectureIds = await page.evaluate(() => {
        const ids = [];
        document.querySelectorAll('a[id^="class_id_"]').forEach(a => ids.push(a.id));
        return ids;
      });

      if (lectureIds.length === 0) {
          continue;
      }

      // Only log if we actually found something to scrape
      console.log(`\n🔍 Checking ${course.code} (Found ${lectureIds.length} lectures)...`);

      // 4. Loop through lectures
      for (let i = 0; i < lectureIds.length; i++) {
         if (i > 0) {
             await page.goto('https://pisa.ucsc.edu/class_search/', { waitUntil: 'networkidle2' });
             await page.select('#term_dropdown', currentTerm); 
             await page.select('#subject', subject);
             await page.type('#catalog_nbr', courseNumber);
             if (statusDropdownId) await page.select(`#${statusDropdownId}`, 'all');
             await Promise.all([page.waitForNavigation(), page.click('.btn-primary')]);
         }

         const freshIds = await page.evaluate(() => {
             const ids = [];
             document.querySelectorAll('a[id^="class_id_"]').forEach(a => ids.push(a.id));
             return ids;
         });
         
         await Promise.all([page.waitForNavigation(), page.click(`a[id="${freshIds[i]}"]`)]);
         
         // 5. Scrape Labs/Discussions
         await scrapeLabsFromPage(page, course);
      }

    } catch (e) {
      // console.log(`   ⚠️ Error on ${course.code}: ${e.message}`);
    }
  }

  console.log("✅ Done!");
  await browser.close();
  await prisma.$disconnect();
}

async function scrapeLabsFromPage(page, course) {
    // 1. Identify Parent Lecture
    const parentSectionCode = await page.evaluate(() => {
        const titleElement = document.querySelector('h2'); 
        const titleText = titleElement ? titleElement.innerText : "";
        const match = titleText.match(/-\s+(\d+[A-Z]?)\s+/);
        return match ? match[1] : null;
    });

    if (!parentSectionCode) return;

    const fullParentCode = `${course.code}-${parentSectionCode}`;
    const parentSection = await prisma.section.findFirst({
        where: { sectionCode: fullParentCode }
    });

    if (!parentSection) return;

    // 2. Scrape Rows
    const labs = await page.evaluate(() => {
        const data = [];
        const headers = Array.from(document.querySelectorAll('.panel-heading'));
        const targetHeader = headers.find(h => h.innerText.includes('Associated'));
        
        if (!targetHeader) return [];

        const panel = targetHeader.closest('.panel');
        const rows = panel.querySelectorAll('.row.row-striped');

        rows.forEach(row => {
            const fullText = row.innerText.replace(/[\n\r]+/g, ' ').trim();
            data.push({ raw: fullText });
        });
        return data;
    });

    // 3. Save
    let savedCount = 0;
    for (const lab of labs) {
        const saved = await saveLabToDatabase(lab, parentSection, course);
        if (saved) savedCount++;
    }
    
    if (savedCount > 0) {
        console.log(`   ✅ [${fullParentCode}]: Linked ${savedCount} discussions/labs.`);
    }
}

async function saveLabToDatabase(labRaw, parent, course) {
    const text = labRaw.raw; 
    const headerMatch = text.match(/#(\d+)\s+([A-Z]+)\s+(\d+[A-Z]?)/);
    
    if (!headerMatch) return false; 
    
    const type = headerMatch[2];       
    const sectionNum = headerMatch[3]; 
    const uniqueCode = `${course.code}-${sectionNum}`;

    let time = "TBA";
    let location = "TBA";
    let enrolled = 0;
    let capacity = 0;
    let days = "TBA";

    const timeMatch = text.match(/(\d{2}:\d{2}[AP]M-\d{2}:\d{2}[AP]M)/);
    if (timeMatch) time = timeMatch[1];

    const dayMatch = text.match(/\b(M|Tu|W|Th|F|MW|TuTh|MWF)\b/);
    if (dayMatch) days = dayMatch[1];

    const locMatch = text.match(/Loc:\s*(.*?)(?=\s+(Enrl|Wait|Staff|$))/);
    if (locMatch) location = locMatch[1].trim();

    const statsMatch = text.match(/Enrl:\s*(\d+)\s*\/\s*(\d+)/);
    if (statsMatch) {
        enrolled = parseInt(statsMatch[1]);
        capacity = parseInt(statsMatch[2]);
    }

    const existing = await prisma.section.findFirst({ where: { sectionCode: uniqueCode }});
    
    const data = {
        courseId: course.id,
        parentId: parent.id, 
        sectionCode: uniqueCode,
        sectionNumber: sectionNum,
        sectionType: type,
        instructor: "Staff", 
        days: days,
        time: time,
        startTime: time.split('-')[0] || "TBA",
        endTime: time.split('-')[1] || "TBA",
        location: location,
        enrolled: enrolled,
        capacity: capacity,
        status: (enrolled >= capacity && capacity > 0) ? "Closed" : "Open"
    };

    if (existing) {
        await prisma.section.update({ where: { id: existing.id }, data });
    } else {
        await prisma.section.create({ data });
    }
    return true;
}

scrapeDetails();