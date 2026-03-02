import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';
import { processComplaintWithAI, checkRecurrentIssues } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth';

const complaintSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    category: z.string(), // initial category guess
    urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
    location: z.string().optional(),
    isAnonymous: z.boolean().default(false)
});

export const submitComplaint = async (req: AuthRequest, res: Response) => {
    try {
        const data = complaintSchema.parse(req.body);
        const userId = req.user!.id;

        // Fetch user trust score (hidden from frontend)
        const userRow = await prisma.user.findUnique({ where: { id: userId } });
        const userTrustScore = userRow?.trustScore || 5.0;

        // AI Analysis
        const aiAnalysis = await processComplaintWithAI(data.title, data.description, userTrustScore, data.urgency);

        // Create complaint
        const complaint = await prisma.complaint.create({
            data: {
                title: data.title,
                description: data.description,
                category: aiAnalysis.category, // AI overridden category
                urgency: data.urgency,
                location: data.location,
                priority: aiAnalysis.priority,
                slaDeadline: aiAnalysis.slaDeadline,
                isAnonymous: data.isAnonymous,
                studentId: data.isAnonymous ? null : userId,
                status: 'OPEN'
            }
        });

        // Save AI output
        await prisma.complaintAiAnalysis.create({
            data: {
                complaintId: complaint.id,
                aiSummary: aiAnalysis.aiSummary,
                sentimentScore: aiAnalysis.sentimentScore,
                abuseScore: aiAnalysis.abuseScore,
                qualityScore: aiAnalysis.qualityScore,
                explainableOutput: JSON.stringify(aiAnalysis.explainableOutput),
                flaggedForModeration: aiAnalysis.flaggedForModeration
            }
        });

        // Save log
        await prisma.complaintLog.create({
            data: {
                complaintId: complaint.id,
                action: 'Created',
                newStatus: 'OPEN',
                changedById: userId
            }
        });

        // Check recurrent
        if (data.location) {
            await checkRecurrentIssues(aiAnalysis.category, data.location);
        }

        res.status(201).json({ message: 'Complaint submitted', id: complaint.id });
    } catch (error: any) {
        console.error(error);
        if (error instanceof z.ZodError) res.status(400).json({ error: error.issues });
        else res.status(500).json({ error: error.message || error.toString() });
    }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
    try {
        const { role, id } = req.user!;
        let whereClause: any = {};

        if (role === 'STUDENT') {
            whereClause = { studentId: id };
        } else if (role === 'FACULTY') {
            const user = await prisma.user.findUnique({ where: { id } });
            if (user?.department) {
                whereClause = { category: user.department }; // rough match
            }
        }
        // Admin sees all

        const complaints = await prisma.complaint.findMany({
            where: whereClause,
            include: {
                student: { select: { email: true } },
                aiAnalysis: { select: { flaggedForModeration: true, aiSummary: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const complaintId = req.params.id as string;
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                logs: { include: { changedBy: { select: { email: true, role: true } } }, orderBy: { timestamp: 'desc' } },
                aiAnalysis: true,
                student: { select: { email: true } }
            }
        });

        if (!complaint) return res.status(404).json({ error: 'Not found' });

        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user!.id;

        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const complaintId = req.params.id as string;
        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint) return res.status(404).json({ error: 'Not found' });

        let resolutionTime = complaint.resolutionTime;
        if (status === 'RESOLVED' || status === 'REJECTED') {
            resolutionTime = new Date();
        }

        const updated = await prisma.complaint.update({
            where: { id: complaintId },
            data: { status, resolutionTime }
        });

        await prisma.complaintLog.create({
            data: {
                complaintId: complaintId,
                action: 'Status Updated',
                previousStatus: complaint.status,
                newStatus: status,
                changedById: userId
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
