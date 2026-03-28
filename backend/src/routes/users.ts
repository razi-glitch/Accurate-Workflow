import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Only Admins should ideally access these routes, but for simplicity
// we'll just require authentication and optionally check role if needed.
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get all users (Only Admin sees all, others might just see names for dropdowns which is done differently if needed)
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, fullName: true, role: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// User self-service change password
router.patch('/change-password', authenticate, async (req: any, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid current password' });

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Admin force reset user password
router.patch('/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: parseInt(id as string, 10) },
            data: { passwordHash }
        });

        res.json({ message: 'User password reset successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset user password.' });
    }
});

// Create user (Admin Only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { username, fullName, password, role } = req.body;

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: 'Username already exists' });

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { username, fullName: fullName || username, passwordHash, role }
        });

        // Don't send back the hash
        res.status(201).json({ id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, fullName, role, password } = req.body;

        const updateData: any = { username, fullName, role };
        if (password && password.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id as string, 10) },
            data: updateData
        });

        res.json({ id: updatedUser.id, username: updatedUser.username, fullName: updatedUser.fullName, role: updatedUser.role });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting oneself
        if (parseInt(id as string, 10) === (req as any).user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({
            where: { id: parseInt(id as string, 10) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Cannot delete user because they have associated jobs' });
        }
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
