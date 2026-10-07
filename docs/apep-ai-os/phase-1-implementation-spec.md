# APEP AI Operating System — Phase 1 Implementation Specification

## Status
Discovery complete. Phase 1 implementation branch: `feature/apep-ai-os-phase1`.

## Objective
Establish the production foundation for the APEP AI Operating System without disrupting the existing APEP Store, payments, authentication, digital-product entitlements, APEP Assist, growth analytics or existing public site.

## Existing infrastructure confirmed

* Repository: `ericblogs/AIProfitAdvantage-v1`
* Default branch: `main`
* Production domain referenced by the application: `https://aiprofitadvantage.online/`
* Current application is a static HTML/CSS/JavaScript site.
* Existing client-side Supabase usage is through `@supabase/supabase-js@2`.
* Existing application bootstrap is `script.js`.
* Active Supabase project: `APEP`, ref `ccxxokxkxhakwwzqwqgn`, region `eu-west-2`, PostgreSQL 17.
* Existing RLS is enabled across the inspected public tables.
* Existing authentication, digital-product purchases/entitlements, Paystack/PayPal payment functions, APEP Assist, customer lifecycle/analytics, acquisition and referral infrastructure must be preserved.

## Phase 1 architecture

Create a new APEP AI application layer around the existing infrastructure.

### Logical domains

1. AI Workspace
   * conversations
   * messages
   * user preferences
   * AI usage events

2. APEP User Context
   * professional/business profile
   * goals
   * preferences
   * optional business context
   * context visibility/consent

3. AI Knowledge Layer
   * knowledge modules
   * source metadata
   * entitlement requirements
   * retrieval-ready references
   * versioning

4. AI Audit Layer
   * AI actions
   * tool calls
   * approval states
   * execution outcomes
   * errors

## Proposed Phase 1 tables

### `apep_ai_conversations`
* id
* user_id
* title
* status
* created_at
* updated_at
* last_message_at
* metadata

### `apep_ai_messages`
* id
* conversation_id
* user_id
* role
* content
* model_metadata
* created_at

### `apep_ai_user_context`
* id
* user_id
* context_type
* context_value
* visibility
* created_at
* updated_at

### `apep_ai_preferences`
* id
* user_id
* preferred_tone
* preferred_output_style
* default_language
* confirmation_mode
* created_at
* updated_at

### `apep_ai_usage_events`
* id
* user_id
* conversation_id
* event_type
* provider
* model
* tokens_input
* tokens_output
* estimated_cost
* created_at
* metadata

### `apep_ai_audit_events`
* id
* user_id
* conversation_id
* action_type
* status
* approval_required
* approved_at
* executed_at
* error_code
* metadata
* created_at

## Database rules

* Use UUID primary keys and timestamptz fields consistent with the existing schema.
* Every user-owned table must reference `auth.users(id)`.
* Enable RLS on every new user-owned table.
* Restrict ordinary access to the authenticated owner.
* Do not modify existing commercial tables unless a concrete Phase 1 dependency requires it.
* Prefer new tables, controlled views and functions over broad changes to existing commercial tables.
* Do not duplicate the existing purchase/entitlement system.

## AI provider security

Provider calls must eventually occur server-side through a protected Edge Function or equivalent server-side execution layer.

Never place provider API secrets in client-side JavaScript or public configuration.

Do not introduce a production provider dependency until provider configuration and billing/usage implications are verified.

## Initial dashboard

Create a dedicated authenticated APEP AI workspace rather than replacing the existing Store.

Navigation:
* Overview
* AI Workspace
* Conversations
* My Context
* My APEP Knowledge
* Usage
* Account

Do not expose unfinished Phase 2–6 functionality as active features.

## Initial AI workspace

Include:
* APEP branding
* central objective input: “What would you like to accomplish?”
* recent conversations
* context indicator
* available APEP knowledge indicator
* usage indicator
* loading/error states
* responsive desktop/mobile layout

The initial implementation may establish the workspace and persistence before live AI generation if provider configuration has not yet been verified.

## Entitlement integration

Phase 1 should read existing digital-product entitlement information without changing payment logic.

Design the knowledge layer so future Phase 4 modules can associate APEP products with structured knowledge and implementation systems.

## Security baseline

Before declaring Phase 1 production-ready:
* verify RLS policies
* verify authenticated ownership boundaries
* verify unauthenticated access is denied
* verify cross-user access is prevented
* verify audit records cannot be forged by ordinary clients
* verify provider credentials are never exposed
* review Supabase security advisors
* verify existing payment/store functionality remains unaffected

Existing security findings must not be casually altered as part of this phase. In particular, the current leaked-password-protection warning and existing SECURITY DEFINER administrative RPC findings should be tracked separately unless a verified Phase 1 dependency requires remediation.

## Acceptance criteria

Phase 1 is complete only when:
1. Authenticated users can enter the APEP AI workspace.
2. Users can create and persist conversations.
3. Users can send and persist messages through the approved pathway.
4. User context can be created, edited and deleted by its owner.
5. User preferences persist.
6. Existing Store and entitlement functionality remains operational.
7. RLS prevents cross-user access.
8. AI activity is auditable at the required level.
9. The workspace works on mobile and desktop.
10. Production errors do not leak sensitive information.
11. No provider secret is exposed to the browser.
12. Production build/deployment checks pass.
13. Implementation is documented.
14. Phase 2 is not started automatically.

## Implementation sequence

1. Add Phase 1 schema through a new Supabase migration.
2. Apply and verify RLS.
3. Create the authenticated AI workspace UI.
4. Connect conversation persistence.
5. Connect user context and preferences.
6. Add server-side AI request infrastructure only after provider configuration is verified.
7. Add usage/audit instrumentation.
8. Run security and regression checks.
9. Document the completed Phase 1 state.

## Out of scope

Do not implement:
* Business Strategy Agent
* Client Acquisition Agent
* Workflow Automation Agent
* external action execution
* project management
* financial management
* video generation
* autonomous agents
* broad third-party integrations
* subscription billing changes

## Delivery report

At completion report:
* implementation summary
* files changed
* database migrations
* security checks
* tests performed
* production verification
* limitations
* unresolved decisions
* recommendation for Phase 2

Never report a capability as complete unless it has actually been implemented and verified.
