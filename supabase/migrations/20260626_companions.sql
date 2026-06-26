-- Companion Creation: one-time permanent choice of eye + gender + element
-- Run this in the Supabase SQL Editor at: https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql

create table if not exists companions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  eye        text not null,
  gender     text not null check (gender in ('male','female')),
  element    text not null check (element in ('fire','water','thunder','nature','shadow','light')),
  created_at timestamptz not null default now()
);

alter table companions enable row level security;

-- Read your own companion
create policy "companion_select_own" on companions
  for select using (auth.uid() = user_id);

-- Insert your own companion (once — PK prevents duplicates)
create policy "companion_insert_own" on companions
  for insert with check (auth.uid() = user_id);

-- NO update/delete policies → immutable from the client side

-- Idempotent create-once RPC: inserts only if the user has no row yet.
-- On conflict (race condition), returns the existing row unchanged.
create or replace function create_companion(p_eye text, p_gender text, p_element text)
returns companions language plpgsql security definer set search_path = public as $$
declare rec companions;
begin
  insert into companions(user_id, eye, gender, element)
  values (auth.uid(), p_eye, p_gender, p_element)
  on conflict (user_id) do nothing
  returning * into rec;

  -- If do-nothing triggered (row already existed), fetch it
  if rec.user_id is null then
    select * into rec from companions where user_id = auth.uid();
  end if;

  return rec;
end; $$;

revoke all on function create_companion(text,text,text) from public;
grant execute on function create_companion(text,text,text) to authenticated;
