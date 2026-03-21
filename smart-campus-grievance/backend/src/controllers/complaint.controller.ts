import { Request, Response } from 'express';
import { pool } from '../db';
import { z } from 'zod';
import { processComplaintWithAI, checkRecurrentIssues } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const complaintSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    category: z.string(), // initial category guess
    department: z.string().optional(),
    urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
    location: z.string().optional(),
    isAnonymous: z.boolean().default(false)
});

export const submitComplaint = async (req: AuthRequest, res: Response) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const data = complaintSchema.parse(req.body);
        const userId = req.user!.id;

        const [users] = await connection.execute<RowDataPacket[]>('SELECT trustScore FROM User WHERE id = ?', [userId]);
        const userTrustScore = users[0]?.trustScore || 5.0;

        const aiAnalysis = await processComplaintWithAI(data.title, data.description, userTrustScore, data.urgency);

        const complaintId = uuidv4();
        const studentId = data.isAnonymous ? null : userId;
        const now = new Date();
        const slaDeadline = aiAnalysis.slaDeadline ? new Date(aiAnalysis.slaDeadline) : null;

        await connection.execute(
            `INSERT INTO Complaint 
            (id, title, description, category, urgency, location, priority, status, isAnonymous, studentId, slaDeadline, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?)`,
            [complaintId, data.title, data.description, aiAnalysis.category, data.urgency, data.location || null, aiAnalysis.priority, data.isAnonymous ? 1 : 0, studentId, slaDeadline, now, now]
        );

        const analysisId = uuidv4();
        await connection.execute(
            `INSERT INTO ComplaintAiAnalysis 
            (id, complaintId, aiSummary, sentimentScore, abuseScore, qualityScore, explainableOutput, flaggedForModeration) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [analysisId, complaintId, aiAnalysis.aiSummary || null, aiAnalysis.sentimentScore || null, aiAnalysis.abuseScore || null, aiAnalysis.qualityScore || null, JSON.stringify(aiAnalysis.explainableOutput), aiAnalysis.flaggedForModeration ? 1 : 0]
        );

        const logId = uuidv4();
        await connection.execute(
            `INSERT INTO ComplaintLog 
            (id, complaintId, action, newStatus, changedById, timestamp) 
            VALUES (?, ?, 'Created', 'OPEN', ?, ?)`,
            [logId, complaintId, userId, now]
        );

        await connection.commit();

        if (data.location) {
            await checkRecurrentIssues(aiAnalysis.category, data.location);
        }

        res.status(201).json({ message: 'Complaint submitted', id: complaintId });
    } catch (error: any) {
        await connection.rollback();
        console.error(error);
        if (error instanceof z.ZodError) res.status(400).json({ error: error.issues });
        else res.status(500).json({ error: error.message || error.toString() });
    } finally {
        connection.release();
    }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
    try {
        const { role, id } = req.user!;
        let query = `
            SELECT c.*, 
                   u.email as student_email, 
                   a.flaggedForModeration as analysis_flagged, 
                   a.aiSummary as analysis_summary 
            FROM Complaint c 
            LEFT JOIN User u ON c.studentId = u.id 
            LEFT JOIN ComplaintAiAnalysis a ON c.id = a.complaintId 
        `;
        let queryParams: any[] = [];

        if (role === 'STUDENT') {
            query += ' WHERE c.studentId = ?';
            queryParams.push(id);
        } else if (role === 'FACULTY') {
            const [users] = await pool.execute<RowDataPacket[]>('SELECT department FROM User WHERE id = ?', [id]);
            if (users[0]?.department) {
                query += ' WHERE c.category = ?';
                queryParams.push(users[0].department);
            }
        }
        
        query += ' ORDER BY c.createdAt DESC';

        const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);
        
        const complaints = rows.map(row => ({
            ...row,
            isAnonymous: !!row.isAnonymous,
            student: row.student_email ? { email: row.student_email } : null,
            aiAnalysis: {
                flaggedForModeration: !!row.analysis_flagged,
                aiSummary: row.analysis_summary
            }
        }));

        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
    try {
        const complaintId = req.params.id as string;
        
        const [complaintRows] = await pool.execute<RowDataPacket[]>(`
            SELECT c.*, u.email as student_email 
            FROM Complaint c 
            LEFT JOIN User u ON c.studentId = u.id 
            WHERE c.id = ?
        `, [complaintId]);
        
        if (complaintRows.length === 0) return res.status(404).json({ error: 'Not found' });
        const complaint: any = complaintRows[0];
        complaint.isAnonymous = !!complaint.isAnonymous;
        complaint.student = complaint.student_email ? { email: complaint.student_email } : null;

        const [analysisRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM ComplaintAiAnalysis WHERE complaintId = ?', [complaintId]);
        complaint.aiAnalysis = analysisRows.length > 0 ? analysisRows[0] : null;
        if (complaint.aiAnalysis && complaint.aiAnalysis.flaggedForModeration !== undefined) {
             complaint.aiAnalysis.flaggedForModeration = !!complaint.aiAnalysis.flaggedForModeration;
        }

        const [logRows] = await pool.execute<RowDataPacket[]>(`
            SELECT l.*, u.email as changer_email, u.role as changer_role 
            FROM ComplaintLog l 
            LEFT JOIN User u ON l.changedById = u.id 
            WHERE l.complaintId = ? 
            ORDER BY l.timestamp DESC
        `, [complaintId]);
        
        complaint.logs = logRows.map(l => ({
            ...l,
            changedBy: l.changer_email ? { email: l.changer_email, role: l.changer_role } : null
        }));

        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user!.id;

        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [rows] = await connection.execute<RowDataPacket[]>('SELECT status, resolutionTime FROM Complaint WHERE id = ? FOR UPDATE', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const complaint = rows[0];
        let resolutionTime = complaint.resolutionTime;
        if (status === 'RESOLVED' || status === 'REJECTED') {
            resolutionTime = new Date();
        }

        await connection.execute(
            'UPDATE Complaint SET status = ?, resolutionTime = ?, updatedAt = NOW() WHERE id = ?', 
            [status, resolutionTime, id]
        );

        const logId = uuidv4();
        await connection.execute(
            `INSERT INTO ComplaintLog 
            (id, complaintId, action, previousStatus, newStatus, changedById, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [logId, id, 'Status Updated', complaint.status, status, userId]
        );

        await connection.commit();
        res.status(200).json({ id, status, resolutionTime });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};
