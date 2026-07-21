// Shared password-strength rule and "which field is missing" helper, used by
// both the retail and corporate eligibility signup forms so submitting an
// incomplete form or a weak password tells the applicant exactly what to
// fix, instead of a generic "complete every field" message.

export function validatePasswordStrength(password) {
  const pw = String(password || "");
  const problems = [];
  if (pw.length < 8) problems.push("at least 8 characters");
  if (!/[a-z]/.test(pw)) problems.push("a lowercase letter");
  if (!/[A-Z]/.test(pw)) problems.push("an uppercase letter");
  if (!/[0-9]/.test(pw)) problems.push("a number");
  if (!/[^A-Za-z0-9]/.test(pw)) problems.push("a special character");
  return {
    valid: problems.length === 0,
    message: problems.length ? `Password must include ${problems.join(", ")}.` : "",
  };
}

export function findFirstMissingField(form, requiredFields, labels = {}) {
  const key = requiredFields.find((field) => !String(form[field] ?? "").trim());
  if (!key) return null;
  return { key, label: labels[key] || key };
}
