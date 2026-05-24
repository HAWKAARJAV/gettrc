# TRC Connect

**UAE Tax Residency Certificate (TRC) compliance platform.**  
Live → **[gettrc.com](https://gettrc.com)**

---

## Overview

TRC Connect is a full-stack compliance workspace managing the end-to-end TRC application process for individuals and corporations in the UAE. It connects clients, compliance advisors, and admin staff through role-specific workspaces backed by Supabase and deployed on Netlify.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Serverless | Netlify Functions |
| Hosting | Netlify |
| Email | Resend |

---

## Roles & Workspaces

### Retail Client — `/retail`
Individual applicants tracking their TRC application.
- Eligibility check and submission
- Stage-by-stage progress with human-readable labels
- Document upload — required checklist + advisor-requested files
- Real-time chat with assigned advisor
- Support tickets

### Corporate Client — `/corporate`
Enterprise compliance workspace.
- Corporate eligibility request and review
- Full workspace unlocked post-payment: Applications, Documents, Advisors, Billing, Reports, Settings
- Advisor document requests with file upload
- Support tickets

### Advisor — `/advisor`
Compliance specialist workspace.
- Assigned case list with unread badges
- Case detail: **Overview** (client + eligibility info) · **Documents** (request / approve / reject) · **Messages** (real-time chat)
- Document request modal — standard types + custom
- Status updates to admin

### Admin — `/admin`
Internal compliance ops dashboard.
- Retail + Corporate eligibility review queues
- Advisor assignment
- Workflow state transitions
- Account management and analytics

---

## Project Structure

```
src/
├── advisor/          # Advisor workspace (pages, layouts, guards)
├── corporate/        # Corporate workspace (pages, hooks, services)
├── retail/           # Retail workspace (pages, routes, layouts)
├── components/       # Shared UI components
├── documents/        # documentService.js — upload, requests, requirements
├── workflow/         # Workflow mutations, stage resolution, timeline
├── services/         # advisorAuth.js, retailAuth.js
├── notifications/    # notificationService.js
├── config/           # retailTheme.js
├── pages/            # Public pages (login, eligibility, verify email)
├── AdminDashboard.jsx
├── TRCConnectApp.jsx # Root router
└── supabaseClient.js

netlify/
└── functions/
    ├── requestDocument.js      # Advisor requests a doc → notify client
    ├── reviewDocument.js       # Approve / reject uploaded documents
    ├── assignAdvisor.js        # Admin assigns advisor to application
    ├── updateWorkflowState.js  # Stage transitions with audit history
    ├── updatePaymentState.js   # Payment confirmation
    ├── createNotification.js   # Push notification to user
    ├── getSignedDocumentUrl.js # Signed URL for secure file access
    └── sendInquiryEmail.js     # Resend email dispatch
```

---

## Workflow States

```
pending_review → eligible → payment_pending → payment_completed
  → documents_pending → documents_under_review → advisor_assigned
  → processing → submitted_to_authority → completed
                                         ↘ rejected
```

Workspace unlocks after `payment_completed`. All subsequent stages grant full access.

---

## Key Features

- **Document management** — Advisors request specific docs from clients; clients upload against each request; advisors approve or reject with notes
- **Real-time messaging** — Per-application chat between client and advisor with unread badges and live polling
- **RLS security** — All DB queries scoped by `auth.uid()` via Supabase Row Level Security; service-role operations run through Netlify functions only
- **Dual applicant types** — Retail (individual) and Corporate flows with separate eligibility tables, profiles, and workspace logic
- **Human-readable stages** — Workflow states rendered as plain English throughout every workspace and header

---

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Netlify functions only — never expose client-side) |
| `RESEND_API_KEY` | Resend API key for transactional email |

> ⚠️ `.env.local` is gitignored and must never be committed.

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server on :5174
netlify dev          # Vite + Netlify functions together
```

## Deploy to Production

```bash
npm run build
netlify deploy --prod
```

**Production:** [https://gettrc.com](https://gettrc.com)
