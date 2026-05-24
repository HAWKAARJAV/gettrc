import { supabase } from "../supabaseClient";

/**
 * Fetch dynamic assessment questions from Supabase.
 * Falls back to an empty array on error so the page can still render
 * with its hardcoded fallback questions.
 */
export async function fetchAssessmentQuestions({ country = "AE", applicantType = "retail" } = {}) {
  try {
    const { data, error } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("country", country)
      .eq("applicant_type", applicantType)
      .eq("active", true)
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Group an array of questions by their `section` field.
 * Returns an object like { residency: [...], professional: [...] }
 */
export function groupAssessmentQuestions(questions = []) {
  return questions.reduce((acc, q) => {
    const section = q.section || "general";
    if (!acc[section]) acc[section] = [];
    acc[section].push(q);
    return acc;
  }, {});
}

/**
 * Decide whether a question should be rendered given the current answers.
 * Supports `showWhen.equals` and `showWhen.in` conditional logic.
 */
export function shouldRenderQuestion(question, answers = {}) {
  const showWhen = question?.conditional_logic?.showWhen;
  if (!showWhen?.field) return true;
  const current = answers[showWhen.field];
  if (Object.prototype.hasOwnProperty.call(showWhen, "equals")) {
    return String(current).toLowerCase() === String(showWhen.equals).toLowerCase();
  }
  if (Array.isArray(showWhen.in)) {
    return showWhen.in.map(v => String(v).toLowerCase()).includes(String(current).toLowerCase());
  }
  return !!current;
}
