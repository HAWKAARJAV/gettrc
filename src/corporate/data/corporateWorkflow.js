export const CORPORATE_LIMITED_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◉", path: "/corporate/dashboard" },
  { key: "eligibility-status", label: "Eligibility Status", icon: "⌁", path: "/corporate/eligibility-status" },
  { key: "profile", label: "Company Profile", icon: "🏢", path: "/corporate/profile" },
  { key: "support", label: "Support", icon: "✉", path: "/corporate/support" },
  { key: "logout", label: "Logout", icon: "⎋", path: "/corporate/logout" },
];

export const CORPORATE_LOCKED_NAV_ITEMS = [
  { key: "applications", label: "Company Applications", icon: "📄", path: "/corporate/applications" },
  { key: "employees", label: "Employees / Entities", icon: "👥", path: "/corporate/employees" },
  { key: "compliance", label: "Compliance Center", icon: "⚖", path: "/corporate/compliance-center" },
  { key: "documents", label: "Documents", icon: "🗂", path: "/corporate/documents" },
  { key: "advisors", label: "Advisors", icon: "✦", path: "/corporate/advisors" },
  { key: "billing", label: "Billing", icon: "💳", path: "/corporate/billing" },
  { key: "reports", label: "Reports", icon: "📊", path: "/corporate/reports" },
  { key: "settings", label: "Settings", icon: "⚙", path: "/corporate/settings" },
];

export const CORPORATE_FULL_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◉", path: "/corporate/dashboard" },
  { key: "applications", label: "Company Applications", icon: "📄", path: "/corporate/applications" },
  { key: "employees", label: "Employees / Entities", icon: "👥", path: "/corporate/employees" },
  { key: "compliance", label: "Compliance Center", icon: "⚖", path: "/corporate/compliance-center" },
  { key: "documents", label: "Documents", icon: "🗂", path: "/corporate/documents" },
  { key: "advisors", label: "Advisors", icon: "✦", path: "/corporate/advisors" },
  { key: "reports", label: "Reports", icon: "📊", path: "/corporate/reports" },
  { key: "billing", label: "Billing", icon: "💳", path: "/corporate/billing" },
  { key: "support", label: "Support", icon: "✉", path: "/corporate/support" },
  { key: "settings", label: "Settings", icon: "⚙", path: "/corporate/settings" },
];

export const CORPORATE_ROUTE_META = {
  "/corporate/dashboard": {
    title: "Dashboard",
    description: "Executive workspace overview for corporate compliance operations.",
  },
  "/corporate/eligibility-status": {
    title: "Eligibility Status",
    description: "Review the current corporate review stage, notes, and payment state.",
  },
  "/corporate/profile": {
    title: "Company Profile",
    description: "Confirm company details used in compliance review and billing.",
  },
  "/corporate/support": {
    title: "Support",
    description: "Connect with the compliance desk for enterprise onboarding support.",
  },
  "/corporate/applications": {
    title: "Company Applications",
    description: "Track enterprise filings and the operational application stack.",
  },
  "/corporate/employees": {
    title: "Employees / Entities",
    description: "Manage entity structure and team-level access once unlocked.",
  },
  "/corporate/compliance-center": {
    title: "Compliance Center",
    description: "Review regulatory tasks, treaty work, and operational compliance flows.",
  },
  "/corporate/documents": {
    title: "Documents",
    description: "Manage corporate files and supporting documents.",
  },
  "/corporate/advisors": {
    title: "Advisors",
    description: "See assigned compliance specialists and advisory handoff notes.",
  },
  "/corporate/reports": {
    title: "Reports",
    description: "View reporting outputs and compliance summaries.",
  },
  "/corporate/billing": {
    title: "Billing",
    description: "Monitor payment status, invoices, and commercial terms.",
  },
  "/corporate/settings": {
    title: "Settings",
    description: "Workspace permissions and account preferences.",
  },
};

export const CORPORATE_FEATURES = {
  applications: {
    title: "Company Applications",
    subtitle: "Manage structured enterprise filings and specialist review cycles.",
    cards: [
      "Submission queue and review milestones",
      "Multiple entity mapping",
      "Commercial and compliance handoff",
      "Documenting operational approvals",
    ],
  },
  employees: {
    title: "Employees / Entities",
    subtitle: "Track legal entities, teams, and operating jurisdictions.",
    cards: [
      "Holding companies and subsidiaries",
      "Named compliance contacts",
      "Entity access and permissions",
      "Jurisdiction coverage snapshots",
    ],
  },
  compliance: {
    title: "Compliance Center",
    subtitle: "Monitor tax residency workflow, treaty eligibility, and review tasks.",
    cards: [
      "Review queue and SLA tracking",
      "Treaty pathway notes",
      "Operational compliance checkpoints",
      "Manual specialist escalation",
    ],
  },
  documents: {
    title: "Documents Vault",
    subtitle: "Store and track filings, licenses, and supporting evidence.",
    cards: [
      "Incorporation documents",
      "Corporate structure evidence",
      "Tax residency support files",
      "Upload history and versioning",
    ],
  },
  advisors: {
    title: "Advisors",
    subtitle: "View the compliance lead and advisory handoff details.",
    cards: [
      "Assigned compliance specialist",
      "Jurisdiction-specific advisors",
      "Communication log",
      "Escalation and approvals",
    ],
  },
  reports: {
    title: "Reporting Room",
    subtitle: "Operational summaries and compliance outputs for stakeholders.",
    cards: [
      "Executive summaries",
      "Audit-ready exports",
      "Payment and milestone reports",
      "Compliance outcome snapshots",
    ],
  },
  billing: {
    title: "Billing Center",
    subtitle: "Commercial status, payment confirmation, and invoices.",
    cards: [
      "Payment pending and completed states",
      "Invoice history",
      "Receipt capture",
      "Commercial terms review",
    ],
  },
  settings: {
    title: "Workspace Settings",
    subtitle: "Permissions, access, and operational preferences.",
    cards: [
      "User access controls",
      "Company contact preferences",
      "Notification routing",
      "Security and account settings",
    ],
  },
};

export function isCorporateWorkspaceUnlocked(stage) {
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

export function getCorporateRouteMeta(pathname) {
  return CORPORATE_ROUTE_META[pathname] || CORPORATE_ROUTE_META["/corporate/dashboard"];
}