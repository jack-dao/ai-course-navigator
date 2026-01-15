const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const saveSchedule = async (req, res) => {
    try {
        const { name, courses } = req.body; 
        const userId = req.user.userId;
        const email = req.user.email; 
        const userName = req.user.user_metadata?.full_name || email?.split('@')[0] || 'User';

        if (!courses) {
            return res.status(400).json({ error: 'Courses are required' });
        }

        await prisma.user.upsert({
            where: { id: userId },
            update: {}, 
            create: {
                id: userId,
                email: email || `user_${userId}@example.com`, 
                name: userName,
                password: '', 
            },
        });

        const existingSchedule = await prisma.schedule.findFirst({
            where: {
                userId: userId,
                name: name 
            }
        });

        let schedule;
        if (existingSchedule) {
            schedule = await prisma.schedule.update({
                where: { id: existingSchedule.id },
                data: { courses }
            });
            console.log(`Updated schedule "${name}" for user ${userId}`);
        } else {
            schedule = await prisma.schedule.create({
                data: {
                    userId,
                    name: name || 'My Schedule',
                    courses
                },
            });
            console.log(`Created new schedule "${name}" for user ${userId}`);
        }

        res.status(200).json(schedule);
    }
    catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Failed to save schedule', details: error.message });
    }
};

const getSchedules = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { term } = req.query; 

        const schedule = await prisma.schedule.findFirst({
            where: { 
                userId: userId,
                name: term
            }
        });
        
        if (!schedule) {
             return res.json({ courses: [] });
        }

        res.json(schedule);
    }
    catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};

module.exports = {
    saveSchedule,
    getSchedules
};