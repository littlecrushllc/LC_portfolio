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
