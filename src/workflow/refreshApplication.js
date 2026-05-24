import { fetchApplicationWithHistory } from "../workflow/applicationService";

const CHANNEL = "application:refresh";
const inFlightRefreshes = new Map();
const latestRefreshVersion = new Map();

function emitRefresh(applicationId, bundle, status = "ready") {
  try {
    window.dispatchEvent(new CustomEvent(CHANNEL, { detail: { applicationId, bundle, status } }));
  } catch {
    // ignore if window unavailable
  }
}

export async function refreshApplication(applicationId) {
  if (!applicationId) return null;
  const key = String(applicationId);

  if (inFlightRefreshes.has(key)) {
    return inFlightRefreshes.get(key);
  }

  const version = (latestRefreshVersion.get(key) || 0) + 1;
  latestRefreshVersion.set(key, version);

  // debug trace for refresh sequencing
  try {
    // eslint-disable-next-line no-console
    console.debug(`[refreshApplication] scheduling refresh for ${key} version=${version}`);
  } catch {}

  const pending = fetchApplicationWithHistory(applicationId)
    .catch(() => ({ application: null, history: [], documents: [] }))
    .then((bundle) => {
      try {
        // eslint-disable-next-line no-console
        console.debug(`[refreshApplication] fetched bundle for ${key} version=${version} latest=${latestRefreshVersion.get(key)} appId=${bundle?.application?.id}`);
      } catch {}
      if (latestRefreshVersion.get(key) === version) {
        emitRefresh(applicationId, bundle, "ready");
      }
      return bundle;
    })
    .finally(() => {
      if (inFlightRefreshes.get(key) === pending) {
        inFlightRefreshes.delete(key);
      }
    });

  inFlightRefreshes.set(key, pending);
  emitRefresh(applicationId, null, "refreshing");
  const bundle = await pending;
  return bundle;
}

export function subscribeToApplicationRefresh(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(CHANNEL, listener);
  return () => window.removeEventListener(CHANNEL, listener);
}
