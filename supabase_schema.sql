-- Run this in your Supabase SQL Editor to set up the cloud saves table.

create table if not exists cloud_saves (
  id          uuid        default gen_random_uuid() primary key,
  slot_name   text        not null unique,
  char_name   text,
  level       integer     default 1,
  cls         text        default 'rogue',
  save_data   jsonb       not null,
  pin         text,
  protected   boolean     default false,
  updated_at  timestamptz default now()
);

-- Index for fast slot lookups
create index if not exists idx_cloud_saves_slot on cloud_saves (slot_name);

-- Allow anonymous read/write (anon key) — RLS disabled for simplicity.
-- If you want row-level security, enable RLS and write policies.
alter table cloud_saves disable row level security;
