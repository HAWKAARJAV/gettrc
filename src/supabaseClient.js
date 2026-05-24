// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the JWT anon key — supabase-js v2 requires a JWT for session storage.
// The publishable key (sb_publishable_*) is only a fallback; using it as the
// primary key can break session persistence across page reloads.
export const SUPABASE_KEY =
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Attempt to restore a legacy Supabase session from a specific localStorage key.
// IMPORTANT: Only restores if Supabase's own session storage is currently empty.
// This prevents overwriting an advisor/retail session with a stale session from
// another role's localStorage key (e.g. trc_session overwriting trc_advisor_session).
export async function restoreSessionFromLocalStorage() {
	try {
		if (typeof window === "undefined") return null;

		// If Supabase already has a live session, never override it.
		const { data: current } = await supabase.auth.getSession();
		if (current?.session?.access_token) return current.session;

		// Only now try to restore from our legacy retail key.
		const legacyRetailSessionRaw = window.localStorage.getItem("trc_session");
		if (legacyRetailSessionRaw) {
			const legacyRetailSession = JSON.parse(legacyRetailSessionRaw);
			if (legacyRetailSession?.access_token && legacyRetailSession?.refresh_token) {
				const { data: restored, error } = await supabase.auth.setSession({
					access_token: legacyRetailSession.access_token,
					refresh_token: legacyRetailSession.refresh_token,
				});
				if (error) return null;
				return restored.session || null;
			}
		}
		return null;
	} catch (e) {
		// ignore errors during bootstrapping session
		return null;
	}
}

// auto-restore on client startup (non-blocking)
// This is a last-resort fallback. Each auth service (getRetailSession,
// getAdvisorSession) handles its own session restoration; this only
// covers the case where neither has run yet and the page needs a session.
if (typeof window !== "undefined") {
	restoreSessionFromLocalStorage().catch(() => {});
}
