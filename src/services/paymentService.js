export async function startCheckout({ applicationId }) {
  const token = localStorage.getItem("trc_token");
  const res = await fetch("/api/createCheckoutSession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ applicationId }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Unable to start payment");
  return json.data?.checkoutUrl || null;
}
