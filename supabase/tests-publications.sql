-- Synthetic editorial fixtures, no files or messages, always rolled back.
begin;
create temporary table pub_fixture(id uuid default gen_random_uuid());
insert into pub_fixture default values;
insert into auth.users(id,email) select id,'publications-test@example.invalid' from pub_fixture;
insert into public.profiles(id,email,display_name,role) select id,'publications-test@example.invalid','Teste Comunicação','communications' from pub_fixture;
insert into public.news(title,body,status,published_at,created_by,updated_by)
select 'Teste '||state,'Texto',state,now()+delta,id,id from pub_fixture cross join (values ('published',interval '-1 day'),('published',interval '1 day'),('draft',interval '-1 day'),('archived',interval '-1 day')) as s(state,delta);
insert into public.events(title,description,location,starts_at,status,created_by,updated_by)
select 'Teste '||state,'Texto','Sede',now()+interval '1 day',state,id,id from pub_fixture cross join (values ('published'),('draft'),('archived')) s(state);
insert into public.campaigns(title,body,status,published_at,created_by,updated_by)
select 'Teste '||state,'Texto',state,now()+delta,id,id from pub_fixture cross join (values ('published',interval '-1 day'),('published',interval '1 day'),('draft',interval '-1 day'),('archived',interval '-1 day')) as s(state,delta);
set local role anon;
do $$ begin
 if (select count(id) from public.news where title like 'Teste %')<>1 then raise exception 'Anonymous news exposure';end if;
 if (select count(id) from public.events where title like 'Teste %')<>1 then raise exception 'Anonymous events exposure';end if;
 if (select count(id) from public.campaigns where title like 'Teste %')<>1 then raise exception 'Anonymous campaign exposure';end if;
 begin perform created_by from public.news; raise exception 'Author IDs exposed'; exception when insufficient_privilege then null; end;
 begin perform id from public.profiles; raise exception 'Profiles exposed'; exception when insufficient_privilege then null; end;
 begin perform id from public.visit_reports; raise exception 'Reports exposed'; exception when insufficient_privilege then null; end;
 if exists(select 1 from storage.objects where bucket_id='visit-reports') then raise exception 'Files exposed';end if;
 begin update public.campaigns set title='Alterado';raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from pub_fixture),true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.campaigns where title like 'Teste %')<>4 then raise exception 'Editor cannot see drafts';end if;
 begin update public.campaigns set title='Alterado';raise exception 'Client direct write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set active=false where id in(select id from pub_fixture);
set local role authenticated;
do $$ begin
 if (select count(*) from public.campaigns where title like 'Teste %')<>1 then raise exception 'Inactive editor can see drafts';end if;
end $$;
reset role;
rollback;
