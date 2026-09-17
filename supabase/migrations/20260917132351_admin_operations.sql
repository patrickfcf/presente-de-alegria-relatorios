alter table public.profiles add column clown_name text not null default '' check(length(clown_name)<=100), add column phone text not null default '' check(phone='' or phone ~ '^\+[0-9]{10,15}$');
create function public.manage_profile(p_actor uuid,p_target uuid,p_name text,p_email text,p_role text,p_active boolean,p_cell uuid,p_clown text,p_phone text) returns void
language plpgsql security invoker set search_path='' as $$
declare old public.profiles;
begin
 if not exists(select 1 from public.profiles where id=p_actor and active and role in ('admin','director')) then raise exception 'forbidden'; end if;
 select * into old from public.profiles where id=p_target for update;
 if exists(select 1 from public.profiles where id=p_actor and role='director') and (p_role<>'coordinator' or (old.id is not null and old.role<>'coordinator')) then raise exception 'forbidden'; end if;
 if old.role='admin' or p_actor=p_target or (old.id is not null and old.email<>p_email) or p_role not in ('coordinator','director') then raise exception 'protected_account'; end if;
 if p_role='coordinator' and not exists(select 1 from public.cells where id=p_cell and active) then raise exception 'invalid_cell'; end if;
 insert into public.profiles(id,display_name,email,role,active,clown_name,phone) values(p_target,p_name,p_email,p_role,p_active,p_clown,p_phone)
 on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active,clown_name=excluded.clown_name,phone=excluded.phone;
 update public.cell_memberships set active=false,is_default=false where profile_id=p_target;
 if p_role='coordinator' then
 insert into public.cell_memberships(profile_id,cell_id,active,is_default) values(p_target,p_cell,true,true)
 on conflict(profile_id,cell_id) do update set active=true,is_default=true;
 end if;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'profile_saved',p_target);
end $$;
revoke all on function public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text) from public,anon,authenticated;
grant execute on function public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text) to service_role;

create table public.news (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 3 and 160),
 body text not null check(length(body) between 1 and 4000), published_at timestamptz not null default now(),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.events (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 3 and 160),
 description text not null check(length(description) between 1 and 4000), location text not null check(length(location) between 2 and 200),
 starts_at timestamptz not null, ends_at timestamptz check(ends_at is null or ends_at>starts_at),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index news_published_idx on public.news(published_at desc) where status='published';
create index events_starts_idx on public.events(starts_at) where status='published';
create index news_author_idx on public.news(created_by);
create index news_editor_idx on public.news(updated_by);
create index events_author_idx on public.events(created_by);
create index events_editor_idx on public.events(updated_by);
alter table public.news enable row level security;
alter table public.events enable row level security;
create policy news_read on public.news for select to authenticated using (
 (select private.current_role()) is not null and ((status='published' and published_at<=now()) or (select private.current_role()) in ('admin','director'))
);
create policy events_read on public.events for select to authenticated using (
 (select private.current_role()) is not null and (status='published' or (select private.current_role()) in ('admin','director'))
);
revoke all on public.news,public.events from anon,authenticated;
grant select on public.news,public.events to authenticated;
grant all on public.news,public.events to service_role;
