// Static reference/example images shown via the "eye" button next to each
// document row. Files live at public/doc-templates/<slug>.png — drop a PNG
// there (matching the slug of the document's exact name) and it appears
// automatically, no code, DB, or deploy-config change needed. If the file
// isn't there yet, the button still shows; clicking it just reports no
// example is available yet (see DocumentTemplateButton's onError handling).
const TEMPLATE_BASE_PATH = "/doc-templates";

export function slugifyDocumentName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDocumentTemplateUrl(documentName) {
  const slug = slugifyDocumentName(documentName);
  return slug ? `${TEMPLATE_BASE_PATH}/${slug}.png` : null;
}

// Documents whose upload instructions should call out the applicant's own
// TRC period (the year they selected at signup) — these specifically need to
// evidence identity/residence during that period, unlike e.g. a written
// statement which isn't period-bound in the same way.
const PERIOD_SENSITIVE_DOCS = new Set([
  "Passport — Front Page",
  "Passport — Back Page",
  "Emirates ID — Front",
  "Emirates ID — Back",
  "UAE Residence Visa",
]);

export function withPeriodNote(hint, documentName, periodYear) {
  if (!periodYear || !PERIOD_SENSITIVE_DOCS.has(documentName)) return hint || "";
  const note = `Upload for TRC period: ${periodYear}.`;
  return hint ? `${hint} ${note}` : note;
}
