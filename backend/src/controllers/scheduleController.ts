import prisma from '../lib/prisma';
import type { Request, Response } from 'express';

const saveSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, courses } = req.body;
        const userId = req.user!.userId;
        const email = req.user!.email;
        const userName = req.user!.user_metadata?.full_name || email?.split('@')[0] || 'User';

        if (!courses) {
            res.status(400).json({ error: 'Courses are required' });
            return;
        }

        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: email || `user_${userId}@example.com`,
                name: userName,
                password: null,
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
        res.status(500).json({ error: 'Failed to save schedule' });
    }
};

const getSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { term } = req.query;

        const schedule = await prisma.schedule.findFirst({
            where: {
                userId: userId,
                name: term as string | undefined
            }
        });

        if (!schedule) {
             res.json({ courses: [] });
             return;
        }

        res.json(schedule);
    }
    catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};

export {
    saveSchedule,
    getSchedules
};
