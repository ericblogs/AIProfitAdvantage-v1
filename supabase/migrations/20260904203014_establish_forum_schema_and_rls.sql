-- APEP Forum — Gate 11D.16 Promotion Artifact
-- RECONSTRUCTED MIGRATION CANDIDATE — NOT THE RECOVERED ORIGINAL SQL
-- Migration identity recovered from QA Supabase:
--   20260904203014_establish_forum_schema_and_rls
-- QA source baseline:
--   Supabase project ref: bivuicydbggfpsdtcziy
--   Project: APEP Certification QA
--
-- IMPORTANT GOVERNANCE NOTICE:
-- This artifact was reconstructed from the verified QA live schema.
-- The original migration SQL body was not recovered from source control.
-- This commit establishes the reconstructed candidate in Git for review.
-- It MUST NOT be applied to production under Gate 11D.16.
-- Production promotion remains separately locked pending CTO approval.

BEGIN;

CREATE TABLE public.forum_categories (
  id uuid NOT NULL DEFAULT extensions.gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_categories_pkey PRIMARY KEY (id),
  CONSTRAINT forum_categories_slug_key UNIQUE (slug),
  CONSTRAINT forum_categories_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE public.forum_topics (
  id uuid NOT NULL DEFAULT extensions.gen_random_uuid(),
  category_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text,
  is_pinned boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_topics_pkey PRIMARY KEY (id),
  CONSTRAINT forum_topics_category_id_slug_key UNIQUE (category_id, slug),
  CONSTRAINT forum_topics_status_check CHECK (
    status = ANY (ARRAY['open'::text, 'locked'::text, 'hidden'::text, 'archived'::text])
  ),
  CONSTRAINT forum_topics_title_check CHECK (
    char_length(btrim(title)) >= 3 AND char_length(btrim(title)) <= 200
  ),
  CONSTRAINT forum_topics_view_count_check CHECK (view_count >= 0),
  CONSTRAINT forum_topics_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE RESTRICT,
  CONSTRAINT forum_topics_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT extensions.gen_random_uuid(),
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_post_id uuid,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'visible'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_posts_pkey PRIMARY KEY (id),
  CONSTRAINT forum_posts_body_check CHECK (
    char_length(btrim(body)) >= 1 AND char_length(btrim(body)) <= 10000
  ),
  CONSTRAINT forum_posts_status_check CHECK (
    status = ANY (ARRAY['visible'::text, 'hidden'::text, 'deleted'::text])
  ),
  CONSTRAINT forum_posts_parent_post_id_fkey
    FOREIGN KEY (parent_post_id) REFERENCES public.forum_posts(id) ON DELETE SET NULL,
  CONSTRAINT forum_posts_topic_id_fkey
    FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  CONSTRAINT forum_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX forum_categories_active_order_idx
  ON public.forum_categories USING btree (is_active, display_order);

CREATE INDEX forum_posts_topic_status_idx
  ON public.forum_posts USING btree (topic_id, status, created_at);

CREATE INDEX forum_posts_user_idx
  ON public.forum_posts USING btree (user_id, created_at DESC);

CREATE INDEX forum_topics_category_status_idx
  ON public.forum_topics USING btree (
    category_id, status, is_pinned DESC, updated_at DESC
  );

CREATE INDEX forum_topics_user_idx
  ON public.forum_topics USING btree (user_id, created_at DESC);

ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_categories_public_read
  ON public.forum_categories
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY forum_topics_public_read
  ON public.forum_topics
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (
    status = ANY (ARRAY['open'::text, 'locked'::text])
    AND EXISTS (
      SELECT 1
      FROM public.forum_categories c
      WHERE c.id = forum_topics.category_id
        AND c.is_active = true
    )
  );

CREATE POLICY forum_topics_authenticated_insert
  ON public.forum_topics
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.forum_categories c
      WHERE c.id = forum_topics.category_id
        AND c.is_active = true
    )
  );

CREATE POLICY forum_topics_own_update
  ON public.forum_topics
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND status = ANY (ARRAY['open'::text, 'locked'::text])
  )
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY forum_posts_public_read
  ON public.forum_posts
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'visible'::text
    AND EXISTS (
      SELECT 1
      FROM public.forum_topics t
      JOIN public.forum_categories c ON c.id = t.category_id
      WHERE t.id = forum_posts.topic_id
        AND t.status = ANY (ARRAY['open'::text, 'locked'::text])
        AND c.is_active = true
    )
  );

CREATE POLICY forum_posts_authenticated_insert
  ON public.forum_posts
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.forum_topics t
      JOIN public.forum_categories c ON c.id = t.category_id
      WHERE t.id = forum_posts.topic_id
        AND t.status = 'open'::text
        AND c.is_active = true
    )
  );

CREATE POLICY forum_posts_own_update
  ON public.forum_posts
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND status = 'visible'::text
  )
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT ON TABLE public.forum_categories TO anon;
GRANT SELECT ON TABLE public.forum_categories TO authenticated;

GRANT SELECT ON TABLE public.forum_topics TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.forum_topics TO authenticated;

GRANT SELECT ON TABLE public.forum_posts TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.forum_posts TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.forum_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.forum_topics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.forum_posts TO service_role;

COMMIT;
