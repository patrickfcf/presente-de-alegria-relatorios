alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','director','coordinator','volunteer','communications'));
alter table public.profiles add column manager_id uuid references public.profiles(id), add column deleted_at timestamptz;
alter table public.profiles add constraint no_self_manager check(manager_id is null or manager_id<>id);
create index profiles_manager_idx on public.profiles(manager_id);

create or replace function private.can_read_cell(p_cell uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and p.deleted_at is null and
 (p.role in ('admin','director') or (p.role='coordinator' and exists(select 1 from public.cell_memberships m where m.profile_id=p.id and m.cell_id=p_cell and m.active))))
$$;
create or replace function private.current_role() returns text language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p where p.id=(select auth.uid()) and p.active and p.deleted_at is null and auth.uid() is not null
$$;
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
 (select private.current_role()) is not null and (id=(select auth.uid()) or (select private.current_role()) in ('admin','director')
 or ((select private.current_role())='coordinator' and manager_id=(select auth.uid()) and role='volunteer'))
);
drop policy memberships_read on public.cell_memberships;
create policy memberships_read on public.cell_memberships for select to authenticated using (
 (select private.current_role()) is not null and (profile_id=(select auth.uid()) or (select private.current_role()) in ('admin','director')
 or exists(select 1 from public.profiles p where p.id=profile_id and p.manager_id=(select auth.uid()) and p.role='volunteer'))
);

create table public.report_attendance (
 report_id uuid not null references public.visit_reports(id), volunteer_id uuid not null references public.profiles(id),
 volunteer_name text not null, clown_name text not null, status text not null check(status in ('present','absent')),
 justified boolean, primary key(report_id,volunteer_id),
 check((status='present' and justified is null) or (status='absent' and justified is not null))
);
create index attendance_volunteer_idx on public.report_attendance(volunteer_id);
alter table public.report_attendance enable row level security;
create policy attendance_read on public.report_attendance for select to authenticated using (
 exists(select 1 from public.visit_reports r where r.id=report_id and r.status='submitted' and private.can_read_cell(r.cell_id))
);
revoke all on public.report_attendance from anon,authenticated;
grant select on public.report_attendance to authenticated;
grant all on public.report_attendance to service_role;

-- Retire the old entrypoint so it cannot bypass the expanded hierarchy rules.
drop function public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text);
create function public.manage_profile(p_actor uuid,p_target uuid,p_name text,p_email text,p_role text,p_active boolean,p_cell uuid,p_clown text,p_phone text,p_manager uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare actor public.profiles; old public.profiles; manager public.profiles; resolved_cell uuid;
begin
 -- Serialize changes to reporting lines, including simultaneous replacements.
 perform pg_advisory_xact_lock(14782231);
 select * into actor from public.profiles where id=p_actor and active and deleted_at is null;
 select * into old from public.profiles where id=p_target for update;
 if actor.id is null or actor.role not in ('admin','director','coordinator') then raise exception 'forbidden'; end if;
 if old.role='admin' or p_actor=p_target or old.deleted_at is not null or (old.id is not null and old.email<>p_email)
 or p_role not in ('director','coordinator','volunteer','communications') then raise exception 'protected_account'; end if;
 if actor.role='director' and (p_role<>'coordinator' or p_manager<>p_actor or (old.id is not null and (old.role<>'coordinator' or old.manager_id is distinct from p_actor))) then raise exception 'forbidden'; end if;
 if actor.role='coordinator' and (p_role<>'volunteer' or p_manager<>p_actor or (old.id is not null and (old.role<>'volunteer' or old.manager_id is distinct from p_actor))) then raise exception 'forbidden'; end if;
 if old.id is not null and old.role<>p_role and exists(select 1 from public.profiles where manager_id=p_target and deleted_at is null) then raise exception 'replace_coordinator_first'; end if;
 if old.id is not null and not p_active and exists(select 1 from public.profiles where manager_id=p_target and active and deleted_at is null) then raise exception 'reassign_team_first'; end if;
 if p_role in ('coordinator','volunteer') then
  select * into manager from public.profiles where id=p_manager and active and deleted_at is null;
  if manager.id is null or manager.id=p_target or manager.role<>(case when p_role='coordinator' then 'director' else 'coordinator' end) then raise exception 'invalid_manager'; end if;
  if p_role='volunteer' then select cell_id into resolved_cell from public.cell_memberships where profile_id=p_manager and active and is_default;
  else resolved_cell:=p_cell; end if;
  if not exists(select 1 from public.cells where id=resolved_cell and active) then raise exception 'invalid_cell'; end if;
 elsif p_manager is not null then raise exception 'invalid_manager'; end if;
 insert into public.profiles(id,display_name,email,role,active,clown_name,phone,manager_id) values(p_target,p_name,p_email,p_role,p_active,p_clown,p_phone,p_manager)
 on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active,clown_name=excluded.clown_name,phone=excluded.phone,manager_id=excluded.manager_id;
 update public.cell_memberships set active=false,is_default=false where profile_id=p_target;
 if p_role in ('coordinator','volunteer') then
  insert into public.cell_memberships(profile_id,cell_id,active,is_default) values(p_target,resolved_cell,p_active,true)
  on conflict(profile_id,cell_id) do update set active=excluded.active,is_default=true;
 end if;
 -- Moving a coordinator's default cell also moves their current volunteer roster.
 if p_role='coordinator' then
  update public.cell_memberships set active=false,is_default=false where profile_id in(select id from public.profiles where manager_id=p_target and role='volunteer');
  insert into public.cell_memberships(profile_id,cell_id,active,is_default)
  select id,resolved_cell,active,true from public.profiles where manager_id=p_target and role='volunteer' and deleted_at is null
  on conflict(profile_id,cell_id) do update set active=excluded.active,is_default=true;
 end if;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'profile_saved',p_target);
end $$;

create function public.replace_coordinator(p_actor uuid,p_current uuid,p_successor uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare actor public.profiles; old public.profiles; successor public.profiles;
begin
 perform pg_advisory_xact_lock(14782231);
 select * into actor from public.profiles where id=p_actor and active and deleted_at is null;
 select * into old from public.profiles where id=p_current and active and role='coordinator' for update;
 select * into successor from public.profiles where id=p_successor and active and role='volunteer' for update;
 if actor.id is null or old.id is null or successor.id is null or successor.manager_id is distinct from old.id
 or not(actor.role='admin' or (actor.role='director' and old.manager_id=actor.id)) then raise exception 'forbidden'; end if;
 if old.manager_id is null then raise exception 'invalid_manager'; end if;
 update public.profiles set role='coordinator',manager_id=old.manager_id where id=successor.id;
 update public.profiles set manager_id=successor.id where manager_id=old.id and id<>successor.id;
 update public.profiles set role='volunteer',manager_id=successor.id where id=old.id;
 update public.cell_memberships set active=false,is_default=false where profile_id=successor.id;
 insert into public.cell_memberships(profile_id,cell_id,active,is_default)
 select successor.id,cell_id,active,is_default from public.cell_memberships where profile_id=old.id
 on conflict(profile_id,cell_id) do update set active=excluded.active,is_default=excluded.is_default;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'coordinator_replaced',old.id),(p_actor,'volunteer_promoted',successor.id);
end $$;

create function public.authorize_account_action(p_actor uuid,p_target uuid,p_action text) returns text
language plpgsql security invoker set search_path='' as $$
declare actor public.profiles; target public.profiles;
begin
 perform pg_advisory_xact_lock(14782231);
 select * into actor from public.profiles where id=p_actor and active and deleted_at is null;
 select * into target from public.profiles where id=p_target and deleted_at is null for update;
 if actor.id is null or target.id is null or actor.id=target.id or target.role='admin' or p_action not in ('reset','delete') then raise exception 'forbidden'; end if;
 if not(actor.role='admin' or (p_action='reset' and actor.role='coordinator' and target.role='volunteer' and target.manager_id=actor.id)) then raise exception 'forbidden'; end if;
 if p_action='delete' then
  if exists(select 1 from public.profiles where manager_id=p_target and deleted_at is null) then raise exception 'reassign_team_first'; end if;
  update public.profiles set active=false,deleted_at=now() where id=p_target;
  update public.cell_memberships set active=false,is_default=false where profile_id=p_target;
 elsif not target.active then raise exception 'inactive_account'; end if;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'account_'||p_action,p_target);
 return target.email;
end $$;
revoke all on function public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text,uuid),public.replace_coordinator(uuid,uuid,uuid),public.authorize_account_action(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text,uuid),public.replace_coordinator(uuid,uuid,uuid),public.authorize_account_action(uuid,uuid,text) to service_role;

create or replace function public.reserve_report(p_actor uuid,p_id uuid,p_hash text,p_form jsonb) returns public.visit_reports
language plpgsql security invoker set search_path='' as $$
declare c public.cells; p public.profiles; r public.visit_reports; period uuid; inst public.institutions; attendance jsonb;
begin
 perform pg_advisory_xact_lock(14782231);
 select * into p from public.profiles where id=p_actor and active;
 select * into c from public.cells where id=(p_form->>'cell_id')::uuid and active;
 if p.id is null or c.id is null or p.role not in ('admin','coordinator') or not (p.role='admin' or exists(select 1 from public.cell_memberships m
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
 attendance:=p_form->'attendance';
 if attendance is null or jsonb_typeof(attendance)<>'array' then raise exception 'invalid_attendance'; end if;
 if jsonb_array_length(attendance)>500 or exists(select 1 from jsonb_array_elements(attendance) a where
 a->>'status' not in ('present','absent') or (a->>'volunteer_id') is null or a->>'status' is null or
 (a->>'status'='absent' and jsonb_typeof(a->'justified') is distinct from 'boolean') or
 (a->>'status'='present' and a->>'justified' is not null)) then raise exception 'invalid_attendance'; end if;
 if (select count(distinct a->>'volunteer_id') from jsonb_array_elements(attendance) a)<>jsonb_array_length(attendance) then raise exception 'duplicate_attendance'; end if;
 if exists(select 1 from jsonb_array_elements(attendance) a where not exists(select 1 from public.profiles v join public.cell_memberships m on m.profile_id=v.id where v.id=(a->>'volunteer_id')::uuid and v.active and v.role='volunteer' and m.cell_id=c.id and m.active and (p.role='admin' or v.manager_id=p_actor))) then raise exception 'invalid_roster'; end if;
 if exists(select 1 from public.profiles v join public.cell_memberships m on m.profile_id=v.id where v.active and v.role='volunteer' and m.cell_id=c.id and m.active and (p.role='admin' or v.manager_id=p_actor) and not exists(select 1 from jsonb_array_elements(attendance) a where a->>'volunteer_id'=v.id::text)) then raise exception 'incomplete_attendance'; end if;
 delete from public.report_attendance where report_id=p_id;
 insert into public.report_attendance(report_id,volunteer_id,volunteer_name,clown_name,status,justified)
 select p_id,v.id,v.display_name,v.clown_name,a->>'status',(a->>'justified')::boolean from jsonb_array_elements(attendance) a join public.profiles v on v.id=(a->>'volunteer_id')::uuid;
 update public.visit_reports set lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',status='processing' where id=p_id returning * into r;
 return r;
end $$;


drop policy news_read on public.news;
create policy news_read on public.news for select to authenticated using (
 (select private.current_role()) is not null and ((status='published' and published_at<=now()) or (select private.current_role()) in ('admin','communications'))
);
drop policy events_read on public.events;
create policy events_read on public.events for select to authenticated using (
 (select private.current_role()) is not null and (status='published' or (select private.current_role()) in ('admin','communications'))
);
