import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdvisorWorkspace, getAdvisorSession, logoutAdvisor } from "../services/advisorAuth";

const POLL_MS = 20_000;

const EMPTY = {
  loading: true,
  session: null,
  profile: null,
  advisor: null,
  cases: [],
  unreadMessageCount: 0,
  openTicketCount: 0,
  unreadTicketReplyCount: 0,
  error: null,
};

export function useAdvisorWorkspace() {
  const [state, setState] = useState(EMPTY);
  const refreshRef = useRef(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setState((p) => ({ ...p, loading: true, error: null }));

    // getAdvisorSession() can throw on a transient error (network blip, a
    // hiccup during Supabase's token refresh) unrelated to actually being
    // logged out — don't treat that as a logout. Only a clean `null` means
    // "no session".
    let session;
    try {
      session = await getAdvisorSession();
    } catch (authError) {
      setState((p) => ({ ...p, loading: false, error: authError }));
      return;
    }

    if (!session?.user?.id) {
      await logoutAdvisor();
      setState({ ...EMPTY, loading: false, session: null });
      return;
    }

    try {
      const ws = await fetchAdvisorWorkspace(session.user.id);
      setState({
        loading: false,
        session,
        profile: ws.profile,
        advisor: ws.advisor,
        cases: ws.cases,
        unreadMessageCount: ws.unreadMessageCount,
        openTicketCount: ws.openTicketCount,
        unreadTicketReplyCount: ws.unreadTicketReplyCount,
        error: null,
      });
    } catch (error) {
      setState({ loading: false, session, profile: null, advisor: null, cases: [], unreadMessageCount: 0, openTicketCount: 0, unreadTicketReplyCount: 0, error });
    }
  }, []); // eslint-disable-line

  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && refreshRef.current) {
        refreshRef.current(true).catch(() => {});
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return { ...state, refresh };
}
