// Preliminary, non-binding UAE tax-residency eligibility signal.
//
// This computes a HINT for the advisor (and, in a reduced form, the client)
// based on self-reported questionnaire answers and, when available, real
// tracked day-count data. It never determines eligibility on its own — the
// advisor always makes the final call via a manual determination action
// (see src/advisor/components/EligibilityDeterminationCard.jsx), which is
// what actually transitions the application's workflow_state.
//
// Reflects UAE's three independent domestic tax-residency tests under
// Cabinet Decision No. 85 of 2022 (individuals, Art. 4) and the
// incorporation / effective-management tests for legal persons (Art. 3),
// per the FTA's official "Tax Resident and Tax Residency Certificate" guide.

function toLower(v) {
  return String(v || "").trim().toLowerCase();
}

function isYes(v) {
  return toLower(v) === "yes";
}

const GCC_UAE_NATIONALITY_HINTS = [
  "emirati", "uae", "united arab emirates", "saudi", "qatari", "kuwaiti", "bahraini", "omani",
];

function isLikelyGccOrUaeNational(nationality) {
  const n = toLower(nationality);
  return GCC_UAE_NATIONALITY_HINTS.some((hint) => n.includes(hint));
}

function isTouristVisa(visaType) {
  const v = toLower(visaType);
  return v.includes("tourist") || v.includes("visit");
}

/**
 * @param {object} params
 * @param {object} params.eligibilityRequest - a row from `eligibility_requests` (snake_case DB columns)
 * @param {{totalDays:number}|null} [params.presenceSummary] - result of calculatePresenceSummary() from travelHistoryService.js, if tracked travel history exists
 * @param {string} [params.nationality] - the applicant's free-text nationality (from `profiles`/`eligibility_requests` context)
 * @returns {{basis:string, confidence:string, label:string, daySource:string, days:number, testsEvaluated:string[]}}
 */
export function computeRetailEligibilitySignal({ eligibilityRequest = {}, presenceSummary = null, nationality = "" } = {}) {
  let days = 0;
  let daySource = "legacy";

  // Precedence: real tracked data > self-reported day count > legacy boolean.
  // NOTE (accepted limitation for v1): calculatePresenceSummary() sums total
  // tracked days, not a rolling "any consecutive 12-month period" as the real
  // 183-day test requires. Treat "tracked" as a stronger estimate than
  // self-reported, not as an authoritative/verified figure.
  if (presenceSummary && Number.isFinite(presenceSummary.totalDays) && presenceSummary.totalDays > 0) {
    days = presenceSummary.totalDays;
    daySource = "tracked";
  } else if (eligibilityRequest.days_in_uae !== null && eligibilityRequest.days_in_uae !== undefined && eligibilityRequest.days_in_uae !== "" && Number.isFinite(Number(eligibilityRequest.days_in_uae))) {
    days = Number(eligibilityRequest.days_in_uae);
    daySource = "self_reported";
  } else if (toLower(eligibilityRequest.meets_183_days) === "yes") {
    days = 183;
    daySource = "legacy";
  } else if (toLower(eligibilityRequest.meets_183_days) === "no") {
    days = 0;
    daySource = "legacy";
  }

  const notTouristVisa = isYes(eligibilityRequest.uae_visa) && !isTouristVisa(eligibilityRequest.visa_type);
  const hasLegalRightToReside = isLikelyGccOrUaeNational(nationality) || notTouristVisa;
  const hasResidenceOrEmployment = isYes(eligibilityRequest.has_permanent_residence) || isYes(eligibilityRequest.has_uae_employment_or_business);

  const testsEvaluated = ["183_day"];
  if (days >= 183) {
    return { basis: "183_day", confidence: "likely_qualifies", label: "Likely qualifies under the 183-day physical presence test", daySource, days, testsEvaluated };
  }

  testsEvaluated.push("90_day");
  if (days >= 90 && hasLegalRightToReside && hasResidenceOrEmployment) {
    return { basis: "90_day", confidence: "likely_qualifies", label: "May qualify under the 90-day test, pending verification of residence/employment proof", daySource, days, testsEvaluated };
  }

  testsEvaluated.push("interests_test");
  if (isYes(eligibilityRequest.is_centre_of_interests)) {
    // Facts-weighted test with no bright-line rule — never claim "likely",
    // even when the self-reported flag is yes.
    return { basis: "interests_test", confidence: "needs_review", label: "May qualify under the centre-of-financial-and-personal-interests test — this test has no bright-line rule and needs advisor review of the underlying facts", daySource, days, testsEvaluated };
  }

  return { basis: "none_clear", confidence: "does_not_clearly_qualify", label: "Does not clearly meet any of the three UAE tax-residency tests based on the answers given — needs consultation", daySource, days, testsEvaluated };
}

/**
 * @param {object} params
 * @param {object} params.corporateEligibilityRequest - a row from `corporate_eligibility_requests` (snake_case DB columns)
 * @returns {{basis:string, confidence:string, label:string, substanceReviewRecommended:boolean, feeTier:{submissionFeeAed:number, processingFeeAed:number}, periodEligibilityWarning:string|null}}
 */
export function computeCorporateEligibilitySignal({ corporateEligibilityRequest = {} } = {}) {
  const location = toLower(corporateEligibilityRequest.incorporation_location);
  const isUaeIncorporated = ["uae_mainland", "uae_freezone", "uae_offshore"].includes(location);
  const isForeign = location === "foreign";

  const hasTrn = isYes(corporateEligibilityRequest.has_corporate_tax_trn);
  const feeTier = { submissionFeeAed: 50, processingFeeAed: hasTrn ? 500 : 1750 };

  let periodEligibilityWarning = null;
  const incorporationDate = corporateEligibilityRequest.incorporation_date ? new Date(corporateEligibilityRequest.incorporation_date) : null;
  const hasFiledReturn = isYes(corporateEligibilityRequest.has_filed_corporate_tax_return);
  if (incorporationDate && !Number.isNaN(incorporationDate.getTime()) && !hasFiledReturn) {
    const monthsSinceIncorporation = (Date.now() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (monthsSinceIncorporation < 12) {
      periodEligibilityWarning = "Entity has not filed a Corporate Tax Return and appears to have been established for under 12 months — the FTA guide requires 12+ months' establishment before a TRC can be issued in this case.";
    }
  }

  if (isUaeIncorporated) {
    return {
      basis: "uae_incorporation",
      confidence: "likely_qualifies",
      label: "Likely Tax Resident by UAE incorporation",
      // No explicit substance test in the statute for UAE-incorporated
      // entities, but advisory-firm sources report FTA practice sometimes
      // scrutinizes real operational substance — surfaced as a caution.
      substanceReviewRecommended: true,
      feeTier,
      periodEligibilityWarning,
    };
  }

  if (isForeign) {
    const hasManagementFacts = isYes(corporateEligibilityRequest.board_meetings_in_uae) || isYes(corporateEligibilityRequest.key_decision_makers_in_uae);
    if (hasManagementFacts) {
      return {
        basis: "effective_management",
        confidence: "needs_review",
        label: "May qualify via effective management and control exercised in the UAE — facts-based test, needs advisor review",
        substanceReviewRecommended: false,
        feeTier,
        periodEligibilityWarning,
      };
    }
    return {
      basis: "none_clear",
      confidence: "does_not_clearly_qualify",
      label: "Foreign-incorporated with no reported UAE management facts — does not clearly qualify",
      substanceReviewRecommended: false,
      feeTier,
      periodEligibilityWarning,
    };
  }

  return {
    basis: "none_clear",
    confidence: "does_not_clearly_qualify",
    label: "Incorporation location not provided — needs consultation",
    substanceReviewRecommended: false,
    feeTier,
    periodEligibilityWarning,
  };
}

/**
 * Domestic Tax Resident status does not automatically grant DTA-purpose
 * TRC eligibility — the specific treaty's residency article (and
 * tie-breaker rules, if dual-resident) also governs. Returns null when the
 * purpose isn't treaty-related.
 * @param {{trcPurpose:string, treatyCountry?:string}} params
 */
export function getDtaCrossCheckNote({ trcPurpose, treatyCountry } = {}) {
  if (toLower(trcPurpose) !== "treaty") return null;
  const country = treatyCountry ? ` (${treatyCountry})` : "";
  return `Domestic UAE Tax Resident status alone does not guarantee eligibility for a DTA-purpose certificate${country} — the specific treaty's residency article and tie-breaker rules (if dual-resident) also apply. Confirm against the treaty text before finalising.`;
}

export const ELIGIBILITY_BASIS_LABELS = {
  "183_day": "183-day physical presence test",
  "90_day": "90-day test",
  interests_test: "Centre of financial & personal interests test",
  uae_incorporation: "UAE incorporation",
  effective_management: "Effective management and control (UAE)",
  none_clear: "No clear basis identified",
  does_not_qualify: "Does not qualify",
};

export const CONFIDENCE_TONE = {
  likely_qualifies: { bg: "#D1FAE5", color: "#065F46", label: "Likely qualifies" },
  needs_review: { bg: "#FEF3C7", color: "#92400E", label: "Needs review" },
  does_not_clearly_qualify: { bg: "#FEE2E2", color: "#991B1B", label: "Does not clearly qualify" },
};
