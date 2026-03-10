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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComplaintStatus = exports.getComplaintById = exports.getComplaints = exports.submitComplaint = void 0;
const index_1 = require("../index");
const zod_1 = require("zod");
const ai_service_1 = require("../services/ai.service");
const complaintSchema = zod_1.z.object({
    title: zod_1.z.string().min(5),
    description: zod_1.z.string().min(10),
    category: zod_1.z.string(), // initial category guess
    urgency: zod_1.z.enum(['Low', 'Medium', 'High', 'Critical']),
    location: zod_1.z.string().optional(),
    isAnonymous: zod_1.z.boolean().default(false)
});
const submitComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = complaintSchema.parse(req.body);
        const userId = req.user.id;
        // Fetch user trust score (hidden from frontend)
        const userRow = yield index_1.prisma.user.findUnique({ where: { id: userId } });
        const userTrustScore = (userRow === null || userRow === void 0 ? void 0 : userRow.trustScore) || 5.0;
        // AI Analysis
        const aiAnalysis = yield (0, ai_service_1.processComplaintWithAI)(data.title, data.description, userTrustScore, data.urgency, data.category);
        // Create complaint
        const complaint = yield index_1.prisma.complaint.create({
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
        yield index_1.prisma.complaintAiAnalysis.create({
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
        yield index_1.prisma.complaintLog.create({
            data: {
                complaintId: complaint.id,
                action: 'Created',
                newStatus: 'OPEN',
                changedById: userId
            }
        });
        // Check recurrent
        if (data.location) {
            yield (0, ai_service_1.checkRecurrentIssues)(aiAnalysis.category, data.location);
        }
        res.status(201).json({ message: 'Complaint submitted', id: complaint.id });
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.z.ZodError)
            res.status(400).json({ error: error.issues });
        else
            res.status(500).json({ error: error.message || error.toString() });
    }
});
exports.submitComplaint = submitComplaint;
const getComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, id } = req.user;
        let whereClause = {};
        if (role === 'STUDENT') {
            whereClause = { studentId: id };
        }
        else if (role === 'FACULTY') {
            const user = yield index_1.prisma.user.findUnique({ where: { id } });
            if (user === null || user === void 0 ? void 0 : user.department) {
                whereClause = { category: user.department }; // rough match
            }
        }
        // Admin sees all
        const complaints = yield index_1.prisma.complaint.findMany({
            where: whereClause,
            include: {
                student: { select: { email: true } },
                aiAnalysis: { select: { flaggedForModeration: true, aiSummary: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(complaints);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getComplaints = getComplaints;
const getComplaintById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const complaintId = req.params.id;
        const complaint = yield index_1.prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                logs: { include: { changedBy: { select: { email: true, role: true } } }, orderBy: { timestamp: 'desc' } },
                aiAnalysis: true,
                student: { select: { email: true } }
            }
        });
        if (!complaint)
            return res.status(404).json({ error: 'Not found' });
        res.status(200).json(complaint);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getComplaintById = getComplaintById;
const updateComplaintStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const complaintId = req.params.id;
        const complaint = yield index_1.prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint)
            return res.status(404).json({ error: 'Not found' });
        let resolutionTime = complaint.resolutionTime;
        if (status === 'RESOLVED' || status === 'REJECTED') {
            resolutionTime = new Date();
        }
        const updated = yield index_1.prisma.complaint.update({
            where: { id: complaintId },
            data: { status, resolutionTime }
        });
        yield index_1.prisma.complaintLog.create({
            data: {
                complaintId: complaintId,
                action: 'Status Updated',
                previousStatus: complaint.status,
                newStatus: status,
                changedById: userId
            }
        });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateComplaintStatus = updateComplaintStatus;
