import { Request, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

export const getModerationQueue = async (req: AuthRequest, res: Response) => {
    try {
        const [analysisRows] = await pool.execute<RowDataPacket[]>(`
            SELECT a.*, c.title as complaint_title, c.description as complaint_desc, c.status as complaint_status
            FROM ComplaintAiAnalysis a 
            JOIN Complaint c ON a.complaintId = c.id
            WHERE a.flaggedForModeration = 1
        `);
        
        const flagged = analysisRows.map(row => ({
            id: row.id,
            complaintId: row.complaintId,
            aiSummary: row.aiSummary,
            sentimentScore: row.sentimentScore,
            abuseScore: row.abuseScore,
            qualityScore: row.qualityScore,
            explainableOutput: typeof row.explainableOutput === 'string' ? JSON.parse(row.explainableOutput) : row.explainableOutput,
            flaggedForModeration: true,
            complaint: {
                id: row.complaintId,
                title: row.complaint_title,
                description: row.complaint_desc,
                status: row.complaint_status
            }
        }));

        res.status(200).json(flagged);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const [openRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM Complaint WHERE status = "OPEN"');
        const [inProgressRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM Complaint WHERE status = "IN_PROGRESS"');
        const [resolvedRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM Complaint WHERE status = "RESOLVED"');

        const [slaViolations] = await pool.execute<RowDataPacket[]>(`
            SELECT id, title, priority, slaDeadline 
            FROM Complaint 
            WHERE status IN ('OPEN', 'IN_PROGRESS') AND slaDeadline < NOW()
        `);

        const [systemicIssues] = await pool.execute<RowDataPacket[]>(`
            SELECT * 
            FROM SystemPattern 
            WHERE frequency >= 3
            ORDER BY frequency DESC
        `);

        res.status(200).json({
            metrics: {
                open: openRows[0].cnt,
                inProgress: inProgressRows[0].cnt,
                resolved: resolvedRows[0].cnt,
                slaBreaches: slaViolations.length
            },
            slaViolations,
            systemicIssues
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
