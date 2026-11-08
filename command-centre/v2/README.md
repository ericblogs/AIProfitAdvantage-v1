# APEP Business Command Centre v2 (QA)

This is a separate, private QA interface for the APEP Certification QA Supabase project.

## Included in this first interface

- Supabase email/password sign-in
- Application-level owner-role check using `apep_profiles`
- Owner-scoped, read-only dashboard queries protected by existing Row Level Security
- Product, task, alert, approved knowledge and report snapshots
- Responsive layout using the approved APEP blue

## Safety boundaries

- Uses the QA project only: `bivuicydbggfpsdtcziy`
- Uses only the browser-safe publishable key
- Does not use the production APEP project configuration
- Does not create public registrations or grant roles
- Does not write, edit or delete business records
- Does not publish campaigns, send email or customer messages, or process payments
- Does not call the existing mock/template AI function as if it were a live AI service

## Local preview

Serve this directory over HTTP(S), then open `index.html`. A direct `file://` URL is not suitable for ES modules.

The page requires a valid, confirmed Supabase Auth session and an `apep_profiles` row with the `owner` role. Database Row Level Security remains the data-access boundary; hiding UI elements is not treated as security.

## Not yet completed

- Browser end-to-end test with the authorised owner account
- Mobile and keyboard accessibility checks in a real browser
- AI provider connection and grounded executive briefing
- Product detail, task editing, campaign, content, customer and integration modules
- Production configuration or deployment

This folder is not deployed by this change.