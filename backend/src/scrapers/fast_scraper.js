const axios = require('axios').default;
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const https = require('https'); 

// --- SETUP ---
const prisma = new PrismaClient();

// 1. OPTIMIZATION: Keep-Alive Agent
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

// Helper to chunk array
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

async function scrapeFast() {
  console.log("🚀 Launching PARALLEL Scraper (Optimized Mode)...");

  try {
    const ucsc = await prisma.school.upsert({
      where: { name: "UCSC" },
      update: {},
      create: { name: "UCSC" }
    });
    console.log(`🏫 Linked to School: ${ucsc.name}`);

    // 2. INITIAL FETCH
    console.log("📡 Connecting to UCSC PISA...");
    const initRes = await client.get(BASE_URL);
    let $ = cheerio.load(initRes.data);
    
    const termId = $('#term_dropdown option[selected]').val() || $('#term_dropdown option').eq(0).val();
    console.log(`📅 Active Term ID: ${termId}`);

    // 3. MEGA FETCH
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

    // --- STEP 4a: INSTANT PRE-SEED (createMany) ---
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
    
    // THE FIX: Save all 800+ in ONE request instead of 800 requests
    await prisma.professor.createMany({
        data: profData,
        skipDuplicates: true 
    });
    
    console.log("   ✅ Professors synced instantly. Starting class scrape...");


    // --- STEP 4b: BATCH PROCESSING ---
    const BATCH_SIZE = 20; 
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

    // A. Parse Header
    let status = header.includes('Open') ? 'Open' : (header.includes('Wait List') ? 'Wait List' : 'Closed');
    const cleanHeader = header.replace(/Open|Closed|Wait List/g, '').trim();
    const parts = cleanHeader.split('-');
    if (parts.length < 2) return;

    const code = parts[0].trim(); 
    const rest = parts.slice(1).join('-').trim();
    const sectionMatch = rest.match(/^(\d+[A-Z]?)\s+(.*)/);
    const section = sectionMatch ? sectionMatch[1] : "01";
    const title = sectionMatch ? sectionMatch[2] : rest;

    // B. Parse Body
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

    // C. Fetch Details
    let discussions = [];
    const detailsLinkHref = $(el).find('h2 a').attr('href');
    if (detailsLinkHref) {
        try {
            const detailsUrl = `${BASE_URL.replace('index.php', '')}${detailsLinkHref}`;
            const detailsRes = await client.get(detailsUrl);
            discussions = parseDiscussions(detailsRes.data);
        } catch (err) {}
    }

    // D. Save to DB
    await saveToDatabase({ code, title, section, instructor, meeting, location, status, enrolled, capacity, discussions }, schoolId);
}

function parseDiscussions(html) {
    const $ = cheerio.load(html);
    const results = [];
    const targetHeader = $('.panel-heading').filter((i, el) => $(el).text().includes('Associated'));
    if (targetHeader.length === 0) return [];

    const panel = targetHeader.closest('.panel');
    const rows = panel.find('.row.row-striped');

    rows.each((i, row) => {
        const text = $(row).text().replace(/[\n\r]+/g, ' ').trim();
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

// --- DB LOGIC ---
async function saveToDatabase(course, schoolId) {
    try {
      // 1. Course Upsert
      const dbCourse = await prisma.course.upsert({
        where: { schoolId_code: { schoolId: schoolId, code: course.code } },
        update: { 
          name: course.title,
          instructor: course.instructor,
          department: course.code.split(' ')[0]
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
        status: course.status
      };

      // 2. Section Upsert
      let lectureId;
      const existingSection = await prisma.section.findUnique({ where: { sectionCode: uniqueSectionCode } });
      if (existingSection) {
        const updated = await prisma.section.update({ where: { id: existingSection.id }, data: lectureData });
        lectureId = updated.id;
      } else {
        const created = await prisma.section.create({ data: lectureData });
        lectureId = created.id;
      }

      // 3. Discussions Upsert
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