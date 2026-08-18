# Engineering Change Log

Baseline: RC-1.2.0 Production Release Candidate

Changes applied:
- Added complete production canonical, Open Graph, Twitter and Organization metadata.
- Added a dedicated 1200×630 social sharing card.
- Added SVG, PNG and Apple touch application icons with a corrected web manifest.
- Enabled production crawling and added the canonical sitemap URL.
- Corrected mobile navigation keyboard focus and accessible menu-state announcements.
- Corrected primary text and link contrast to WCAG 2.2 AA.
- Aligned active RC-1.2.0 release documentation.

Scope: static hosting, search discovery, accessibility and release-readiness remediation only.

Not performed:
- GitHub Pages deployment.
- DNS activation.
- Browser runtime validation.
- Lighthouse audit.

## APEP Academy — Supabase Integration

Current backend: `ccxxokxkxhakwwzqwqgn`

Implemented:
- Added Supabase-backed student profile, course, lesson, enrollment and lesson-progress persistence.
- Connected the existing dashboard and course library data layer to Supabase.
- Connected AI Foundations lesson-player pages 1–3 to authenticated progress persistence.
- Added enrollment-aware lesson access and lesson completion persistence.
- Enabled RLS for Academy application tables and hardened lesson-progress ownership/enrollment checks.
- Restricted `public.rls_auto_enable()` execution for anonymous/authenticated API callers while preserving its database event-trigger role.
- Marked AI Foundations lessons 4–5 unpublished because their content is still incomplete.

Current lesson-player scope:
- Lessons 1–3: active implementation scope.
- Lessons 4–5: work in progress; not published through the Academy data layer.
- Planned course length remains 20 lessons.

QA:
- Supabase schema, lesson publication state and RLS policy inventory verified.
- Security advisors rechecked after the RLS hardening change.
- Remaining security advisory: leaked-password protection is disabled in Supabase Auth.
- Browser-level end-to-end registration/login/enrollment/lesson-completion testing remains to be performed with a controlled test account.

Deployment:
- No deployment performed in this change set.
