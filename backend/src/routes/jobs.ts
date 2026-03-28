import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all jobs
router.get('/', authenticate, async (req: any, res) => {
    try {
        const user = req.user;
        let whereClause = {};

        if (user.role === 'Designer') {
            whereClause = { designerId: user.id };
        } else if (user.role === 'Client Relations') {
            whereClause = { clientRelationsId: user.id };
        }

        const jobs = await prisma.job.findMany({
            where: whereClause,
            include: {
                designer: { select: { username: true, fullName: true } },
                clientRelations: { select: { username: true, fullName: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Get single job by database ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { id: parseInt(req.params.id as string, 10) },
            include: {
                designer: { select: { username: true, fullName: true } },
                clientRelations: { select: { username: true, fullName: true } }
            }
        });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

// Get single job by its BUSINESS string Job ID (e.g. ALM001234)
router.get('/jobId/:jobId', authenticate, async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { jobId: req.params.jobId as string },
            include: {
                designer: { select: { fullName: true, username: true } },
                clientRelations: { select: { fullName: true, username: true } }
            }
        });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job by Job ID' });
    }
});

// Create a new job
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const {
            jobId, date, customer, jobName, size, die, colours,
            material, windingDirection, finishing, designerId, clientRelationsId
        } = req.body;

        const newJob = await prisma.job.create({
            data: {
                jobId,
                date: new Date(date),
                customer,
                jobName,
                size,
                die,
                colours,
                material,
                windingDirection,
                finishing,
                designerId: parseInt(designerId, 10),
                clientRelationsId: parseInt(clientRelationsId, 10),
                status: 'Design Pending', // Default initial status
            }
        });

        await prisma.activityLog.create({
            data: { action: `Created Job ${jobId}`, userId }
        });

        res.status(201).json(newJob);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A job with this Job ID already exists. Please use a unique ID.' });
        }
        res.status(500).json({ error: error.message || 'Failed to create job' });
    }
});

// Update a job status
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).user.id;

        // Optional constraint: checking the exact workflow "Design Pending -> Designing -> Design Hold -> Approved -> Plate Process -> Completed"
        const validStatuses = ['Design Pending', 'Designing', 'Design Hold', 'Approved', 'Plate Process', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status transition' });
        }

        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id as string, 10) },
            data: { status, lastUpdate: new Date() }
        });

        await prisma.activityLog.create({
            data: { action: `Updated Job ${updatedJob.jobId} status to ${status}`, userId }
        });

        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update job status' });
    }
});

// Delete a job
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const deletedJob = await prisma.job.delete({
            where: { id: parseInt(id as string, 10) }
        });

        await prisma.activityLog.create({
            data: { action: `Deleted Job ${deletedJob.jobId}`, userId }
        });

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Update an entire job
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const {
            jobId, date, customer, jobName, size, die, colours,
            material, windingDirection, finishing, designerId, clientRelationsId, status
        } = req.body;

        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id as string, 10) },
            data: {
                jobId,
                date: new Date(date),
                customer,
                jobName,
                size,
                die,
                colours,
                material,
                windingDirection,
                finishing,
                designerId: parseInt(designerId, 10),
                clientRelationsId: parseInt(clientRelationsId, 10),
                status: status,
                lastUpdate: new Date()
            }
        });

        await prisma.activityLog.create({
            data: { action: `Updated Job Details for ${updatedJob.jobId}`, userId }
        });

        res.json(updatedJob);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A job with this Job ID already exists. Please use a unique ID.' });
        }
        res.status(500).json({ error: 'Failed to update job details' });
    }
});

export default router;
