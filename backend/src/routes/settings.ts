import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const optionTypes = ['color', 'material', 'finishing', 'winding'] as const;

// Get all options
router.get('/:type', authenticate, async (req, res) => {
    try {
        const type = req.params.type as typeof optionTypes[number];
        if (!optionTypes.includes(type)) return res.status(400).json({ error: 'Invalid config type' });

        let data: any[] = [];
        if (type === 'color') data = await prisma.colorOption.findMany();
        else if (type === 'material') data = await prisma.materialOption.findMany();
        else if (type === 'finishing') data = await prisma.finishingOption.findMany();
        else if (type === 'winding') data = await prisma.windingOption.findMany();

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch options' });
    }
});

// Create new option
router.post('/:type', authenticate, async (req, res) => {
    try {
        const type = req.params.type as typeof optionTypes[number];
        if (!optionTypes.includes(type)) return res.status(400).json({ error: 'Invalid config type' });

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        let data;
        if (type === 'color') data = await prisma.colorOption.create({ data: { name } });
        else if (type === 'material') data = await prisma.materialOption.create({ data: { name } });
        else if (type === 'finishing') data = await prisma.finishingOption.create({ data: { name } });
        else if (type === 'winding') data = await prisma.windingOption.create({ data: { name } });

        res.status(201).json(data);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Option already exists' });
        res.status(500).json({ error: 'Failed to create option' });
    }
});

// Delete option
router.delete('/:type/:id', authenticate, async (req, res) => {
    try {
        const type = req.params.type as typeof optionTypes[number];
        if (!optionTypes.includes(type)) return res.status(400).json({ error: 'Invalid config type' });

        const id = parseInt(req.params.id as string, 10);

        if (type === 'color') await prisma.colorOption.delete({ where: { id } });
        else if (type === 'material') await prisma.materialOption.delete({ where: { id } });
        else if (type === 'finishing') await prisma.finishingOption.delete({ where: { id } });
        else if (type === 'winding') await prisma.windingOption.delete({ where: { id } });

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete option' });
    }
});

// Update an existing option
router.put('/:type/:id', authenticate, async (req, res) => {
    try {
        const type = req.params.type as typeof optionTypes[number];
        if (!optionTypes.includes(type)) return res.status(400).json({ error: 'Invalid config type' });

        const id = parseInt(req.params.id as string, 10);
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        let data;
        if (type === 'color') data = await prisma.colorOption.update({ where: { id }, data: { name } });
        else if (type === 'material') data = await prisma.materialOption.update({ where: { id }, data: { name } });
        else if (type === 'finishing') data = await prisma.finishingOption.update({ where: { id }, data: { name } });
        else if (type === 'winding') data = await prisma.windingOption.update({ where: { id }, data: { name } });

        res.json(data);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Option with this name already exists' });
        res.status(500).json({ error: 'Failed to update option' });
    }
});

// Seed defaults
router.post('/seed/defaults', authenticate, async (req, res) => {
    try {
        // Initial defaults just to mirror old hardcoded values if empty
        const materials = ['Semi Glossy', 'Semi Silver', 'Glossy', 'PP White', 'PP Silver', 'PP Clear'];
        const colors = ['Single Colour', 'Cmyk', 'Cmyk+White'];
        const windings = ['1 - Sleeping Clockwise', '2 - Sleeping Anticlockwise', '3 - Standing Clockwise', '4 - Standing Anticlockwise', 'Manual'];
        const finishes = ['None', 'Glossy Varnish', 'Matt Varnish', 'Glossy Lamination', 'Matt Lamination', 'Spot Uv', 'Foil Stamping'];

        for (const m of materials) await prisma.materialOption.upsert({ where: { name: m }, update: {}, create: { name: m } });
        for (const c of colors) await prisma.colorOption.upsert({ where: { name: c }, update: {}, create: { name: c } });
        for (const w of windings) await prisma.windingOption.upsert({ where: { name: w }, update: {}, create: { name: w } });
        for (const f of finishes) await prisma.finishingOption.upsert({ where: { name: f }, update: {}, create: { name: f } });

        res.json({ message: 'Seeded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to seed options' });
    }
});

export default router;
