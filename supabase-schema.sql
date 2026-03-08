-- ============================================================
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create messages table
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  text        text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_email  text not null
);

-- 2. Enable Row Level Security
alter table public.messages enable row level security;

-- 3. Policy: authenticated users can read all messages
create policy "Authenticated users can read messages"
  on public.messages
  for select
  using (auth.role() = 'authenticated');

-- 4. Policy: users can only insert their own messages
create policy "Users can insert their own messages"
  on public.messages
  for insert
  with check (auth.uid() = user_id);

-- 5. Enable Realtime for the messages table
-- Go to: Supabase Dashboard → Database → Replication
-- Then enable "messages" table under "Source" replication

-- OR run this:
alter publication supabase_realtime add table public.messages;
