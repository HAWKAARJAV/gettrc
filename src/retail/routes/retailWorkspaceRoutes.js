export const RETAIL_LIMITED_NAV_ITEMS = [
  { key: "dashboard",          label: "Dashboard",          icon: "◉",  path: "/retail/dashboard" },
  { key: "eligibility-status", label: "Eligibility Status", icon: "⌁",  path: "/retail/eligibility-status" },
  { key: "profile",            label: "Profile",            icon: "👤", path: "/retail/profile" },
  { key: "support",            label: "Support",            icon: "✉",  path: "/retail/support" },
];

export const RETAIL_LOCKED_NAV_ITEMS = [
  { key: "documents",  label: "Documents",         icon: "🗂",  path: "/retail/documents" },
  { key: "chat",       label: "Chat with Advisor", icon: "💬",  path: "/retail/chat" },
  { key: "requested",  label: "Requested Docs",    icon: "📋",  path: "/retail/requested" },
  { key: "residency",  label: "Residency Tracker", icon: "⌁",  path: "/retail/residency" },
];

export const RETAIL_FULL_NAV_ITEMS = [...RETAIL_LIMITED_NAV_ITEMS, ...RETAIL_LOCKED_NAV_ITEMS];

export const RETAIL_ROUTE_META = {
  "/retail/dashboard": {
    title: "Dashboard",
    description: "Track your TRC application progress and stay up to date at a glance.",
  },
  "/retail/eligibility-status": {
    title: "Eligibility Status",
    description: "Review your current eligibility state, submitted information, and specialist notes.",
  },
  "/retail/profile": {
    title: "Profile",
    description: "Update your core contact details and review residency information.",
  },
  "/retail/support": {
    title: "Support",
    description: "Get help with your UAE TRC process or raise a support request.",
  },
  "/retail/documents": {
    title: "Documents",
    description: "Upload and manage compliance documents once the workspace is unlocked.",
  },
  "/retail/chat": {
    title: "Chat with Advisor",
    description: "Direct messaging channel with your assigned TRC advisor.",
  },
  "/retail/requested": {
    title: "Requested Documents",
    description: "Documents your advisor has requested. Upload them here to keep your application moving.",
  },
  "/retail/residency": {
    title: "Residency Tracker",
    description: "Track UAE day count, travel periods, and residency thresholds for compliance review.",
  },
};

export const RETAIL_FEATURES = {
  documents: {
    title: "Documents Vault",
    subtitle: "Collect and organize the files needed for TRC processing.",
    cards: [
      "Passport copy and travel history",
      "Proof of UAE residence",
      "Bank statements and source of income",
      "Trade license or employment proof",
    ],
  },
  residency: {
    title: "Residency Presence Tracker",
    subtitle: "Calculate UAE presence days and track tax residency thresholds.",
    cards: [
      "Travel periods with inclusive day counting",
      "90-day and 183-day threshold visibility",
      "Timeline evidence for specialist review",
      "Country-aware residency configuration",
    ],
  },
};

export function isRetailWorkspaceUnlocked(stage) {
  return [
    "payment_completed",
    "documents_pending",
    "documents_under_review",
    "advisor_assigned",
    "processing",
    "submitted_to_authority",
    "completed",
  ].includes(String(stage || ""));
}

export function getRetailRouteMeta(pathname) {
  return RETAIL_ROUTE_META[pathname] || RETAIL_ROUTE_META["/retail/dashboard"];
}
