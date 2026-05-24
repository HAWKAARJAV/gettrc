Security & RLS Checklist for TRC Connect

1. Supabase RLS Policies
- Ensure `profiles` table only exposes non-sensitive fields to public role. Use RLS to allow users to access only their own profile rows (using auth.uid()).
- `applications` table: RLS should allow users to select only rows where user_id = auth.uid() OR where user has admin role. Admin operations should be performed via a service role or via server-side endpoints.
- `documents` table & storage: storage bucket `trc-private-documents` should be private. Use signed URLs for transient access and do not expose direct storage paths in UI.

2. Supabase Storage
- Create policies to prevent public access to `trc-private-documents`.
- Use `createSignedUrl` for downloading; rotate expires to short durations (e.g., 10 minutes for reviewers, 1 hour max for admin).

3. API & Admin
- AdminDashboard uses `SUPABASE_KEY` for server-side REST queries; ensure admin only endpoints use service key and are executed server-side where possible.
- Do not store service role key in client bundles.

4. Document Review Flow
- Approve/Reject actions should be audited in `application_status_history` and `documents` reviewer fields.
- Reviewer notes stored on `documents.reviewer_notes`.

5. Notifications
- Notifications table should expose only the user's notifications.
- Avoid sending sensitive data in notification bodies.

6. Testing & Monitoring
- Add automated tests for RLS policies using Supabase CLI and a test role.
- Monitor storage logs and set alerts for abnormal access patterns.

7. Next Steps
- Implement server-side endpoints for admin operations with service role auth.
- Run a security review with an infra engineer and perform penetration testing on storage endpoints.
