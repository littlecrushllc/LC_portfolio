-- Little Crush Films — portfolio database schema.
-- Paste this whole block into Supabase → SQL Editor → Run.

create table if not exists films (
  id          text primary key,          -- Vimeo video id
  hash        text,                       -- Vimeo privacy hash (null for public)
  client      text,
  film        text,
  sectors     text[] default '{}',        -- multi-value
  "videoTypes" text[] default '{}',       -- multi-value (camelCase to match the app)
  "vimeoUrl"  text,                        -- private share link (Copy-link button)
  "playerUrl" text,                        -- embed player url
  title       text,
  thumbnail   text,
  duration    int,
  created_at  timestamptz default now()
);

-- Row Level Security: internal tool, so allow read + write via the public anon key.
alter table films enable row level security;

drop policy if exists "public read"   on films;
drop policy if exists "public insert" on films;
drop policy if exists "public update" on films;
drop policy if exists "public delete" on films;

create policy "public read"   on films for select using (true);
create policy "public insert" on films for insert with check (true);
create policy "public update" on films for update using (true);
create policy "public delete" on films for delete using (true);


-- ── Awards ──────────────────────────────────────────────────────────────────
-- One row per award/nomination. film_ids links it to every cut of its project
-- (a film can have several awards; an award can sit on several films). The app
-- aggregates these into compact counts ("14× Telly Awards"). To create AND seed
-- in one step, run supabase/awards_seed.sql instead of this block.
create table if not exists awards (
  id              bigint generated always as identity primary key,
  source          text,                    -- 'lc' (Little Crush) | 'career' (prior-studio honours)
  year            int,
  month           int,
  title           text,                     -- the award / category line
  award_body      text,                     -- e.g. "The Telly Awards"
  tier            text,                     -- Gold / Silver / Bronze / Winner / Finalist / Nominee / …
  client          text,
  associated_with text,                     -- prior studio for career honours (WSJ Custom Studios, WBD …)
  film_label      text,
  film_ids        text[] default '{}',      -- catalog film ids this award belongs to
  note            text,
  url             text,
  created_at      timestamptz default now()
);

alter table awards enable row level security;

drop policy if exists "public read"   on awards;
drop policy if exists "public insert" on awards;
drop policy if exists "public update" on awards;
drop policy if exists "public delete" on awards;

create policy "public read"   on awards for select using (true);
create policy "public insert" on awards for insert with check (true);
create policy "public update" on awards for update using (true);
create policy "public delete" on awards for delete using (true);
