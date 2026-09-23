-- ============================================================
-- 에이치메디솔루션 관리자 모드 · Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 전체 붙여넣고 Run
-- ============================================================

-- 1) 팝업
create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text, subtitle text, brand text, button_text text,
  image_url text, link_url text, bg_color text default '#0a1020',
  text_align text default 'left',
  show_on text default 'all',
  starts_at timestamptz, ends_at timestamptz,
  active boolean default true,
  sort int default 0
);

-- 2) 방문 이벤트 (개인정보 없음)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  type text not null,
  path text, referrer text, device text, screen_w int,
  session_id text, visitor_id text, popup_id text,
  utm jsonb, meta jsonb
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_type_idx on public.events (type);

-- 3) 보안 (RLS): 누구나 팝업 읽기 · 이벤트 쓰기, 관리자(로그인)만 나머지
alter table public.popups enable row level security;
alter table public.events enable row level security;

drop policy if exists "popups public read" on public.popups;
create policy "popups public read" on public.popups for select using (true);
drop policy if exists "popups admin write" on public.popups;
create policy "popups admin write" on public.popups for all to authenticated using (true) with check (true);

drop policy if exists "events public insert" on public.events;
create policy "events public insert" on public.events for insert to anon, authenticated with check (true);
drop policy if exists "events admin read" on public.events;
create policy "events admin read" on public.events for select to authenticated using (true);
drop policy if exists "events admin delete" on public.events;
create policy "events admin delete" on public.events for delete to authenticated using (true);

-- 4) 팝업 이미지 저장소 (공개 읽기, 로그인 사용자 업로드)
insert into storage.buckets (id, name, public) values ('popups', 'popups', true) on conflict (id) do nothing;
drop policy if exists "popup images public read" on storage.objects;
create policy "popup images public read" on storage.objects for select using (bucket_id = 'popups');
drop policy if exists "popup images admin write" on storage.objects;
create policy "popup images admin write" on storage.objects for all to authenticated using (bucket_id = 'popups') with check (bucket_id = 'popups');

-- 5) 관리자 계정: Authentication → Users → "Add user" 로 이메일/비밀번호 생성
--    (Authentication → Providers → Email 에서 "Confirm email" 을 끄면 바로 로그인 가능)
