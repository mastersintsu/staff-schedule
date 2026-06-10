-- ユーザープロフィール（Supabase Authと連携）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "自分のプロフィールは誰でも読める" on public.profiles for select using (true);
create policy "自分のプロフィールのみ更新可" on public.profiles for update using (auth.uid() = id);

-- 新規ユーザー登録時に自動でprofilesレコード作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- シフト
create table public.shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  note text,
  created_at timestamptz default now()
);
alter table public.shifts enable row level security;
create policy "全員シフトを読める" on public.shifts for select using (true);
create policy "管理者のみシフト作成・更新・削除可" on public.shifts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 勤怠打刻
create table public.attendances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clock_in timestamptz,
  clock_out timestamptz,
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table public.attendances enable row level security;
create policy "自分の勤怠は自分で読める" on public.attendances for select using (
  auth.uid() = user_id or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "自分の勤怠は自分で打刻可" on public.attendances for insert with check (auth.uid() = user_id);
create policy "自分の勤怠は自分で更新可" on public.attendances for update using (auth.uid() = user_id);

-- プロジェクト
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "全員プロジェクトを読める" on public.projects for select using (true);
create policy "管理者のみ作成・更新可" on public.projects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- タスク
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "全員タスクを読める" on public.tasks for select using (true);
create policy "担当者は自分のタスクを更新可" on public.tasks for update using (
  auth.uid() = assigned_to or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "管理者のみタスク作成・削除可" on public.tasks for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "管理者のみタスク削除可" on public.tasks for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- updated_at 自動更新
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.update_updated_at();
