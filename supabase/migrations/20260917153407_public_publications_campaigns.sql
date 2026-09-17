-- Public editorial content only. No changes to private reports, people or storage.
alter table public.news add column details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=5000);
alter table public.events add column details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=5000);
create table public.campaigns (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(title) between 3 and 160),
 body text not null check(length(body) between 1 and 4000),
 published_at timestamptz not null default now(),
 ends_at timestamptz check(ends_at is null or ends_at>published_at),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=5000),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.campaigns enable row level security;
create index campaigns_published_idx on public.campaigns(published_at desc) where status='published';
create index campaigns_author_idx on public.campaigns(created_by);
create index campaigns_editor_idx on public.campaigns(updated_by);
revoke all on public.campaigns from anon,authenticated;
grant select on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
-- Existing editorial permissions stay limited to active publishers.
drop policy news_read on public.news;
drop policy events_read on public.events;
create policy news_read on public.news for select to authenticated using ((status='published' and published_at<=now()) or (select private.current_role()) in ('admin','communications'));
create policy events_read on public.events for select to authenticated using (status='published' or (select private.current_role()) in ('admin','communications'));
create policy campaigns_read on public.campaigns for select to authenticated using ((status='published' and published_at<=now()) or (select private.current_role()) in ('admin','communications'));
create policy news_public on public.news for select to anon using(status='published' and published_at<=now());
create policy events_public on public.events for select to anon using(status='published');
create policy campaigns_public on public.campaigns for select to anon using(status='published' and published_at<=now());
-- Public readers cannot select internal author/editor identifiers or write anything.
grant select(id,title,body,published_at,status,details) on public.news to anon;
grant select(id,title,description,location,starts_at,ends_at,status,details) on public.events to anon;
grant select(id,title,body,published_at,ends_at,status,details) on public.campaigns to anon;
