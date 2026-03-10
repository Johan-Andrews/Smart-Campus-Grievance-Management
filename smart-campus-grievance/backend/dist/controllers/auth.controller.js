"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['STUDENT', 'FACULTY', 'ADMIN']).optional(),
    department: zod_1.z.string().optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = registerSchema.parse(req.body);
        const existingUser = yield index_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser)
            return res.status(400).json({ error: 'Email already in use' });
        const passwordHash = yield bcrypt_1.default.hash(data.password, 10);
        const user = yield index_1.prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                role: data.role || 'STUDENT',
                department: data.department
            }
        });
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    }
    catch (error) {
        console.error('Registration Error:', error);
        if (error instanceof zod_1.z.ZodError)
            res.status(400).json({ error: error.issues });
        else
            res.status(500).json({ error: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = loginSchema.parse(req.body);
        const user = yield index_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user)
            return res.status(400).json({ error: 'Invalid credentials' });
        const validPassword = yield bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!validPassword)
            return res.status(400).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        res.status(200).json({
            token,
            user: { id: user.id, email: user.email, role: user.role, department: user.department }
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        if (error instanceof zod_1.z.ZodError)
            res.status(400).json({ error: error.issues });
        else
            res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield index_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, department: true, createdAt: true } // omitting trust score
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getMe = getMe;
