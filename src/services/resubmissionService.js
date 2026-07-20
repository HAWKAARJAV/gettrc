export async function resubmitEligibility({ applicationId, updates }) {
  const token = localStorage.getItem("trc_token");
  const res = await fetch("/api/resubmitEligibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ applicationId, updates }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Unable to resubmit eligibility information");
  return json.data?.application || null;
}
