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
exports.getAnalytics = exports.getModerationQueue = void 0;
const index_1 = require("../index");
const getModerationQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const flagged = yield index_1.prisma.complaintAiAnalysis.findMany({
            where: { flaggedForModeration: true },
            include: { complaint: true }
        });
        res.status(200).json(flagged);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getModerationQueue = getModerationQueue;
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Basic stats for dashboard
        const openCount = yield index_1.prisma.complaint.count({ where: { status: 'OPEN' } });
        const inProgressCount = yield index_1.prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
        const resolvedCount = yield index_1.prisma.complaint.count({ where: { status: 'RESOLVED' } });
        // SLA Violations (currently open/in-progress with SLA past due)
        const slaViolations = yield index_1.prisma.complaint.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                slaDeadline: { lt: new Date() }
            },
            select: { id: true, title: true, priority: true, slaDeadline: true }
        });
        // Patterns
        const systemicIssues = yield index_1.prisma.systemPattern.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAnalytics = getAnalytics;
