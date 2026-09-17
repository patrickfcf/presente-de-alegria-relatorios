-- Disposable synthetic fixtures. This entire script MUST run in one transaction.
-- It writes no actual files, sends no email, and ends in ROLLBACK.
begin;
create temporary table fixture_ids(key text primary key,id uuid not null default gen_random_uuid());
insert into fixture_ids(key) values('admin'),('director'),('director2'),('coordinator'),('coordinator2'),('volunteer'),('volunteer2'),('communications'),('institution'),('cell'),('cell2'),('report'),('report2');
grant select on fixture_ids to authenticated;
insert into auth.users(id,email) select id,key||'@example.invalid' from fixture_ids where key in ('admin','director','director2','coordinator','coordinator2','volunteer','volunteer2','communications');
insert into public.profiles(id,email,display_name,role,clown_name) select id,key||'@example.invalid','Teste '||key,regexp_replace(key,'[0-9]','','g'),'Teste' from fixture_ids where key in ('admin','director','director2','coordinator','coordinator2','volunteer','volunteer2','communications');
update public.profiles set manager_id=(select id from fixture_ids where key='director') where id=(select id from fixture_ids where key='coordinator');
update public.profiles set manager_id=(select id from fixture_ids where key='director2') where id=(select id from fixture_ids where key='coordinator2');
update public.profiles set manager_id=(select id from fixture_ids where key='coordinator') where id=(select id from fixture_ids where key='volunteer');
update public.profiles set manager_id=(select id from fixture_ids where key='coordinator2') where id=(select id from fixture_ids where key='volunteer2');
insert into public.institutions(id,name) select id,'Instituição de teste' from fixture_ids where key='institution';
insert into public.cells(id,name,institution_id,reporting_start) select id,'Teste '||key,(select id from fixture_ids where key='institution'),'2026-01-01' from fixture_ids where key in ('cell','cell2');
insert into public.cell_memberships(profile_id,cell_id,is_default) select p.id,c.id,true from fixture_ids p join fixture_ids c on c.key=case when p.key in ('coordinator','volunteer') then 'cell' else 'cell2' end where p.key in ('coordinator','volunteer','coordinator2','volunteer2');
do $$
declare a uuid; c uuid; r uuid; v uuid; form jsonb; reserved public.visit_reports; blocked boolean; prefix text;
begin
 for a,c,r,v in select p.id,c.id,r.id,v.id from fixture_ids p join fixture_ids c on c.key=case when p.key='coordinator' then 'cell' else 'cell2' end join fixture_ids r on r.key=case when p.key='coordinator' then 'report' else 'report2' end join fixture_ids v on v.key=case when p.key='coordinator' then 'volunteer' else 'volunteer2' end where p.key in ('coordinator','coordinator2') loop
  form:=jsonb_build_object('cell_id',c,'visit_date','2026-01-15','start_time','10:00','end_time','12:00','professional_name','Profissional de teste','professional_role','','professional_cpf','','beneficiaries',12,'companions',null,'local_team',3,'estimates',false,'signature_method','paper','attendance',jsonb_build_array(jsonb_build_object('volunteer_id',v,'status','present','justified',null)));
  select * into reserved from public.reserve_report(a,r,'synthetic-test',form);
  blocked:=false;begin perform public.reserve_report(a,r,'synthetic-test',form);exception when others then if sqlerrm='submission_busy' then blocked:=true;else raise;end if;end;
  if not blocked then raise exception 'Concurrent submission was not rejected';end if;
  blocked:=false;begin perform public.finalize_report(a,r,null,'invalid',array['invalid'],array['test']);exception when others then if sqlerrm='invalid_lease' then blocked:=true;else raise;end if;end;
  if not blocked then raise exception 'Null lease was accepted';end if;
  update public.visit_reports set status='failed',lease_until=null where id=r;
  form:=jsonb_set(form,'{professional_name}','"Profissional corrigido"');
  select * into reserved from public.reserve_report(a,r,'corrected-test',form);
  if reserved.professional_name<>'Profissional corrigido' then raise exception 'Failed submission cannot be corrected';end if;
  prefix:=c::text||'/'||r::text||'/'||reserved.lease_token::text||'/';
  perform public.finalize_report(a,r,reserved.lease_token,prefix||'report.pdf',array[prefix||'original.pdf'],array['Documento de teste']);
  insert into storage.objects(bucket_id,name) values('visit-reports',prefix||'report.pdf');
  select * into reserved from public.reserve_report(a,r,'corrected-test',form);
  if reserved.status<>'submitted' then raise exception 'Retry not idempotent';end if;
  blocked:=false;begin perform public.reserve_report(a,gen_random_uuid(),'another',form);exception when unique_violation then blocked:=true;end;
  if not blocked then raise exception 'Duplicate visit accepted';end if;
 end loop;
end $$;
insert into public.news(title,body,status,created_by,updated_by) select 'Teste de rascunho','Texto sintético','draft',id,id from fixture_ids where key='communications';
select set_config('request.jwt.claim.sub',(select id::text from fixture_ids where key='coordinator'),true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.visit_reports)<>1 then raise exception 'Coordinator cross-cell exposure';end if;
 if (select count(*) from public.report_attendance)<>1 then raise exception 'Attendance exposure';end if;
 if (select count(*) from storage.objects where bucket_id='visit-reports')<>1 then raise exception 'File exposure';end if;
 if (select count(*) from public.profiles)<>2 then raise exception 'Team contact exposure';end if;
 if (select count(*) from public.news)<>0 then raise exception 'Coordinator draft exposure';end if;
 if has_table_privilege(current_user,'public.profiles','UPDATE') then raise exception 'Self escalation possible';end if;
 if has_function_privilege(current_user,'public.manage_profile(uuid,uuid,text,text,text,boolean,uuid,text,text,uuid)','EXECUTE') then raise exception 'Privileged RPC exposed';end if;
end $$;
reset role;
update public.profiles set active=false where id=(select id from fixture_ids where key='coordinator');
set local role authenticated;
do $$ begin if exists(select 1 from public.visit_reports) or exists(select 1 from storage.objects where bucket_id='visit-reports') then raise exception 'Deactivated token still has access';end if;end $$;
reset role;
update public.profiles set active=true where id=(select id from fixture_ids where key='coordinator');
select set_config('request.jwt.claim.sub',(select id::text from fixture_ids where key='volunteer'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.visit_reports) or exists(select 1 from public.report_attendance) or exists(select 1 from storage.objects where bucket_id='visit-reports') then raise exception 'Volunteer private report exposure';end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Volunteer contact exposure';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from fixture_ids where key='communications'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.visit_reports) or exists(select 1 from public.report_attendance) then raise exception 'Communications private report exposure';end if;
 if (select count(*) from public.news)<>1 then raise exception 'Communications cannot read drafts';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from fixture_ids where key='director'),true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.visit_reports)<>2 then raise exception 'Director report access missing';end if;
 if exists(select 1 from public.news) then raise exception 'Director draft exposure';end if;
end $$;
reset role;
do $$
declare actor uuid; current_coordinator uuid; successor uuid; blocked boolean;
begin
 select id into actor from fixture_ids where key='director';select id into current_coordinator from fixture_ids where key='coordinator';select id into successor from fixture_ids where key='volunteer';
 blocked:=false;begin perform public.replace_coordinator(current_coordinator,current_coordinator,successor);exception when others then if sqlerrm='forbidden' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'Coordinator self promotion allowed';end if;
 blocked:=false;begin perform public.replace_coordinator((select id from fixture_ids where key='director2'),current_coordinator,successor);exception when others then if sqlerrm='forbidden' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'Director changed another team';end if;
 perform public.replace_coordinator(actor,current_coordinator,successor);
 if not exists(select 1 from public.profiles where id=successor and role='coordinator' and manager_id=actor) or not exists(select 1 from public.profiles where id=current_coordinator and role='volunteer' and manager_id=successor) then raise exception 'Replacement incomplete';end if;
 if (select count(*) from public.report_attendance)<>2 or (select count(*) from public.visit_reports where status='submitted')<>2 then raise exception 'Historical records changed';end if;
end $$;
select 'PASS: cell/file isolation, five roles, deactivation, duplicate and retry protection, null lease, hierarchy replacement, history retention' as result;
rollback;
