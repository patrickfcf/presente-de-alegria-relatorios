create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.institutions (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.cells (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(name) between 2 and 100),
 institution_id uuid not null references public.institutions(id), active boolean not null default true,
 reporting_start date not null default date_trunc('month', now())::date,
 reporting_end date, expected_visits integer not null default 1 check(expected_visits between 1 and 31),
 created_at timestamptz not null default now(),
 check(extract(day from reporting_start)=1),
 check(reporting_end is null or (extract(day from reporting_end)=1 and reporting_end>=reporting_start))
);
create index cells_institution_idx on public.cells(institution_id);
create table public.profiles (
 id uuid primary key references auth.users(id), display_name text not null check(length(display_name) between 2 and 100),
 email text not null, role text not null default 'coordinator' check(role in ('coordinator','director','admin')),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.cell_memberships (
 profile_id uuid not null references public.profiles(id), cell_id uuid not null references public.cells(id),
 active boolean not null default true, is_default boolean not null default false,
 primary key(profile_id,cell_id)
);
create index memberships_cell_idx on public.cell_memberships(cell_id);
create unique index one_default_cell on public.cell_memberships(profile_id) where active and is_default;
create table public.report_periods (
 id uuid primary key default gen_random_uuid(), cell_id uuid not null references public.cells(id),
 month date not null check(extract(day from month)=1), expected_count int not null check(expected_count between 1 and 31),
 unique(cell_id,month), unique(id,cell_id)
);
create table public.visit_reports (
 id uuid primary key, period_id uuid not null, cell_id uuid not null references public.cells(id),
 institution_id uuid not null references public.institutions(id), created_by uuid not null references public.profiles(id),
 cell_name text not null, institution_name text not null, coordinator_name text not null,
 visit_date date not null, start_time time not null, end_time time not null check(end_time>start_time),
 professional_name text not null check(length(professional_name) between 2 and 100),
 professional_role text not null check(length(professional_role)<=100),
 professional_cpf text check(professional_cpf is null or professional_cpf ~ '^[0-9]{11}$'),
 beneficiaries int check(beneficiaries between 0 and 1000000), companions int check(companions between 0 and 1000000),
 local_team int check(local_team between 0 and 1000000), estimates boolean not null default false,
 signature_method text not null check(signature_method in ('canvas','paper')),
 declaration_version text not null default '2026-09-17',
 status text not null default 'processing' check(status in ('processing','failed','submitted')),
 content_hash text not null, lease_token uuid, lease_until timestamptz,
 pdf_path text, file_paths text[] not null default '{}', file_labels text[] not null default '{}',
 created_at timestamptz not null default now(), submitted_at timestamptz,
 foreign key(period_id,cell_id) references public.report_periods(id,cell_id),
 unique(cell_id,institution_id,visit_date,start_time),
 check(status<>'submitted' or (pdf_path is not null and submitted_at is not null and cardinality(file_paths)>0))
);
create index reports_period_idx on public.visit_reports(period_id);
create index reports_author_idx on public.visit_reports(created_by);
create index reports_institution_idx on public.visit_reports(institution_id);
create index reports_date_idx on public.visit_reports(visit_date desc);
create table private.audit_events (
 id bigint generated always as identity primary key, actor_id uuid, action text not null,
 target_id uuid, created_at timestamptz not null default now()
);
alter table private.audit_events enable row level security;

-- Read-only authorization helpers live in an unexposed schema. They use live profiles,
-- never editable JWT user_metadata, so deactivation applies to existing tokens too.
create function private.current_role() returns text language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p where p.id=(select auth.uid()) and p.active and auth.uid() is not null
$$;
create function private.can_read_cell(p_cell uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from public.profiles p where p.id=auth.uid() and p.active and
 (p.role in ('admin','director') or exists(select 1 from public.cell_memberships m where m.profile_id=p.id and m.cell_id=p_cell and m.active)))
$$;
revoke all on function private.current_role(), private.can_read_cell(uuid) from public;
grant execute on function private.current_role(), private.can_read_cell(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.cells enable row level security;
alter table public.institutions enable row level security;
alter table public.cell_memberships enable row level security;
alter table public.report_periods enable row level security;
alter table public.visit_reports enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (
 (select private.current_role()) is not null and (id=(select auth.uid()) or (select private.current_role()) in ('admin','director'))
);
create policy cells_read on public.cells for select to authenticated using (private.can_read_cell(id));
create policy institutions_read on public.institutions for select to authenticated using (
 (select private.current_role()) in ('admin','director') or exists(select 1 from public.cells c where c.institution_id=institutions.id and private.can_read_cell(c.id))
);
create policy memberships_read on public.cell_memberships for select to authenticated using (
 (select private.current_role()) is not null and (profile_id=(select auth.uid()) or (select private.current_role()) in ('admin','director'))
);
create policy periods_read on public.report_periods for select to authenticated using (private.can_read_cell(cell_id));
create policy reports_read on public.visit_reports for select to authenticated using (status='submitted' and private.can_read_cell(cell_id));
revoke all on public.profiles,public.cells,public.institutions,public.cell_memberships,public.report_periods,public.visit_reports from anon,authenticated;
grant select on public.profiles,public.cells,public.institutions,public.cell_memberships,public.report_periods,public.visit_reports to authenticated;
grant all on public.profiles,public.cells,public.institutions,public.cell_memberships,public.report_periods,public.visit_reports to service_role;
grant all on private.audit_events to service_role;
grant usage on all sequences in schema private to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('visit-reports','visit-reports',false,15728640,array['application/pdf','image/png','image/jpeg']);
create policy reports_files_read on storage.objects for select to authenticated using (
 bucket_id='visit-reports' and exists(select 1 from public.visit_reports r where r.status='submitted'
 and private.can_read_cell(r.cell_id) and (name=r.pdf_path or name=any(r.file_paths)))
);

-- Only the server can call the following operations. They are SECURITY INVOKER;
-- the service_role credential stays in Edge Functions and is never in the app.
create function public.ensure_report_periods(p_actor uuid,p_month date) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if extract(day from p_month)<>1 or p_month>date_trunc('month',timezone('America/Sao_Paulo',now()))::date then raise exception 'invalid_period'; end if;
 if not exists(select 1 from public.profiles where id=p_actor and active) then raise exception 'forbidden'; end if;
 insert into public.report_periods(cell_id,month,expected_count)
 select c.id,p_month,c.expected_visits from public.cells c where c.reporting_start<=p_month
 and (c.reporting_end is null or c.reporting_end>=p_month)
 and exists(select 1 from public.profiles p where p.id=p_actor and p.active and (p.role in ('admin','director')
 or exists(select 1 from public.cell_memberships m where m.profile_id=p_actor and m.cell_id=c.id and m.active)))
 on conflict(cell_id,month) do nothing;
end $$;

create function public.reserve_report(p_actor uuid,p_id uuid,p_hash text,p_form jsonb) returns public.visit_reports
language plpgsql security invoker set search_path='' as $$
declare c public.cells; p public.profiles; r public.visit_reports; period uuid; inst public.institutions;
begin
 select * into p from public.profiles where id=p_actor and active;
 select * into c from public.cells where id=(p_form->>'cell_id')::uuid and active;
 if p.id is null or c.id is null or not (p.role='admin' or exists(select 1 from public.cell_memberships m
 where m.profile_id=p_actor and m.cell_id=c.id and m.active)) then raise exception 'forbidden'; end if;
 select * into inst from public.institutions where id=c.institution_id and active;
 if inst.id is null then raise exception 'inactive_institution'; end if;
 if (p_form->>'visit_date')::date>timezone('America/Sao_Paulo',now())::date then raise exception 'future_visit'; end if;
 perform public.ensure_report_periods(p_actor,date_trunc('month',(p_form->>'visit_date')::date)::date);
 select id into period from public.report_periods where cell_id=c.id and month=date_trunc('month',(p_form->>'visit_date')::date)::date;
 if period is null then raise exception 'outside_reporting_period'; end if;
 insert into public.visit_reports(id,period_id,cell_id,institution_id,created_by,cell_name,institution_name,coordinator_name,
 visit_date,start_time,end_time,professional_name,professional_role,professional_cpf,beneficiaries,companions,local_team,estimates,signature_method,content_hash)
 values(p_id,period,c.id,inst.id,p_actor,c.name,inst.name,p.display_name,(p_form->>'visit_date')::date,
 (p_form->>'start_time')::time,(p_form->>'end_time')::time,p_form->>'professional_name',p_form->>'professional_role',nullif(p_form->>'professional_cpf',''),
 (p_form->>'beneficiaries')::int,(p_form->>'companions')::int,(p_form->>'local_team')::int,(p_form->>'estimates')::boolean,p_form->>'signature_method',p_hash)
 on conflict(id) do nothing;
 select * into r from public.visit_reports where id=p_id for update;
 if r.created_by<>p_actor or r.content_hash<>p_hash then raise exception 'idempotency_conflict'; end if;
 if r.status='submitted' then return r; end if;
 if r.lease_until>now() then raise exception 'submission_busy'; end if;
 update public.visit_reports set lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',status='processing' where id=p_id returning * into r;
 return r;
end $$;

create function public.finalize_report(p_actor uuid,p_id uuid,p_lease uuid,p_pdf text,p_files text[],p_labels text[]) returns uuid
language plpgsql security invoker set search_path='' as $$
declare r public.visit_reports; prefix text;
begin
 select * into r from public.visit_reports where id=p_id for update;
 if r.id is null or r.created_by<>p_actor or r.lease_token<>p_lease or r.status<>'processing' then raise exception 'invalid_lease'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_actor and p.active and
 (p.role='admin' or exists(select 1 from public.cell_memberships m where m.profile_id=p_actor and m.cell_id=r.cell_id and m.active))) then raise exception 'forbidden'; end if;
 prefix:=r.cell_id::text||'/'||r.id::text||'/'||p_lease::text||'/';
 if p_pdf<>prefix||'report.pdf' or cardinality(p_files)<1 or cardinality(p_files)<>cardinality(p_labels)
 or exists(select 1 from unnest(p_files) f where not starts_with(f,prefix)) then raise exception 'invalid_files'; end if;
 update public.visit_reports set status='submitted',pdf_path=p_pdf,file_paths=p_files,file_labels=p_labels,submitted_at=now(),lease_until=null where id=p_id;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'report_submitted',p_id);
 return p_id;
end $$;
revoke all on function public.ensure_report_periods(uuid,date),public.reserve_report(uuid,uuid,text,jsonb),public.finalize_report(uuid,uuid,uuid,text,text[],text[]) from public,anon,authenticated;
grant execute on function public.ensure_report_periods(uuid,date),public.reserve_report(uuid,uuid,text,jsonb),public.finalize_report(uuid,uuid,uuid,text,text[],text[]) to service_role;
