import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { refreshApplication } from "../workflow/refreshApplication";

const DEFAULT_STATE = {
  isLoading: false,
  isSuccess: false,
  error: null,
  lastMutation: null,
};

let globalState = { ...DEFAULT_STATE };
let activeMutationId = null;
const listeners = new Set();

const SUCCESS_MESSAGES = {
  assignAdvisor: "Advisor assigned successfully",
  updateWorkflow: "Workflow updated successfully",
  approveDocument: "Document approved successfully",
  rejectDocument: "Document rejected successfully",
  updatePayment: "Payment marked complete",
};

const WEAK_ERROR_PATTERN = /^(something failed|error occurred|request failed|failed|error)$/i;

function notifyState(nextState) {
  globalState = { ...globalState, ...nextState };
  listeners.forEach((listener) => listener(globalState));
}

export function emitToast({ type = "info", message = "", duration = 5000 }) {
  try {
    window.dispatchEvent(new CustomEvent("workflow:toast", { detail: { type, message, duration } }));
  } catch {
    console[type === "error" ? "error" : "log"](message);
  }
}

function readableLabel(label) {
  return String(label || "operation")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase();
}

function successMessageFor(label, fallback) {
  return fallback || SUCCESS_MESSAGES[label] || `${readableLabel(label)} completed successfully`;
}

function normalizeErrorMessage(label, error, fallback) {
  if (fallback) return fallback;

  const raw = error?.message || error?.error || String(error || "");
  if (raw && !WEAK_ERROR_PATTERN.test(raw.trim())) {
    return raw;
  }

  const prefix = {
    assignAdvisor: "Advisor assignment failed",
    updateWorkflow: "Workflow update blocked",
    approveDocument: "Cannot approve document",
    rejectDocument: "Cannot reject document",
    updatePayment: "Payment update blocked",
  }[label] || `${readableLabel(label)} failed`;

  return `${prefix}: review the current workflow requirements and try again.`;
}

function getRefreshId(args, opts, result) {
  return (
    opts.applicationId ||
    args?.applicationId ||
    result?.applicationId ||
    result?.data?.application?.id ||
    result?.historyEntry?.application_id ||
    result?.data?.historyEntry?.application_id ||
    null
  );
}

export default function useWorkflowMutation(mutationLabel = "operation") {
  const [state, setState] = useState(globalState);
  const labelRef = useRef(mutationLabel);

  useEffect(() => {
    labelRef.current = mutationLabel;
  }, [mutationLabel]);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  const reset = useCallback(() => {
    activeMutationId = null;
    notifyState({ ...DEFAULT_STATE });
  }, []);

  const executeMutation = useCallback(async (mutationFn, args = {}, opts = {}) => {
    if (activeMutationId) {
      const lockedError = "Another workflow operation is already pending.";
      emitToast({ type: "error", message: lockedError });
      notifyState({ error: lockedError, isSuccess: false });
      return { success: false, error: lockedError, locked: true };
    }

    const label = opts.mutationLabel || labelRef.current;
    const mutationId = `${label}:${Date.now()}`;
    activeMutationId = mutationId;

    const startedMutation = {
      mutationLabel: label,
      args,
      startedAt: new Date().toISOString(),
    };

    notifyState({
      isLoading: true,
      isSuccess: false,
      error: null,
      lastMutation: startedMutation,
    });

    try {
      // debug trace for mutation execution and refresh
      try { console.debug(`[useWorkflowMutation] starting ${mutationId} label=${label} argsApp=${opts.applicationId || args.applicationId || ''}`); } catch {}
      if (typeof opts.onOptimisticUpdate === "function") {
        opts.onOptimisticUpdate(args);
      }

      const result = await mutationFn(args);
      try { console.debug(`[useWorkflowMutation] finished remote op ${mutationId} resultSuccess=${!!(result && result.success !== false)}`); } catch {}
      if (result && result.success === false) {
        throw new Error(result.error || "Request failed");
      }

      const applicationId = getRefreshId(args, opts, result);
      if (applicationId && opts.refresh !== false) {
        try {
          // await server refresh to ensure client fetches latest
          await refreshApplication(applicationId);
          try { console.debug(`[useWorkflowMutation] refresh completed for app=${applicationId} mutation=${mutationId}`); } catch {}
        } catch (rerr) {
          try { console.warn('[useWorkflowMutation] refreshApplication failed', rerr); } catch {}
        }
      }

      notifyState({
        isLoading: false,
        isSuccess: true,
        error: null,
        lastMutation: {
          ...startedMutation,
          finishedAt: new Date().toISOString(),
          result,
        },
      });

      emitToast({
        type: "success",
        message: successMessageFor(label, opts.successMessage),
      });

      activeMutationId = null;
      return result || { success: true };
    } catch (error) {
      const message = normalizeErrorMessage(label, error, opts.errorMessage);
      notifyState({
        isLoading: false,
        isSuccess: false,
        error: message,
        lastMutation: {
          ...startedMutation,
          finishedAt: new Date().toISOString(),
          error: message,
        },
      });
      emitToast({ type: "error", message });
      activeMutationId = null;
      return { success: false, error: message };
    }
  }, []);

  return useMemo(() => ({
    executeMutation,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    error: state.error,
    lastMutation: state.lastMutation,
    reset,
  }), [executeMutation, reset, state]);
}
