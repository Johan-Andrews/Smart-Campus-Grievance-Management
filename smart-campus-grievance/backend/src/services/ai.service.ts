import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AiAnalysisResult {
    category: string;
    aiSummary: string;
    sentimentScore: number; // 1 to 10 mapped to severity
    abuseScore: number; // 0 to 10
    qualityScore: number; // 0 to 10
    explainableOutput: any; // JSON object
    flaggedForModeration: boolean;
    priority: string;
    slaDeadline: Date;
}

// Simulated AI Module
export const analyzeComplaintDraft = async (title: string, description: string) => {
    // Simple rule-based draft coach
    const suggestions = [];
    if (description.length < 50) suggestions.push('Please provide more details.');
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
};

export const processComplaintWithAI = async (
    title: string,
    description: string,
    userTrustScore: number,
    urgency: string
): Promise<AiAnalysisResult> => {
    const content = (title + ' ' + description).toLowerCase();

    // 1. Categorization Mock
    let category = 'General';
    if (content.match(/(class|exam|professor|grade|faculty)/)) category = 'Academic';
    else if (content.match(/(wifi|internet|network|router)/)) category = 'IT_Infrastructure';
    else if (content.match(/(hostel|mess|room|water|food)/)) category = 'Hostel';
    else if (content.match(/(plumbing|ac|fan|light|building)/)) category = 'Infrastructure';

    // 2. Summarization Mock
    const aiSummary = description.substring(0, 100) + '... [Auto-Summarized]';

    // 3. Sentiment Analysis Mock
    let sentimentScore = 5;
    if (content.match(/(urgent|immediately|critical|danger|severe)/)) sentimentScore = 8;
    if (content.match(/(please|thanks|kindly)/)) sentimentScore -= 1;

    // 4. Misuse Detection Mock
    let abuseScore = 0;
    if (content.match(/(stupid|idiot|hate|hell|damn)/)) abuseScore = 7;

    let qualityScore = Math.min(10, (description.length / 50));
    const flaggedForModeration = abuseScore > 5 || qualityScore < 3;

    // 5. Priority Engine Calculation
    let priorityScore = 0;

    // Urgency weight
    if (urgency === 'High') priorityScore += 3;
    else if (urgency === 'Medium') priorityScore += 1;

    // Sentiment weight
    priorityScore += (sentimentScore / 2);

    // Trust score modifier (higher trust = slightly higher priority, lower trust = lower priority)
    priorityScore += (userTrustScore - 5) * 0.5;

    let computedPriority = 'LOW';
    let hoursToSolve = 72; // Default SLA

    if (priorityScore > 8 || sentimentScore > 8) {
        computedPriority = 'CRITICAL';
        hoursToSolve = 12;
    } else if (priorityScore > 5 || urgency === 'High') {
        computedPriority = 'HIGH';
        hoursToSolve = 24;
    } else if (priorityScore > 3 || urgency === 'Medium') {
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
};

export const checkRecurrentIssues = async (category: string, location: string) => {
    if (!location) return;

    const pattern = await prisma.systemPattern.findFirst({
        where: { issueType: category, location: location }
    });

    if (pattern) {
        await prisma.systemPattern.update({
            where: { id: pattern.id },
            data: { frequency: pattern.frequency + 1, lastDetected: new Date() }
        });
        // Systemic issue escalation logic can go here (e.g. notify admin)
    } else {
        await prisma.systemPattern.create({
            data: { issueType: category, location: location, frequency: 1 }
        });
    }
};
