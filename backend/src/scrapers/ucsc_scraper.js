const axios = require('axios').default;
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const https = require('https'); 
const prisma = new PrismaClient();

const agent = new https.Agent({ 
    keepAlive: true,
    maxSockets: 15 
});

const client = axios.create({ 
    httpsAgent: agent,
    timeout: 30000, 
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
}); 

const BASE_URL = 'https://pisa.ucsc.edu/class_search/index.php';

const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

async function scrapeFast() {
  console.log("🚀 Launching PARALLEL Scraper (Optimized Mode)...");

  try {
    console.log("📡 Connecting to UCSC PISA...");
    const initRes = await client.get(BASE_URL);
    let $ = cheerio.load(initRes.data);

    const termName = $('#term_dropdown option[selected]').text().trim() || "Winter 2026";
    const termId = $('#term_dropdown option[selected]').val() || $('#term_dropdown option').eq(0).val();

    console.log(`📅 Detected Term: ${termName} (ID: ${termId})`);

    const ucsc = await prisma.school.upsert({
      where: { name: "UCSC" },
      update: { currentTerm: termName },
      create: { name: "UCSC", currentTerm: termName }
    });

    console.log(`🏫 Linked to School: ${ucsc.name}`);
    console.log("⚡️ Executing Mega-Fetch...");
    
    const baseParams = {
        'action': 'results',
        'binds[:term]': termId,
        'binds[:reg_status]': 'all',
        'binds[:subject]': '', 
        'rec_start': '0',
        'rec_dur': '5000' 
    };

    const formData = new URLSearchParams(baseParams);
    const megaResponse = await client.post(BASE_URL, formData.toString());
    
    $ = cheerio.load(megaResponse.data);
    const panels = $('.panel.panel-default').toArray();
    console.log(`📦 Payload received. Found ${panels.length} classes.`);

    if (panels.length === 0) return;

    console.log("👥 Pre-syncing Professors (Batch Mode)...");
    const uniqueInstructors = new Set();
    
    panels.forEach(el => {
        const header = $(el).find('.panel-heading').text().trim();
        if (header.includes('Search Results')) return;
        
        const instructor = $(el).find('.panel-body .row > div:nth-child(2)')
             .text().split(':')[1]?.trim() || "Staff";
             
        if (instructor) uniqueInstructors.add(instructor);
    });

    const profData = Array.from(uniqueInstructors).map(name => ({ name }));
    console.log(`   Found ${uniqueInstructors.size} unique instructors. Saving...`);
    await prisma.professor.createMany({
        data: profData,
        skipDuplicates: true 
    });
    
    console.log("   ✅ Professors synced instantly. Starting class scrape...");

    const BATCH_SIZE = 10; 
    const batches = chunk(panels, BATCH_SIZE);
    let processedCount = 0;

    console.log(`🔥 Starting Batch Processing (${batches.length} batches)...`);

    for (const batch of batches) {
        const promises = batch.map(el => processClass($, el, ucsc.id));
        await Promise.all(promises);

        processedCount += batch.length;
        process.stdout.write(`\r✅ Processed ${processedCount}/${panels.length} classes...`);
        
        await new Promise(r => setTimeout(r, 50));
    }

    console.log(`\n\n🎉 Master Scrape Complete!`);

  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function processClass($, el, schoolId) {
    const header = $(el).find('.panel-heading').text().trim();
    if (header.includes('Search Results')) return;

    let status = header.includes('Open') ? 'Open' : (header.includes('Wait List') ? 'Wait List' : 'Closed');
    const cleanHeader = header.replace(/Open|Closed|Wait List/g, '').trim();
    const parts = cleanHeader.split('-');
    if (parts.length < 2) return;

    const code = parts[0].trim(); 
    const rest = parts.slice(1).join('-').trim();
    const sectionMatch = rest.match(/^(\d+[A-Z]?)\s+(.*)/);
    const section = sectionMatch ? sectionMatch[1] : "01";
    let title = sectionMatch ? sectionMatch[2] : rest;

    let instructor = $(el).find('.panel-body .row > div:nth-child(2)').text().split(':')[1]?.trim() || "Staff";
    let location = $(el).find('.panel-body .row > div:nth-child(3) > div:nth-child(1)').text().replace("Location:", "").trim() || "TBA";
    let meeting = $(el).find('.panel-body .row > div:nth-child(3) > div:nth-child(2)').text().replace("Day and Time:", "").trim() || "TBA";
    
    let enrolled = 0, capacity = 0;
    const enrollText = $(el).find('.panel-body .row > div:nth-child(4)').text();
    const enrollMatch = enrollText.match(/(\d+)\s+of\s+(\d+)/);
    if (enrollMatch) {
        enrolled = parseInt(enrollMatch[1]);
        capacity = parseInt(enrollMatch[2]);
    }

    let discussions = [];
    let geCode = null;
    let prerequisites = null;
    let career = null;
    let grading = null;
    let classNumber = null;
    let instructionMode = null;
    let credits = 5; 

    let detailsLinkHref = $(el).find('h2 a').attr('href');
    if (!detailsLinkHref) detailsLinkHref = $(el).find('.panel-heading a').attr('href');
    if (!detailsLinkHref) detailsLinkHref = $(el).find('a').first().attr('href');
    
    if (detailsLinkHref) {
        try {
            const detailsUrl = `${BASE_URL.replace('index.php', '')}${detailsLinkHref}`;
            const detailsRes = await client.get(detailsUrl);
            const detail$ = cheerio.load(detailsRes.data);

            discussions = parseDiscussions(detail$);

            let fullHeader = '';
            detail$('h2').each((i, h2) => {
                const text = detail$(h2).text().replace(/\u00A0/g, ' ').trim();
                if (text.startsWith(code)) {
                    fullHeader = text;
                    return false; 
                }
            });

            if (fullHeader) {
                let remaining = fullHeader.substring(code.length).trim();
                remaining = remaining.replace(/^[-–\s]+/, '').trim();
                remaining = remaining.replace(/^\d+[A-Z]?\s+/, '').trim();
                if (remaining.length > 0) title = remaining;
            }

            const panelText = detail$('.panel-body').text().replace(/\s+/g, ' '); 
            
            const classNumMatch = panelText.match(/Class Number\s*:?\s*(\d{5})/i);
            if (classNumMatch) classNumber = classNumMatch[1];
            else {
                const possibleNum = detail$('.panel-body .row:first-child .col-xs-6:last-child').text().trim();
                if (possibleNum && /^\d{5}$/.test(possibleNum)) classNumber = possibleNum;
            }

            const creditsMatch = panelText.match(/Credits\s*:?\s*(\d+)\s*units?/i);
            if (creditsMatch) credits = parseInt(creditsMatch[1]);

            const modeMatch = panelText.match(/Instruction Mode\s*:?\s*(.+?)\s*(?:Credits|General)/i);
            if (modeMatch) instructionMode = modeMatch[1].trim();

            const careerMatch = panelText.match(/Career\s*:?\s*(Undergraduate|Graduate)/i);
            if (careerMatch) career = careerMatch[1].trim();

            const gradingMatch = panelText.match(/Grading\s*:?\s*(.+?)\s*Class Number/i);
            if (gradingMatch) grading = gradingMatch[1].trim();

            const geMatch = panelText.match(/General Education(?:[:\s]*(?:Code\(s\))?[:\s]*)?([A-Z\s,-]+?)(?=\.?\s*Status)/i);
            if (geMatch) {
                const rawGe = geMatch[1].trim();
                if (rawGe.length < 15 && rawGe !== '.') geCode = rawGe;
            }

            const prereqMatch = panelText.match(/Enrollment Requirements\s*([\s\S]+?)(?=\s*(?:Class Notes|Meeting Information|Description|$))/i);
            if (prereqMatch) prerequisites = prereqMatch[1].trim();

        } catch (err) {
             // Silently fail on details to keep speed up
        }
    }

    await saveToDatabase({ 
        code, title, section, instructor, meeting, location, status, enrolled, capacity, discussions,
        geCode, prerequisites, career, grading, classNumber, instructionMode, credits
    }, schoolId);
}

function parseDiscussions(detail$) {
    const results = [];
    const targetHeader = detail$('.panel-heading').filter((i, el) => detail$(el).text().includes('Associated'));
    if (targetHeader.length === 0) return [];

    const panel = targetHeader.closest('.panel');
    const rows = panel.find('.row.row-striped');

    rows.each((i, row) => {
        const text = detail$(row).text().replace(/[\n\r]+/g, ' ').trim();
        const headerMatch = text.match(/#(\d+)\s+([A-Z]+)\s+(\d+[A-Z]?)/);
        if (!headerMatch) return;

        const type = headerMatch[2];
        const sectionNum = headerMatch[3];
        let time = "TBA", location = "TBA", enrolled = 0, capacity = 0, days = "TBA";

        const timeMatch = text.match(/(\d{2}:\d{2}[AP]M-\d{2}:\d{2}[AP]M)/);
        if (timeMatch) time = timeMatch[1];
        const dayMatch = text.match(/\b(M|Tu|W|Th|F|MW|TuTh|MWF|Sa|Su)\b/);
        if (dayMatch) days = dayMatch[1];
        
        const locMatch = text.match(/Loc:\s*(.*?)(?=\s+(Enrl|Wait|Staff|$))/);
        if (locMatch) location = locMatch[1].trim();
        
        const statsMatch = text.match(/Enrl:\s*(\d+)\s*\/\s*(\d+)/);
        if (statsMatch) { enrolled = parseInt(statsMatch[1]); capacity = parseInt(statsMatch[2]); }

        results.push({
            sectionNumber: sectionNum, sectionType: type, days, time, location, enrolled, capacity,
            status: (enrolled >= capacity && capacity > 0) ? "Closed" : "Open"
        });
    });
    return results;
}

async function saveToDatabase(course, schoolId) {
    try {
      const dbCourse = await prisma.course.upsert({
        where: { schoolId_code: { schoolId: schoolId, code: course.code } },
        update: { 
          name: course.title,
          instructor: course.instructor,
          department: course.code.split(' ')[0],
          geCode: course.geCode,
          prerequisites: course.prerequisites,
          career: course.career,
          grading: course.grading,
          credits: course.credits 
        },
        create: {
          code: course.code,
          name: course.title,
          credits: course.credits, 
          instructor: course.instructor,
          department: course.code.split(' ')[0],
          schoolId: schoolId,
          geCode: course.geCode,
          prerequisites: course.prerequisites,
          career: course.career,
          grading: course.grading
        }
      });

      const days = course.meeting.split(' ')[0] || "TBA"; 
      const timeRange = course.meeting.split(' ').slice(1).join(' ') || "TBA";
      const uniqueSectionCode = `${course.code}-${course.section}`; 

      const lectureData = {
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
        status: course.status,
        classNumber: course.classNumber,
        instructionMode: course.instructionMode
      };

      let lectureId;
      const existingSection = await prisma.section.findUnique({ where: { sectionCode: uniqueSectionCode } });
      if (existingSection) {
        const updated = await prisma.section.update({ where: { id: existingSection.id }, data: lectureData });
        lectureId = updated.id;
      } else {
        const created = await prisma.section.create({ data: lectureData });
        lectureId = created.id;
      }

      if (course.discussions && course.discussions.length > 0) {
          for (const dis of course.discussions) {
              const uniqueDisCode = `${course.code}-${dis.sectionNumber}`;
              const disData = {
                  courseId: dbCourse.id,
                  parentId: lectureId,
                  sectionCode: uniqueDisCode,
                  sectionNumber: dis.sectionNumber,
                  sectionType: dis.sectionType,
                  instructor: "Staff", 
                  days: dis.days,
                  time: dis.time,
                  startTime: dis.time.split('-')[0] || "TBA",
                  endTime: dis.time.split('-')[1] || "TBA",
                  location: dis.location,
                  enrolled: dis.enrolled,
                  capacity: dis.capacity,
                  status: dis.status
              };

              const existingDis = await prisma.section.findUnique({ where: { sectionCode: uniqueDisCode }});
              if (existingDis) {
                  await prisma.section.update({ where: { id: existingDis.id }, data: disData });
              } else {
                  await prisma.section.create({ data: disData });
              }
          }
      }
    } catch (e) { 
        console.error(`Error saving ${course.code}:`, e.message);
    }
}

scrapeFast();