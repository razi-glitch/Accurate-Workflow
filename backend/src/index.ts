import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is localhost or local IP on port 5173
        if (/^http:\/\/(localhost|192\.168\.\d+\.\d+):5173$/.test(origin)) {
            return callback(null, true);
        }

        // Fallback for explicit allowed origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        const isProduction = !!process.env.FRONTEND_URL;
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: isProduction, 
            sameSite: isProduction ? 'none' : 'lax' 
        });

        // Log activity
        await prisma.activityLog.create({
            data: { action: 'User logged in', userId: user.id }
        });

        res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const isProduction = !!process.env.FRONTEND_URL;
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, username: true, fullName: true, role: true } });

        if (!user) return res.status(401).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});



import jobRoutes from './routes/jobs';
import svgRoutes from './routes/svg';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import settingsRoutes from './routes/settings';

app.use('/api/jobs', jobRoutes);
app.use('/api/svg', svgRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} and local network (e.g. http://192.168.1.91:${PORT})`);
});
