const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const saveSchedule = async (req, res) => {
    try {
        const { name, courses } = req.body;
        const userId = req.user.userId;

        if (!courses) {
            return res.status(400).json({ error: 'Courses are required' });
        }

        await prisma.schedule.deleteMany({
            where: { userId: userId }
        });

        const schedule = await prisma.schedule.create({
            data: {
                name,
                courses, 
                userId
            },
        });

        res.status(200).json(schedule);
    }
    catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
};

const getSchedules = async (req, res) => {
    try {
        const userId = req.user.userId;
        const schedule = await prisma.schedule.findFirst({
            where: { userId: userId },
            orderBy: { createdAt: 'desc'}
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