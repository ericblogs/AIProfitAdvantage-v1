-- APEP AI Operating System — Phase 1 core schema
-- Non-destructive: creates only new AI-core tables and policies.

create table if not exists public.apep_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  status text not null default 'active'
    check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.apep_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.apep_ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.apep_ai_user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_type text not null,
  context_value text not null,
  visibility text not null default 'private'
    check (visibility in ('private','workspace')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apep_ai_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  preferred_tone text,
  preferred_output_style text,
  default_language text not null default 'en-GB',
  confirmation_mode text not null default 'confirm'
    check (confirmation_mode in ('confirm','guided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apep_ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.apep_ai_conversations(id) on delete set null,
  event_type text not null,
  provider text,
  model text,
  tokens_input integer,
  tokens_output integer,
  estimated_cost numeric(14,6),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.apep_ai_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.apep_ai_conversations(id) on delete set null,
  action_type text not null,
  status text not null,
  approval_required boolean not null default false,
  approved_at timestamptz,
  executed_at timestamptz,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_apep_ai_conversations_user_updated
  on public.apep_ai_conversations(user_id, updated_at desc);

create index if not exists idx_apep_ai_messages_conversation_created
  on public.apep_ai_messages(conversation_id, created_at);

create index if not exists idx_apep_ai_messages_user_created
  on public.apep_ai_messages(user_id, created_at desc);

create index if not exists idx_apep_ai_context_user_type
  on public.apep_ai_user_context(user_id, context_type);

create index if not exists idx_apep_ai_usage_user_created
  on public.apep_ai_usage_events(user_id, created_at desc);

create index if not exists idx_apep_ai_audit_user_created
  on public.apep_ai_audit_events(user_id, created_at desc);

alter table public.apep_ai_conversations enable row level security;
alter table public.apep_ai_messages enable row level security;
alter table public.apep_ai_user_context enable row level security;
alter table public.apep_ai_preferences enable row level security;
alter table public.apep_ai_usage_events enable row level security;
alter table public.apep_ai_audit_events enable row level security;

drop policy if exists "apep_ai_conversations_owner_select" on public.apep_ai_conversations;
create policy "apep_ai_conversations_owner_select"
  on public.apep_ai_conversations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_conversations_owner_insert" on public.apep_ai_conversations;
create policy "apep_ai_conversations_owner_insert"
  on public.apep_ai_conversations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_conversations_owner_update" on public.apep_ai_conversations;
create policy "apep_ai_conversations_owner_update"
  on public.apep_ai_conversations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_conversations_owner_delete" on public.apep_ai_conversations;
create policy "apep_ai_conversations_owner_delete"
  on public.apep_ai_conversations for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_messages_owner_select" on public.apep_ai_messages;
create policy "apep_ai_messages_owner_select"
  on public.apep_ai_messages for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_messages_owner_insert" on public.apep_ai_messages;
create policy "apep_ai_messages_owner_insert"
  on public.apep_ai_messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'user'
    and exists (
      select 1 from public.apep_ai_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Message updates/deletes are server-side only so authenticated clients cannot alter
-- assistant/system output or erase the conversation audit trail.
drop policy if exists "apep_ai_context_owner_select" on public.apep_ai_user_context;
create policy "apep_ai_context_owner_select"
  on public.apep_ai_user_context for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_context_owner_insert" on public.apep_ai_user_context;
create policy "apep_ai_context_owner_insert"
  on public.apep_ai_user_context for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_context_owner_update" on public.apep_ai_user_context;
create policy "apep_ai_context_owner_update"
  on public.apep_ai_user_context for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_context_owner_delete" on public.apep_ai_user_context;
create policy "apep_ai_context_owner_delete"
  on public.apep_ai_user_context for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_preferences_owner_select" on public.apep_ai_preferences;
create policy "apep_ai_preferences_owner_select"
  on public.apep_ai_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_preferences_owner_insert" on public.apep_ai_preferences;
create policy "apep_ai_preferences_owner_insert"
  on public.apep_ai_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_preferences_owner_update" on public.apep_ai_preferences;
create policy "apep_ai_preferences_owner_update"
  on public.apep_ai_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "apep_ai_preferences_owner_delete" on public.apep_ai_preferences;
create policy "apep_ai_preferences_owner_delete"
  on public.apep_ai_preferences for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_usage_owner_select" on public.apep_ai_usage_events;
create policy "apep_ai_usage_owner_select"
  on public.apep_ai_usage_events for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "apep_ai_audit_owner_select" on public.apep_ai_audit_events;
create policy "apep_ai_audit_owner_select"
  on public.apep_ai_audit_events for select
  to authenticated
  using (user_id = auth.uid());

-- Usage, audit and non-user message mutations deliberately have no ordinary client
-- INSERT/UPDATE/DELETE policies. They should be written by trusted server-side infrastructure.
