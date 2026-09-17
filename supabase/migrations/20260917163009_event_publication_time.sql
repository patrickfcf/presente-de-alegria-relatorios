-- Record first publication, independently of the date the event takes place.
alter table public.events add column published_at timestamptz;
update public.events set published_at=created_at where status='published';
create function private.stamp_event_publication() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP='UPDATE' then
    new.published_at := old.published_at;
  else
    new.published_at := null;
  end if;
  if new.status='published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_event_publication() from public,anon,authenticated;
create trigger stamp_event_publication before insert or update on public.events
for each row execute function private.stamp_event_publication();
grant select(published_at) on public.events to anon;
