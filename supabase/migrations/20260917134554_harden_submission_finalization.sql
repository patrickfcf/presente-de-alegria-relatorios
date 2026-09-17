create or replace function public.finalize_report(p_actor uuid,p_id uuid,p_lease uuid,p_pdf text,p_files text[],p_labels text[]) returns uuid
language plpgsql security invoker set search_path='' as $$
declare r public.visit_reports; prefix text;
begin
 select * into r from public.visit_reports where id=p_id for update;
 if r.id is null or r.created_by<>p_actor or r.lease_token is distinct from p_lease or p_lease is null or r.status<>'processing' then raise exception 'invalid_lease'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_actor and p.active and p.role in ('admin','coordinator') and
 (p.role='admin' or exists(select 1 from public.cell_memberships m where m.profile_id=p_actor and m.cell_id=r.cell_id and m.active))) then raise exception 'forbidden'; end if;
 prefix:=r.cell_id::text||'/'||r.id::text||'/'||p_lease::text||'/';
 if p_pdf is null or p_files is null or p_labels is null or p_pdf<>prefix||'report.pdf' or cardinality(p_files)<1 or cardinality(p_files)<>cardinality(p_labels)
 or exists(select 1 from unnest(p_files) f where not starts_with(f,prefix)) then raise exception 'invalid_files'; end if;
 update public.visit_reports set status='submitted',pdf_path=p_pdf,file_paths=p_files,file_labels=p_labels,submitted_at=now(),lease_until=null where id=p_id;
 insert into private.audit_events(actor_id,action,target_id) values(p_actor,'report_submitted',p_id);
 return p_id;
end $$;
