import { useEffect, useState, useRef, useCallback } from "react";
import { fetchRetailWorkspace, getRetailSession, saveRetailCache, clearRetailCache } from "../services/retailAuth";
import { subscribeToApplicationRefresh } from "../workflow/refreshApplication";

// Poll every 20 seconds so the retail dashboard stays in sync with admin
// changes without requiring a manual page refresh.
const POLL_INTERVAL_MS = 20_000;

const EMPTY_STATE = {
  loading: true,
  session: null,
  profile: null,
  request: null,
  stage: "pending_review",
  error: null,
};

export function useRetailWorkspace() {
  const [state, setState] = useState(EMPTY_STATE);

  // Keep a stable ref so the poll interval can call the latest refresh
  // without being re-created every render.
  const refreshRef = useRef(null);

  const refresh = useCallback(async (silent = false) => {
    // silent=true is used by the polling interval — skip the loading flash
    // so the UI doesn't flicker every 20 s.
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }));

    // getRetailSession() itself can throw on a transient error (network blip,
    // a hiccup during Supabase's token refresh) that has nothing to do with
    // the user actually being logged out. Treat that as "couldn't verify"
    // (preserve whatever session we last knew about) rather than "logged
    // out" — only a clean `null` result means "no session".
    let session;
    try {
      session = await getRetailSession();
    } catch (authError) {
      setState((prev) => ({ ...prev, loading: false, error: authError }));
      return;
    }

    if (!session?.user?.id) {
      clearRetailCache();
      setState({ ...EMPTY_STATE, loading: false, session: null });
      return;
    }

    try {
      const workspace = await fetchRetailWorkspace(session.user.id);
      const nextState = {
        loading: false,
        session,
        profile: workspace.profile,
        request: workspace.request,
        application: workspace.application,
        applicationHistory: workspace.applicationHistory,
        stage: workspace.stage,
        error: null,
      };

      saveRetailCache({
        userId: session.user.id,
        email: session.user.email,
        stage: workspace.stage,
        role: workspace.profile?.role || "retail",
      });

      setState(nextState);
    } catch (error) {
      // Preserve the session we fetched (may still be null if auth itself
      // failed, but must NOT be force-cleared when only the DB fetch failed).
      setState({
        loading: false,
        session,
        profile: null,
        request: null,
        application: null,
        stage: "pending_review",
        error,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep refreshRef in sync so the polling interval always calls the latest version.
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll every POLL_INTERVAL_MS so admin changes (approve / reject / payment etc.)
  // appear in the retail workspace without the user having to manually refresh.
  // Only polls when the tab is visible to avoid waking up sleeping tabs.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && refreshRef.current) {
        refreshRef.current(true /* silent */).catch(() => {});
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // expose a ref of the latest workspace so the refresh subscription can use it
  const workspaceRef = useRef({});
  useEffect(() => { workspaceRef.current = { application: state.application, request: state.request }; }, [state.application, state.request]);

  useEffect(() => {
    const unsubscribe = subscribeToApplicationRefresh((detail) => {
      try {
        const appId = String(detail?.bundle?.application?.id || detail?.applicationId || "");
        const currentAppId = String(workspaceRef.current?.application?.id || workspaceRef.current?.request?.application_id || workspaceRef.current?.request?.id || "");
        if (appId && currentAppId && appId === currentAppId) {
          refresh().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  return {
    ...state,
    refresh,
  };
}
