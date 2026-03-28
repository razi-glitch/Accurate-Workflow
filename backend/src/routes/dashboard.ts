import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get Dashboard KPI stats
router.get('/', authenticate, async (req: any, res) => {
    try {
        const user = req.user;
        let baseWhere = {};

        if (user.role === 'Designer') {
            baseWhere = { designerId: user.id };
        } else if (user.role === 'Client Relations') {
            baseWhere = { clientRelationsId: user.id };
        }

        const total = await prisma.job.count({ where: baseWhere });
        // Combining Pending and Hold
        const pendingCount = await prisma.job.count({ where: { ...baseWhere, status: 'Design Pending' } });
        const holdCount = await prisma.job.count({ where: { ...baseWhere, status: 'Design Hold' } });
        const designPending = pendingCount + holdCount;

        const designInProcess = await prisma.job.count({ where: { ...baseWhere, status: 'Designing' } });
        const plateCount = await prisma.job.count({ where: { ...baseWhere, status: 'Plate Process' } });
        const approvedCount = await prisma.job.count({ where: { ...baseWhere, status: 'Approved' } });
        const plateProcess = plateCount + approvedCount;

        const completed = await prisma.job.count({ where: { ...baseWhere, status: 'Completed' } });

        const recentJobs = await prisma.job.findMany({
            where: baseWhere,
            take: 5,
            orderBy: { date: 'desc' },
            include: { designer: { select: { username: true } }, clientRelations: { select: { username: true } } }
        });

        res.json({
            total,
            designPending,
            designInProcess,
            plateProcess,
            completed,
            recentJobs
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

export default router;
