import { useEffect, useState, useRef } from "react";
import { fetchCorporateWorkspace, getCorporateSession, readCorporateCache, saveCorporateCache } from "../services/corporateAuth";
import { subscribeToApplicationRefresh } from "../../workflow/refreshApplication";

export function useCorporateWorkspace() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [workspace, setWorkspace] = useState(readCorporateCache());

  const refresh = async () => {
    const currentSession = await getCorporateSession();
    setSession(currentSession);

    if (!currentSession?.user?.id) {
      setWorkspace({});
      setLoading(false);
      return null;
    }

    const nextWorkspace = await fetchCorporateWorkspace(currentSession.user.id);
    setWorkspace(nextWorkspace);
    saveCorporateCache(nextWorkspace);
    setLoading(false);
    return nextWorkspace;
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));

    // Poll every 20s so corporate users see stage changes without hard-refreshing
    const pollInterval = setInterval(() => {
      refresh().catch(() => {});
    }, 20_000);

    return () => clearInterval(pollInterval);
  }, []);

  // keep a ref to the latest workspace so the refresh subscription callback
  // can make decisions without re-subscribing on every workspace change
  const workspaceRef = useRef(workspace);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);

  useEffect(() => {
    const unsubscribe = subscribeToApplicationRefresh((detail) => {
      try {
        const appId = String(detail?.bundle?.application?.id || detail?.applicationId || "");
        const currentAppId = String(
          workspaceRef.current?.application?.id ||
          workspaceRef.current?.request?.application_id ||
          workspaceRef.current?.request?.id ||
          ""
        );
        if (appId && currentAppId && appId === currentAppId) {
          refresh().catch(() => {});
        }
      } catch (e) {
        // ignore subscription callback errors
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  return { loading, session, profile: workspace.profile, request: workspace.request, application: workspace.application, stage: workspace.stage, refresh };
}