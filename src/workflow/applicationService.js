import { supabase } from "../supabaseClient";
import { getApplicationUnlockState, getApplicationOperationalStage } from "./applicationWorkflow";

export async function fetchLatestApplication({ userId, applicantType }) {
  const query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .eq("applicant_type", applicantType)
    .order("created_at", { ascending: false })
    .limit(1);

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] || null;
}

export async function fetchApplicationWithHistory(applicationId) {
  const [{ data: application, error: applicationError }, { data: history, error: historyError }] = await Promise.all([
    supabase.from("applications").select("*").eq("id", applicationId).maybeSingle(),
    supabase.from("application_status_history").select("*").eq("application_id", applicationId).order("created_at", { ascending: true }),
  ]);

  if (applicationError) throw applicationError;
  if (historyError) throw historyError;

  return { application, history: history || [] };
}

export async function fetchUserApplicationBundle({ userId, applicantType }) {
  const application = await fetchLatestApplication({ userId, applicantType });
  if (!application?.id) return { application: null, history: [] };
  return fetchApplicationWithHistory(application.id);
}

export async function fetchApplications({ limit = 50, offset = 0, workflowState } = {}) {
  let q = supabase.from('applications').select('*').order('created_at', { ascending: false }).range(offset, Math.max(0, offset + limit - 1));
  if (workflowState) q = q.eq('workflow_state', workflowState);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export function resolveApplicationStage(application, fallbackState) {
  if (!application) {
    return fallbackState;
  }

  return getApplicationUnlockState(application) || getApplicationOperationalStage(application, fallbackState);
}

export async function appendApplicationStatus({ applicationId, previousState, newState, updatedBy, notes = "" }) {
  throw new Error('appendApplicationStatus is deprecated on the client. Use workflowMutationService.updateWorkflowState on the client or perform server-side mutation.');
}
export async function updateApplicationWorkflowState() {
  throw new Error('updateApplicationWorkflowState is deprecated on the client. Use workflowMutationService.updateWorkflowState instead.');
}
