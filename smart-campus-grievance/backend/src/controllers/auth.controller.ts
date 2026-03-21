import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']).optional(),
    department: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM User WHERE email = ?', [data.email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' });

        const passwordHash = await bcrypt.hash(data.password, 10);
        const id = uuidv4();
        const role = data.role || 'STUDENT';
        const department = data.department || null;

        await pool.execute(
            'INSERT INTO User (id, email, passwordHash, role, department) VALUES (?, ?, ?, ?, ?)',
            [id, data.email, passwordHash, role, department]
        );

        res.status(201).json({ message: 'User created successfully', userId: id });
    } catch (error: any) {
        console.error('Registration Error:', error);
        if (error instanceof z.ZodError) res.status(400).json({ error: error.issues });
        else res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        const [users] = await pool.execute<RowDataPacket[]>('SELECT * FROM User WHERE email = ?', [data.email]);
        const user = users[0];
        
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: { id: user.id, email: user.email, role: user.role, department: user.department }
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        if (error instanceof z.ZodError) res.status(400).json({ error: error.issues });
        else res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT id, email, role, department, createdAt FROM User WHERE id = ?', 
            [req.user.id]
        );
        const user = users[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
