-- =============================================================
-- BU Research Platform – Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- =============================================================

-- ----------------------------------------------------------------
-- 1. PROFILES (1:1 with auth.users)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'professor'
                    CHECK (role IN ('admin', 'professor')),
  slug            text UNIQUE,
  name_de         text,
  name_en         text,
  name_cn         text,
  title           text,
  position_de     text,
  position_en     text,
  position_cn     text,
  bio_de          text,
  bio_en          text,
  bio_cn          text,
  research_focus  text[]  DEFAULT '{}',
  photo_url       text,
  email           text,
  is_published    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. PUBLICATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  title       text NOT NULL,
  authors     text[] NOT NULL DEFAULT '{}',
  year        int NOT NULL,
  doi         text,
  url         text,
  type        text NOT NULL DEFAULT 'paper'
                CHECK (type IN ('paper', 'monograph', 'collection')),
  discipline  text NOT NULL DEFAULT 'science'
                CHECK (discipline IN ('science', 'arts')),
  journal     text,
  abstract    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publications_profile_id_idx ON public.publications (profile_id);
CREATE INDEX IF NOT EXISTS publications_year_idx ON public.publications (year DESC);

-- ----------------------------------------------------------------
-- 3. NEWS POSTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  title_de      text,
  title_en      text,
  title_cn      text,
  content_de    text,
  content_en    text,
  content_cn    text,
  category      text NOT NULL DEFAULT 'project'
                  CHECK (category IN ('exhibition', 'keynote', 'project', 'publication')),
  published_at  timestamptz,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_posts_profile_id_idx ON public.news_posts (profile_id);
CREATE INDEX IF NOT EXISTS news_posts_published_at_idx ON public.news_posts (published_at DESC);

-- ----------------------------------------------------------------
-- 4. MEDIA ITEMS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  url         text NOT NULL,
  type        text NOT NULL DEFAULT 'image'
                CHECK (type IN ('image', 'pdf')),
  caption_de  text,
  caption_en  text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_items_profile_id_idx ON public.media_items (profile_id);

-- ----------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---- PROFILES policies ----

-- Anyone can read published profiles
CREATE POLICY "Public read published profiles"
  ON public.profiles FOR SELECT
  USING (is_published = true);

-- Authenticated users can read their own profile (even unpublished)
CREATE POLICY "Self read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admin read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Professors update their own profile
CREATE POLICY "Self update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'professor');

-- Admins can update any profile (including role changes)
CREATE POLICY "Admin update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ---- PUBLICATIONS policies ----

-- Public: read publications of published profiles
CREATE POLICY "Public read publications"
  ON public.publications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = publications.profile_id
        AND profiles.is_published = true
    )
  );

-- Authenticated: read own publications
CREATE POLICY "Self read own publications"
  ON public.publications FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Admins read all
CREATE POLICY "Admin read all publications"
  ON public.publications FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Own insert
CREATE POLICY "Self insert own publications"
  ON public.publications FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Own update
CREATE POLICY "Self update own publications"
  ON public.publications FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- Own delete
CREATE POLICY "Self delete own publications"
  ON public.publications FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin all publications"
  ON public.publications FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- NEWS POSTS policies ----

CREATE POLICY "Public read published news"
  ON public.news_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Self read own news"
  ON public.news_posts FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self insert own news"
  ON public.news_posts FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Self update own news"
  ON public.news_posts FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self delete own news"
  ON public.news_posts FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admin all news"
  ON public.news_posts FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- MEDIA ITEMS policies ----

CREATE POLICY "Public read media of published profiles"
  ON public.media_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = media_items.profile_id
        AND profiles.is_published = true
    )
  );

CREATE POLICY "Self read own media"
  ON public.media_items FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self insert own media"
  ON public.media_items FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Self update own media"
  ON public.media_items FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self delete own media"
  ON public.media_items FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admin all media"
  ON public.media_items FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- 6. STORAGE BUCKET
-- ----------------------------------------------------------------
-- Run this in Storage > New Bucket (or via SQL):

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload to media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Allow owners to delete their own files
CREATE POLICY "Owner delete from media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- ----------------------------------------------------------------
-- 7. TRIGGER: auto-create profile on signup
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name_en, role, is_published)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'professor',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- 8. FIRST ADMIN (run manually after your first login)
-- ----------------------------------------------------------------
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-email@brand-university.de';

-- ----------------------------------------------------------------
-- 9. PHASE 1 EXTENSIONS (run once in Supabase SQL Editor)
-- ----------------------------------------------------------------

-- New columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orcid text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_scholar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scopus_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wos_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS researchgate_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_file_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_background jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]';

-- Featured flag on publications
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS url text;

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  role           text NOT NULL DEFAULT 'PI'
                   CHECK (role IN ('PI', 'Co-PI', 'Member', 'Other')),
  start_year     int,
  end_year       int,
  funding_source text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_profile_id_idx ON public.projects (profile_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = projects.profile_id
        AND profiles.is_published = true
    )
  );

CREATE POLICY "Self read own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Self update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Self delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admin all projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- 10. EURASIAN HUB PARTNERS (run once in Supabase SQL Editor)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hub_partners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  url         text,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hub_partners"
  ON public.hub_partners FOR SELECT
  USING (true);

CREATE POLICY "Admin all hub_partners"
  ON public.hub_partners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------
-- 11. RESEARCH CLUSTERS (run once in Supabase SQL Editor)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.research_clusters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read research_clusters"
  ON public.research_clusters FOR SELECT
  USING (true);

CREATE POLICY "Admin all research_clusters"
  ON public.research_clusters FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------
-- 12. EXHIBITIONS & AWARDS (run once in Supabase SQL Editor)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.exhibitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  venue        text,
  location     text,
  year         int,
  type         text NOT NULL DEFAULT 'Solo'
                 CHECK (type IN ('Solo', 'Group', 'Curated', 'Other')),
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read exhibitions"
  ON public.exhibitions FOR SELECT USING (true);
CREATE POLICY "Self manage exhibitions"
  ON public.exhibitions FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin all exhibitions"
  ON public.exhibitions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.awards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  awarding_body text,
  year          int,
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read awards"
  ON public.awards FOR SELECT USING (true);
CREATE POLICY "Self manage awards"
  ON public.awards FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin all awards"
  ON public.awards FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
