<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="TRC Connect" />

# TRC Connect

### UAE Tax Residency Certificate — End-to-End Compliance Platform

**[gettrc.com](https://gettrc.com)** &nbsp;·&nbsp; Built for advisors, corporates, and individuals navigating UAE tax residency

[![Live](https://img.shields.io/badge/Live-gettrc.com-0F2557?style=for-the-badge&logo=netlify&logoColor=white)](https://gettrc.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)

</div>

---

## What Is TRC Connect?

The UAE Tax Residency Certificate (TRC) is a government-issued document that legally establishes a person or company's tax residence in the UAE — enabling them to benefit from the UAE's 130+ double taxation treaties.

The current process is opaque, manual, and fragmented across emails, shared drives, and disconnected tools. **TRC Connect replaces that entirely.**

It is a multi-role, production-grade compliance platform that handles every step — from initial eligibility assessment through document collection, advisor assignment, regulatory submission, and final certificate issuance — in a single, secure, audit-ready workspace.

---

## The Platform

TRC Connect is built around **four interconnected workspaces**, each purpose-built for a different actor in the compliance workflow.

<br/>

### 🏠 Retail Client Workspace
*For individual applicants — employees, freelancers, HNWIs seeking UAE tax residency*

| Feature | Detail |
|---|---|
| Eligibility check | Guided form capturing residency signals (visa, days in UAE, income source, etc.) |
| Stage tracking | Real-time progress with human-readable milestones from review → certificate |
| Document upload | Required document checklist + per-request upload against advisor asks |
| Advisor messaging | Live chat with assigned compliance specialist |
| Requested documents | Dedicated page for advisor-requested files with one-click upload |
| Support tickets | In-platform support with admin reply thread |

<br/>

### 🏢 Corporate Workspace
*For companies, holding structures, and multi-entity groups*

| Feature | Detail |
|---|---|
| Corporate eligibility | Separate flow capturing entity type, jurisdiction, UAE presence, structure |
| Full workspace unlock | All modules become active post-payment: Applications, Documents, Advisors, Billing, Reports, Settings |
| Document management | Advisor document requests visible and uploadable directly in workspace |
| Support | Corporate support ticket queue with compliance manager responses |
| Profile management | Editable company profile synced to review and billing |

<br/>

### 👤 Advisor Workspace
*For compliance specialists managing assigned client cases*

| Feature | Detail |
|---|---|
| Case list | All assigned cases with unread message badges and workflow state |
| Overview tab | Client profile, eligibility details (visa, occupation, income, days in UAE), application metadata |
| Documents tab | Required document checklist, custom request modal, uploaded file review with approve / reject + notes |
| Messages tab | Real-time chat with client, 6s polling, read receipts |
| Admin updates | Structured status updates pushed to admin for workflow decisions |

<br/>

### ⚙️ Admin Dashboard
*For the compliance operations team*

| Tab | Function |
|---|---|
| Overview | Platform-wide metrics and activity |
| Retail Eligibility | Full queue of retail applications with stage management |
| Corporate | Corporate applicant review and advisor routing |
| Advisor Chat | Monitor advisor–client conversations |
| Advisor Updates | Review field updates from advisors |
| Accounts | User and advisor account management |
| Analytics | Conversion and throughput reporting |

---

## Compliance Workflow

Every application moves through a defined state machine. The platform enforces, displays, and logs every transition.

```
Submitted
    │
    ▼
pending_review ──→ eligible ──→ payment_pending ──→ payment_completed
                                                           │
                                              ┌────────────┘
                                              ▼
                                      documents_pending
                                              │
                                              ▼
                                   documents_under_review
                                              │
                                              ▼
                                      advisor_assigned
                                              │
                                              ▼
                                          processing
                                              │
                                              ▼
                                  submitted_to_authority
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                          completed                        rejected
```

All transitions are logged to `application_status_history` with timestamps, actor, and notes. Workspace modules unlock progressively — clients only see what's relevant to their current stage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        gettrc.com                           │
│                   React 19 SPA (Vite)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Retail  │  │Corporate │  │ Advisor  │  │  Admin   │   │
│  │Workspace │  │Workspace │  │Workspace │  │Dashboard │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│              React Router v7 · Role Guards                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
   ┌─────────────────────┐       ┌────────────────────────┐
   │      Supabase        │       │   Netlify Functions    │
   │                     │       │                        │
   │  PostgreSQL (RLS)   │       │  assignAdvisor         │
   │  Auth (JWT)         │       │  updateWorkflowState   │
   │  Storage (private)  │       │  reviewDocument        │
   │  Realtime           │       │  requestDocument       │
   │                     │       │  updatePaymentState    │
   └─────────────────────┘       │  createNotification    │
                                 │  getSignedDocumentUrl  │
                                 │  sendInquiryEmail      │
                                 └────────────────────────┘
                                           │
                                           ▼
                                    ┌────────────┐
                                    │   Resend   │
                                    │  (Email)   │
                                    └────────────┘
```

**Security model:** The React client uses Supabase's anon key with Row Level Security. Every sensitive mutation (state transitions, document review, advisor assignment) runs through a Netlify Function that validates the caller's JWT and uses a service-role key server-side. The service-role key is never exposed to the browser.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React 19 + Vite | Component model maps cleanly to multi-role workspace architecture |
| **Routing** | React Router v7 | Nested layouts, role guards, and deep-link support (e.g. `?tab=messages`) |
| **Database** | Supabase (PostgreSQL) | Row-level security, real-time subscriptions, auth, and storage in one platform |
| **Auth** | Supabase Auth (JWT) | Per-role session isolation; corporate and retail auth flows are separate |
| **Storage** | Supabase Storage | Private document bucket with signed URL generation via serverless function |
| **Functions** | Netlify Functions | Serverless mutations that require service-role elevation |
| **Email** | Resend | Transactional email (status updates, verification, support) |
| **Hosting** | Netlify | CDN + function bundling + instant deploy from CLI |

---

## Codebase Structure

```
src/
├── advisor/
│   ├── guards/          # Auth guard — redirect unauthenticated advisors
│   ├── layouts/         # Advisor shell layout
│   └── pages/           # Dashboard, Cases list, Case detail (Overview·Docs·Messages)
│
├── corporate/
│   ├── components/      # Sidebar, auth shell
│   ├── hooks/           # useCorporateWorkspace — session + workspace state
│   ├── services/        # corporateAuth.js — login, register, workspace fetch
│   └── pages/           # Dashboard, Eligibility, Profile, Documents, Support + all feature pages
│
├── retail/
│   ├── guards/          # Auth + stage guard
│   ├── layouts/         # Retail shell layout with stage-aware nav
│   └── pages/           # Dashboard, Eligibility Status, Documents, Requested, Chat, Profile, Support
│
├── documents/
│   └── documentService.js   # fetch/upload/request/fulfill document operations
│
├── workflow/
│   ├── applicationService.js    # Fetch application + history
│   ├── workflowMutationService.js  # Client-side wrappers for Netlify function calls
│   ├── workflowStates.js        # State machine definitions
│   └── generateRequiredActions.js  # Derive pending tasks from current state
│
├── services/
│   ├── advisorAuth.js   # Advisor login + workspace fetch (cases + eligibility join)
│   └── retailAuth.js    # Retail login + workspace fetch
│
├── components/          # Shared: EmptyState, SkeletonCard, WorkflowTimeline, NotificationCenter, etc.
├── adminApi.js          # Client-side wrappers for all Netlify functions
├── TRCConnectApp.jsx    # Root router — all roles and routes
└── supabaseClient.js

netlify/functions/       # 10 serverless functions (service-role, JWT-verified)
supabase/migrations/     # 14 ordered SQL migrations — full schema history
```

---

## Local Development

**Prerequisites:** Node 18+, Netlify CLI, Supabase account

```bash
# 1. Clone
git clone https://github.com/HAWKAARJAV/gettrc.git
cd gettrc

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

# 4. Start (Vite + Netlify functions together)
netlify dev
```

App available at `http://localhost:8888` with all functions active.

---

## Deployment

```bash
npm run build          # Vite build → dist/
netlify deploy --prod  # Deploy dist/ + bundle all 10 functions
```

Live at **[https://gettrc.com](https://gettrc.com)**

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | Supabase project endpoint |
| `VITE_SUPABASE_ANON_KEY` | Client | Public JWT — safe to expose; RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions only | Full DB access — never sent to browser |
| `RESEND_API_KEY` | Functions only | Transactional email dispatch |

> `.env.local` is gitignored. The `.env.example` file documents all required variables with no real values.

---

## Security Highlights

- **RLS on every table** — `auth.uid()` scoped policies; advisors only see their assigned cases, clients only see their own applications
- **Service-role isolation** — sensitive operations (state changes, document review, advisor assignment) go through server-side Netlify Functions; service key never touches the browser
- **Signed document URLs** — private Supabase Storage bucket; files served only via short-lived signed URLs generated server-side
- **Role-separated auth flows** — retail, corporate, and advisor sessions are completely isolated with separate login pages, guards, and localStorage namespaces
- **JWT verification on every function** — all Netlify functions verify the caller's Supabase JWT before executing

---

<div align="center">

**[gettrc.com](https://gettrc.com)** &nbsp;·&nbsp; Built with ❤️ for UAE compliance

</div>
