import { Request, Response } from 'express';

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const VALID_CATEGORIES = ["HOSTEL", "ACADEMICS", "PRINCIPAL", "HOD", "MANAGEMENT"] as const;
const KNOWN_DEPT_CODES = ["CSE", "EEE", "MECH", "CIVIL", "ECE", "IT", "PHY", "MATH", "CHEM", "HSS"];

export const draftCoach = async (req: Request, res: Response) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "title and description required" });
        }

        const prompt = `You are an AI assistant for a college grievance management system called Smart Campus.

A student is filling out the "Lodge a Grievance" form. Analyse the draft complaint and respond ONLY with a valid JSON object — no preamble, no markdown fences.

Student's draft:
TITLE: ${title}
DESCRIPTION: ${description}

Return this exact JSON structure:
{
  "suggestions": [string],
  "category": one of ["HOSTEL","ACADEMICS","PRINCIPAL","HOD","MANAGEMENT"] | null,
  "department_code": one of ${JSON.stringify(KNOWN_DEPT_CODES)} | null,
  "department_name": string | null,
  "sentiment_score": number between -1.0 and 1.0,
  "abuse_score": number between 0.0 and 1.0,
  "quality_score": number between 0.0 and 1.0,
  "ai_summary": string,
  "flagged": boolean,
  "explainable_output": {
    "keywords": [string],
    "category_confidence": number,
    "urgency_predicted": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
    "reasoning": string
  }
}

Rules:
- suggestions: 1–3 short actionable tips to improve the complaint (e.g. "Consider adding the specific room number", "Mention when the issue started"). If the draft is already good, return an empty array.
- category: pick the single best match. HOSTEL = physical campus facilities, dorms, mess. ACADEMICS = labs, syllabus, faculty, exams. HOD = issues specifically about the department head. PRINCIPAL = institution-level grievances. MANAGEMENT = fees, admin, non-academic.
- department_code: set ONLY if category is HOD or ACADEMICS. Match the department mentioned in the text to one of the known codes. null if category is anything else or department is ambiguous.
- sentiment_score: -1 (very negative/frustrated) to +1 (neutral/positive).
- abuse_score: 0 (no abusive language) to 1 (highly abusive). Flag as true if abuse_score > 0.7.
- quality_score: 0 (vague/unhelpful) to 1 (detailed/actionable).
- ai_summary: one sentence summary of the core issue.`;

        const response = await fetch(ANTHROPIC_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY || '',
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 600,
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data: any = await response.json();
        const raw = data.content?.[0]?.text ?? "{}";

        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);

        const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : null;
        const department_code =
            category === "HOD" || category === "ACADEMICS"
                ? KNOWN_DEPT_CODES.includes(parsed.department_code) ? parsed.department_code : null
                : null;

        res.status(200).json({
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
            category,
            department_code,
            department_name: parsed.department_name ?? null,
            sentiment_score: typeof parsed.sentiment_score === "number" ? parsed.sentiment_score : null,
            abuse_score: typeof parsed.abuse_score === "number" ? parsed.abuse_score : null,
            quality_score: typeof parsed.quality_score === "number" ? parsed.quality_score : null,
            ai_summary: typeof parsed.ai_summary === "string" ? parsed.ai_summary : null,
            flagged: parsed.flagged === true,
            explainable_output: parsed.explainable_output ?? null,
        });

    } catch (error) {
        console.error("Draft coach error:", error);
        res.status(200).json({
            suggestions: [],
            category: null,
            department_code: null,
            department_name: null,
            sentiment_score: null,
            abuse_score: null,
            quality_score: null,
            ai_summary: null,
            flagged: false,
            explainable_output: null,
        });
    }
};
