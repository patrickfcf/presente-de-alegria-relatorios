-- A failed/expired attempt can be corrected under the same ID; submitted reports remain immutable.
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
 if r.created_by<>p_actor then raise exception 'forbidden'; end if;
 if r.status='submitted' then
  if r.content_hash<>p_hash then raise exception 'idempotency_conflict'; end if;
  return r;
 end if;
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
 update public.visit_reports set period_id=period,cell_id=c.id,institution_id=inst.id,cell_name=c.name,institution_name=inst.name,coordinator_name=p.display_name,
 visit_date=(p_form->>'visit_date')::date,start_time=(p_form->>'start_time')::time,end_time=(p_form->>'end_time')::time,
 professional_name=p_form->>'professional_name',professional_role=p_form->>'professional_role',professional_cpf=nullif(p_form->>'professional_cpf',''),
 beneficiaries=(p_form->>'beneficiaries')::int,companions=(p_form->>'companions')::int,local_team=(p_form->>'local_team')::int,
 estimates=(p_form->>'estimates')::boolean,signature_method=p_form->>'signature_method',content_hash=p_hash,lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',status='processing' where id=p_id returning * into r;
 return r;
end $$;

