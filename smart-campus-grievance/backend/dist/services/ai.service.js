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
exports.checkRecurrentIssues = exports.processComplaintWithAI = exports.analyzeComplaintDraft = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Simulated AI Module
const analyzeComplaintDraft = (title, description) => __awaiter(void 0, void 0, void 0, function* () {
    // Simple rule-based draft coach
    const suggestions = [];
    if (description.length < 50)
        suggestions.push('Please provide more details.');
    if (!description.toLowerCase().includes('time') && !description.toLowerCase().includes('at')) {
        suggestions.push('Consider adding specific time details.');
    }
    if (!description.toLowerCase().includes('room') && !description.toLowerCase().includes('building')) {
        suggestions.push('Consider adding specific location details.');
    }
    if (description.toLowerCase().match(/\b(stupid|idiot|hate)\b/)) {
        suggestions.push('Avoid personal attacks. Describe the issue politely.');
    }
    return { suggestions };
});
exports.analyzeComplaintDraft = analyzeComplaintDraft;
const processComplaintWithAI = (title, description, userTrustScore, urgency, userCategory) => __awaiter(void 0, void 0, void 0, function* () {
    const content = (title + ' ' + description).toLowerCase();
    // 1. Categorization Mock
    let category = userCategory || 'hostel';
    if (content.match(/(class|exam|professor|grade|faculty)/))
        category = 'academics';
    else if (content.match(/(wifi|internet|network|router)/))
        category = 'management'; // map infrastructure to management for now or keep as is if desired
    else if (content.match(/(hostel|mess|room|water|food)/))
        category = 'hostel';
    else if (content.match(/(plumbing|ac|fan|light|building)/))
        category = 'management';
    // 2. Summarization Mock
    const aiSummary = description.substring(0, 100) + '... [Auto-Summarized]';
    // 3. Sentiment Analysis Mock
    let sentimentScore = 5;
    if (content.match(/(urgent|immediately|critical|danger|severe)/))
        sentimentScore = 8;
    if (content.match(/(please|thanks|kindly)/))
        sentimentScore -= 1;
    // 4. Misuse Detection Mock
    let abuseScore = 0;
    if (content.match(/(stupid|idiot|hate|hell|damn)/))
        abuseScore = 7;
    let qualityScore = Math.min(10, (description.length / 50));
    const flaggedForModeration = abuseScore > 5 || qualityScore < 3;
    // 5. Priority Engine Calculation
    let priorityScore = 0;
    // Urgency weight
    if (urgency === 'High')
        priorityScore += 3;
    else if (urgency === 'Medium')
        priorityScore += 1;
    // Sentiment weight
    priorityScore += (sentimentScore / 2);
    // Trust score modifier (higher trust = slightly higher priority, lower trust = lower priority)
    priorityScore += (userTrustScore - 5) * 0.5;
    let computedPriority = 'LOW';
    let hoursToSolve = 72; // Default SLA
    if (priorityScore > 8 || sentimentScore > 8) {
        computedPriority = 'CRITICAL';
        hoursToSolve = 12;
    }
    else if (priorityScore > 5 || urgency === 'High') {
        computedPriority = 'HIGH';
        hoursToSolve = 24;
    }
    else if (priorityScore > 3 || urgency === 'Medium') {
        computedPriority = 'MEDIUM';
        hoursToSolve = 48;
    }
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + hoursToSolve);
    const explainableOutput = {
        keywordsDetected: ['urgent', 'fast'],
        reasoning: `Categorized as ${category} based on text tokens. Sentiment severity is ${sentimentScore}/10. Priority set to ${computedPriority} based on User Trust(${userTrustScore}) and Urgency(${urgency}). SLA assigned: ${hoursToSolve} hours.`
    };
    return {
        category,
        aiSummary,
        sentimentScore,
        abuseScore,
        qualityScore,
        explainableOutput,
        flaggedForModeration,
        priority: computedPriority,
        slaDeadline
    };
});
exports.processComplaintWithAI = processComplaintWithAI;
const checkRecurrentIssues = (category, location) => __awaiter(void 0, void 0, void 0, function* () {
    if (!location)
        return;
    const pattern = yield prisma.systemPattern.findFirst({
        where: { issueType: category, location: location }
    });
    if (pattern) {
        yield prisma.systemPattern.update({
            where: { id: pattern.id },
            data: { frequency: pattern.frequency + 1, lastDetected: new Date() }
        });
        // Systemic issue escalation logic can go here (e.g. notify admin)
    }
    else {
        yield prisma.systemPattern.create({
            data: { issueType: category, location: location, frequency: 1 }
        });
    }
});
exports.checkRecurrentIssues = checkRecurrentIssues;
