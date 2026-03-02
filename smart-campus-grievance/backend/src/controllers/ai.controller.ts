import { Request, Response } from 'express';
import { analyzeComplaintDraft } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth';

export const draftCoach = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description } = req.body;
        const { suggestions } = await analyzeComplaintDraft(title || '', description || '');
        res.status(200).json({ suggestions });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
