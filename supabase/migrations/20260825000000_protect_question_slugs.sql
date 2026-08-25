-- Preserve existing duplicate rows. This trigger prevents any new duplicate
-- question slugs and prevents updates from creating additional duplicates.
create or replace function public.prevent_duplicate_question_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Serialize writes for the same slug so concurrent inserts cannot both pass
  -- the duplicate check.
  perform pg_advisory_xact_lock(hashtextextended(new.slug, 0));

  if exists (
    select 1
    from public.questions
    where slug = new.slug
      and id is distinct from new.id
  ) then
    raise exception 'Question slug already exists: %', new.slug
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_question_slug on public.questions;

create trigger prevent_duplicate_question_slug
before insert or update of slug on public.questions
for each row
execute function public.prevent_duplicate_question_slug();
