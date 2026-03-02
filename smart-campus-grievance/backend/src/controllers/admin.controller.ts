import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export const getModerationQueue = async (req: AuthRequest, res: Response) => {
    try {
        const flagged = await prisma.complaintAiAnalysis.findMany({
            where: { flaggedForModeration: true },
            include: { complaint: true }
        });
        res.status(200).json(flagged);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        // Basic stats for dashboard
        const openCount = await prisma.complaint.count({ where: { status: 'OPEN' } });
        const inProgressCount = await prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
        const resolvedCount = await prisma.complaint.count({ where: { status: 'RESOLVED' } });

        // SLA Violations (currently open/in-progress with SLA past due)
        const slaViolations = await prisma.complaint.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                slaDeadline: { lt: new Date() }
            },
            select: { id: true, title: true, priority: true, slaDeadline: true }
        });

        // Patterns
        const systemicIssues = await prisma.systemPattern.findMany({
            where: { frequency: { gte: 3 } }, // Flag if happened 3 or more times
            orderBy: { frequency: 'desc' }
        });

        res.status(200).json({
            metrics: {
                open: openCount,
                inProgress: inProgressCount,
                resolved: resolvedCount,
                slaBreaches: slaViolations.length
            },
            slaViolations,
            systemicIssues
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
