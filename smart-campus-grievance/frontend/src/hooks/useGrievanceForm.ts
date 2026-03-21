import { useState, useEffect, useRef } from "react";
// Mocked version — no Supabase dependency

// ─── Types ────────────────────────────────────────────────────

export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AiDraftSuggestion = {
  suggestions: string[];           // bullet points shown in AI Draft Coach panel
  category: string | null;         // auto-detected: HOSTEL/ACADEMICS/HOD/PRINCIPAL/MANAGEMENT
  department_code: string | null;  // e.g. "CSE" — only set if category = HOD or ACADEMICS
  department_name: string | null;  // e.g. "Computer Science & Engineering"
  sentiment_score: number | null;
  abuse_score: number | null;
  quality_score: number | null;
  ai_summary: string | null;
  flagged: boolean;
  explainable_output: Record<string, unknown> | null;
};

export type GrievanceFormState = {
  title: string;
  description: string;
  urgency: Urgency;
  location: string;
  isAnonymous: boolean;
};

export type SubmitResult = {
  id: string;
  ref_id: string;
  title: string;
  category_label: string;
  department_name: string | null;
  urgency: string;
  status: string;
  sla_display: string;
  created_date: string;
};

// ─── AI Draft Coach ───────────────────────────────────────────
// Calls the Anthropic API (via your backend endpoint) to:
//   1. Generate coaching suggestions shown in the right panel
//   2. Auto-detect category and department
//   3. Produce AI analysis scores saved alongside the complaint

async function fetchAiDraftSuggestions(
  title: string,
  description: string
): Promise<AiDraftSuggestion> {
  // Replace with your actual backend endpoint that proxies the Anthropic API.
  // Never call the Anthropic API directly from the frontend (exposes the key).
  const res = await fetch("/api/ai/draft-coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });

  if (!res.ok) {
    // Fail gracefully — the form still works without AI suggestions
    return {
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
    };
  }

  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────

export function useGrievanceForm() {
  const [form, setForm] = useState<GrievanceFormState>({
    title: "",
    description: "",
    urgency: "LOW",
    location: "",
    isAnonymous: false,
  });

  const [aiSuggestion, setAiSuggestion] = useState<AiDraftSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null);

  // Debounce AI Draft Coach — fires 900ms after the user stops typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { title, description } = form;

    // Only call AI when there's enough text to analyse
    if (title.length < 10 || description.length < 20) {
      setAiSuggestion(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      const suggestion = await fetchAiDraftSuggestions(title, description);
      setAiSuggestion(suggestion);
      setAiLoading(false);
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.title, form.description]);

  // ── Field updaters ─────────────────────────────────────────

  function setField<K extends keyof GrievanceFormState>(
    field: K,
    value: GrievanceFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  }

  // ── Submit ─────────────────────────────────────────────────

  // ── Submit ─────────────────────────────────────────────────

  async function submit() {
    // Use internal localStorage or session to get user ID
    // This is a bit tricky since we can't use hooks inside async functions normally,
    // but we can pass the user ID or just use the local state if the hook was called with it.
    // However, for simplicity, I'll assume the user is available in the component and we can use a callback or just access it here.
    // Actually, I'll just use the supabase client directly.
    
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Need user ID for submission
      const savedMockUser = localStorage.getItem('sb-mock-user');
      const mockProfile = savedMockUser ? JSON.parse(savedMockUser) : null;
      
      const { data: sessionData } = await (await import("../lib/supabaseClient")).supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || mockProfile?.id;

      if (!userId) throw new Error("You must be logged in to submit a grievance.");

      const { data: complaint, error: cError } = await (await import("../lib/supabaseClient")).supabase
        .from('complaints')
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          category: aiSuggestion?.category || 'MANAGEMENT', // Default
          urgency: form.urgency,
          location: form.location.trim() || null,
          is_anonymous: form.isAnonymous,
          student_id: userId,
          status: 'OPEN',
          priority: 'MEDIUM' // AI would normally determine this, we set a default
        })
        .select()
        .single();

      if (cError) throw cError;

      // Optional: Insert AI Analysis if available
      if (aiSuggestion) {
        await (await import("../lib/supabaseClient")).supabase
          .from('complaint_ai_analysis')
          .insert({
            complaint_id: complaint.id,
            ai_summary: aiSuggestion.ai_summary,
            sentiment_score: aiSuggestion.sentiment_score,
            abuse_score: aiSuggestion.abuse_score,
            quality_score: aiSuggestion.quality_score,
            explainable_output: aiSuggestion.explainable_output,
            flagged_for_moderation: aiSuggestion.flagged
          });
      }

      setSubmitted({
          id: complaint.id,
          ref_id: complaint.id.split('-')[0].toUpperCase(), // Simple ref_id fallback
          title: complaint.title,
          category_label: aiSuggestion?.category || 'GENERAL',
          department_name: aiSuggestion?.department_name || null,
          urgency: complaint.urgency,
          status: complaint.status,
          sla_display: '48 Hours',
          created_date: new Date().toLocaleDateString()
      });

      // Reset form
      setForm({
        title: "",
        description: "",
        urgency: "LOW",
        location: "",
        isAnonymous: false,
      });
      setAiSuggestion(null);

    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    setField,
    submit,

    // AI Draft Coach
    aiSuggestion,
    aiLoading,

    // Submission state
    submitting,
    submitError,
    submitted,

    // Derived: show department field when AI detects HOD/ACADEMICS
    showDepartmentHint:
      aiSuggestion?.category === "HOD" ||
      aiSuggestion?.category === "ACADEMICS",
  };
}
