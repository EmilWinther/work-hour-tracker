import express from 'express';
import { json } from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { WorkWeek } from './types';

const app = express();
const dataFile = path.join(__dirname, 'data.json');

app.use(json());
app.use(express.static('public'));

// Get current week number
function getCurrentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

// Get current day of week (0 = Sunday, 1 = Monday, etc.)
function getCurrentDay(): number {
    return new Date().getDay();
}

async function initDataFile() {
    try {
        await fs.access(dataFile);
    } catch {
        await fs.writeFile(dataFile, JSON.stringify([]));
    }
}

async function readWorkWeeks(): Promise<WorkWeek[]> {
    const data = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(data);
}

async function writeWorkWeeks(weeks: WorkWeek[]): Promise<void> {
    await fs.writeFile(dataFile, JSON.stringify(weeks, null, 2));
}

// Routes
app.get('/api/weeks', async (req, res) => {
    try {
        const weeks = await readWorkWeeks();
        res.json(weeks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read work weeks' });
    }
});

app.get('/api/current-week', async (req, res) => {
    try {
        const weeks = await readWorkWeeks();
        const currentWeek = getCurrentWeek();
        const week = weeks.find(w => w.weekNumber === currentWeek) || {
            weekNumber: currentWeek,
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null,
            lastUpdated: new Date().toISOString()
        };
        res.json(week);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get current week' });
    }
});

app.post('/api/weeks', async (req, res) => {
    try {
        const partialWeek: Partial<WorkWeek> = req.body;
        const weeks = await readWorkWeeks();
        
        const existingIndex = weeks.findIndex(w => w.weekNumber === partialWeek.weekNumber);
        const now = new Date().toISOString();
        
        if (existingIndex >= 0) {
            weeks[existingIndex] = {
                ...weeks[existingIndex],
                ...partialWeek,
                lastUpdated: now
            };
        } else {
            weeks.push({
                weekNumber: partialWeek.weekNumber!,
                monday: null,
                tuesday: null,
                wednesday: null,
                thursday: null,
                friday: null,
                ...partialWeek,
                lastUpdated: now
            });
        }
        
        await writeWorkWeeks(weeks);
        res.json(weeks.find(w => w.weekNumber === partialWeek.weekNumber));
    } catch (error) {
        res.status(500).json({ error: 'Failed to save work week' });
    }
});

// Add to src/app.ts after existing routes

app.delete('/api/weeks/:weekNumber', async (req, res) => {
    try {
        const weekNumber = parseInt(req.params.weekNumber);
        let weeks = await readWorkWeeks();
        weeks = weeks.filter(w => w.weekNumber !== weekNumber);
        await writeWorkWeeks(weeks);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete week' });
    }
});

// Initialize and start server
initDataFile().then(() => {
    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });
});