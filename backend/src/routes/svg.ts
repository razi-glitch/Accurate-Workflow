import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';

const router = Router();

// Store files in memory for processing directly without saving to disk unnecessarily
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', authenticate, upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No template file uploaded' });
        }

        // The mapping from the user form
        const variables = JSON.parse(req.body.variables || '{}');
        let svgContent = req.file.buffer.toString('utf-8');

        // Replace matches exactly like {{ Customer }}, {{job_id}} etc. Allows for internal XML tags
        svgContent = svgContent.replace(/\{\{([\s\S]*?)\}\}/g, (match, p1) => {
            // Illustrator might inject <tspan> inside the {{ }}
            const cleanVarName = p1.replace(/(<([^>]+)>)/gi, "").trim();

            // Find case-insensitive match from the provided variables
            const key = Object.keys(variables).find(k => k.toLowerCase() === cleanVarName.toLowerCase());
            return key ? variables[key] : match; // fallback to original if not found
        });

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', 'attachment; filename="processed_template.svg"');
        res.send(svgContent);

    } catch (error) {
        console.error('Error processing SVG:', error);
        res.status(500).json({ error: 'Failed to process SVG template' });
    }
});

export default router;
