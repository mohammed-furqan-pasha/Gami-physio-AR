-- ============================================================
-- GamiPhysio AR — Supabase Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── ENUM types ────────────────────────────────────────────────
create type body_part as enum ('neck', 'back', 'shoulders', 'knees', 'ankles');
create type severity_level as enum ('mild', 'moderate', 'severe');
create type user_mode as enum ('solo', 'guardian');

-- ══════════════════════════════════════════════════════════════
-- TABLE: profiles
-- One row per anonymous session/device (no auth for now).
-- ══════════════════════════════════════════════════════════════
create table if not exists profiles (
  id            uuid primary key default uuid_generate_v4(),
  display_name  text not null default 'Athlete',
  total_points  integer not null default 0,
  streak_days   integer not null default 0,
  last_active   date,
  created_at    timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLE: exercises
-- Gold Standard biomechanical exercise library.
-- Loaded from seed.sql; also writable by OCR pipeline.
-- ══════════════════════════════════════════════════════════════
create table if not exists exercises (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  body_part       body_part not null,
  severity        severity_level not null,

  -- Biomechanical targets stored as JSONB for flexibility
  -- Example: { "joint": "knee", "min_angle": 90, "max_angle": 140, "hold_seconds": 2 }
  angle_config    jsonb not null default '{}',

  -- Movement keywords for OCR → exercise mapping
  -- Example: ["flexion", "bend", "extension"]
  keywords        text[] not null default '{}',

  -- Relative path inside /public/gifs/
  gif_asset       text,

  -- Metadata
  description     text,
  target_reps     integer not null default 5,
  target_sets     integer not null default 3,
  tempo_seconds   integer not null default 3,   -- seconds per rep
  requires_guardian boolean not null default false,

  created_at      timestamptz not null default now(),

  unique(name, body_part, severity)
);

-- Full-text search index on keywords
create index if not exists idx_exercises_keywords
  on exercises using gin(keywords);

create index if not exists idx_exercises_body_severity
  on exercises(body_part, severity);

-- ══════════════════════════════════════════════════════════════
-- TABLE: sessions
-- Each completed (or abandoned) AR session.
-- ══════════════════════════════════════════════════════════════
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references profiles(id) on delete cascade,
  exercise_id     uuid references exercises(id) on delete set null,

  mode            user_mode not null default 'solo',
  severity        severity_level not null,

  -- Scoring
  total_score     integer not null default 0,
  reps_completed  integer not null default 0,
  target_reps     integer not null default 5,
  rep_scores      jsonb not null default '[]',  -- array of 1-5 per rep: [5,4,5,3,5]

  -- Quality flags
  jitter_pauses   integer not null default 0,   -- how many rest-prompts were triggered
  voice_stops     integer not null default 0,   -- how many STOP/HELP commands fired
  overachieved    boolean not null default false,
  overachieve_bonus integer not null default 0,

  -- Timing
  duration_seconds integer,
  session_date    date not null default current_date,

  completed_at    timestamptz default now(),
  created_at      timestamptz not null default now()
);

create index if not exists idx_sessions_profile_date
  on sessions(profile_id, session_date desc);

create index if not exists idx_sessions_date
  on sessions(session_date desc);

-- ══════════════════════════════════════════════════════════════
-- TABLE: report_extractions
-- Stores Gemini OCR output per upload (then can be deleted).
-- ══════════════════════════════════════════════════════════════
create table if not exists report_extractions (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references profiles(id) on delete cascade,

  -- Raw Gemini output
  raw_gemini_json jsonb,

  -- Mapped result
  detected_body_part  body_part,
  detected_severity   severity_level,
  matched_exercise_ids uuid[],
  extraction_notes    text,

  -- Privacy: mark for deletion after user confirms plan
  purge_ready     boolean not null default false,

  created_at      timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════
-- FUNCTION: update_profile_on_session
-- Auto-updates total_points, streak_days, last_active
-- after each session insert.
-- ══════════════════════════════════════════════════════════════
create or replace function update_profile_on_session()
returns trigger language plpgsql as $$
declare
  last_date date;
begin
  -- Get current last_active
  select last_active into last_date
  from profiles where id = NEW.profile_id;

  -- Update points
  update profiles
  set
    total_points = total_points + NEW.total_score + NEW.overachieve_bonus,
    last_active  = NEW.session_date,
    streak_days  = case
      when last_date = NEW.session_date - interval '1 day'
        then streak_days + 1
      when last_date = NEW.session_date
        then streak_days          -- same day, no change
      else 1                      -- streak broken, reset
    end
  where id = NEW.profile_id;

  return NEW;
end;
$$;

create trigger trg_update_profile_on_session
  after insert on sessions
  for each row execute function update_profile_on_session();

-- ══════════════════════════════════════════════════════════════
-- VIEW: daily_summary
-- Used by the Profile Calendar heatmap.
-- ══════════════════════════════════════════════════════════════
create or replace view daily_summary as
select
  profile_id,
  session_date,
  count(*)::integer                     as session_count,
  sum(total_score + overachieve_bonus)::integer as day_points,
  sum(reps_completed)::integer          as total_reps,
  max(completed_at)                     as last_session_at
from sessions
group by profile_id, session_date;

-- ══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- Anon mode: all reads/writes allowed on all tables.
-- Swap these policies when you add auth later.
-- ══════════════════════════════════════════════════════════════
alter table profiles           enable row level security;
alter table exercises          enable row level security;
alter table sessions           enable row level security;
alter table report_extractions enable row level security;

-- Open policies for anon (replace with auth.uid() checks later)
create policy "anon_all_profiles"
  on profiles for all using (true) with check (true);

create policy "anon_all_exercises"
  on exercises for all using (true) with check (true);

create policy "anon_all_sessions"
  on sessions for all using (true) with check (true);

create policy "anon_all_extractions"
  on report_extractions for all using (true) with check (true);
