
-- Migration: Add trigger to generate thumbnails on image upload

-- 1. Create the trigger function
create or replace function public.handle_new_image_for_thumbnail()
returns trigger
language plpgsql
security definer -- The function will run with the permissions of the user that defined it (the postgres user).
set search_path = public
as $$
declare
  request_id bigint;
begin
  -- Check if the uploaded file is in a path that should be processed.
  -- This avoids triggering on thumbnails themselves or other file types.
  -- We are targeting files in 'user_photos/'.
  if new.name like 'user_photos/%' then
    -- Asynchronously call the thumbnail-generator edge function.
    -- The function is running locally on the default port 54321.
    select
      net.http_post(
        url:='http://localhost:54321/thumbnail-generator',  -- URL of the locally served edge function
        body:=jsonb_build_object(
          'type', 'INSERT',
          'table', 'objects',
          'schema', 'storage',
          'record', row_to_json(new)
        ),
        headers:='{
          "Content-Type": "application/json",
          "Authorization": "Bearer ' || current_setting('request.jwt.claim.raw', true) || '"
        }'::jsonb
      )
    into request_id;
  end if;

  return new;
end;
$$;

-- 2. Create the trigger
-- Drop trigger first if it exists to make this script idempotent
drop trigger if exists on_new_image_upload on storage.objects;

create trigger on_new_image_upload
  after insert on storage.objects
  for each row execute procedure public.handle_new_image_for_thumbnail();

-- 3. Enable pg_net extension if not already enabled
-- This is necessary to make HTTP requests from within the database.
create extension if not exists pg_net with schema extensions;
