# Gate 3C.21 Admin Implementation Acceptance

## Scope

Recover and validate the existing read-only APEP Admin Command Center without modifying the student dashboard, current production branch, authentication architecture, course player, or payment systems.

## Security boundary

- Authentication requires an existing Supabase session.
- Authorization must use `public.is_current_user_admin()`.
- Unauthorized users must not receive the Command Center.
- No service-role credentials or private admin-table data may be exposed to the browser.
- The Command Center is read-only for this gate.

## Functional acceptance

1. Authorized administrator can access `/admin/index.html`.
2. Authenticated non-admin is denied.
3. Unauthenticated visitor is denied/required to authenticate.
4. Published course intelligence loads for an authorized administrator.
5. Existing production recovery remains unchanged.

## Release controls

- Recovery branch only.
- Production deployment requires independent runtime evidence.
- No student-dashboard modification.
- Browser runtime evidence is required before Release Candidate status.
