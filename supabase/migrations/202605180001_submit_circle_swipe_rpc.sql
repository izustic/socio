-- Joiners cannot UPDATE circles directly (RLS: creator-only).
-- Host swipes use submitSwipe from the client; joiner swipes use this RPC.

create or replace function public.submit_circle_swipe(
  p_circle_id text,
  p_liked boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_uuid uuid := auth.uid();
  v_user_text text := auth.uid()::text;
  v_row public.circles%rowtype;
  v_pending jsonb;
  v_skipped jsonb;
  v_members uuid[];
  v_size integer;
  v_user_pending jsonb;
  v_host_pending jsonb;
  v_mutual boolean := false;
  v_added boolean := false;
  v_complete boolean := false;
begin
  if v_user_uuid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.circles
  where id::text = p_circle_id
  for update;

  if not found then
    raise exception 'Circle not found';
  end if;

  if v_row.creator_id::text = v_user_text then
    raise exception 'Hosts must swipe users from the host flow';
  end if;

  if v_row.status is distinct from 'forming'::public.circle_status then
    raise exception 'Circle is not accepting new members';
  end if;

  v_pending := coalesce(v_row.pending_swipes, '{}'::jsonb);
  v_skipped := coalesce(v_row.skipped_swipes, '{}'::jsonb);
  v_members := coalesce(
    (select array_agg(m::uuid) from unnest(v_row.members) as m),
    array[]::uuid[]
  );
  v_size := coalesce(v_row.size, 5);

  if p_liked then
    v_user_pending := coalesce(v_pending -> v_user_text, '[]'::jsonb);
    if not v_user_pending @> to_jsonb(p_circle_id) then
      v_user_pending := v_user_pending || to_jsonb(p_circle_id);
    end if;
    v_pending := jsonb_set(v_pending, array[v_user_text], v_user_pending, true);

    v_host_pending := coalesce(
      v_pending -> (v_row.creator_id::text),
      '[]'::jsonb
    );
    v_mutual := v_host_pending @> to_jsonb(v_user_text);

    if v_mutual and coalesce(array_length(v_members, 1), 0) < v_size then
      if not v_user_uuid = any (v_members) then
        v_members := array_append(v_members, v_user_uuid);
        v_added := true;
      else
        v_added := true;
      end if;
    end if;
  else
    v_user_pending := coalesce(v_skipped -> v_user_text, '[]'::jsonb);
    if not v_user_pending @> to_jsonb(p_circle_id) then
      v_user_pending := v_user_pending || to_jsonb(p_circle_id);
    end if;
    v_skipped := jsonb_set(v_skipped, array[v_user_text], v_user_pending, true);
  end if;

  v_complete := coalesce(array_length(v_members, 1), 0) >= v_size;

  update public.circles
  set
    pending_swipes = v_pending,
    skipped_swipes = v_skipped,
    members = v_members,
    status = (
      case
        when v_complete then 'complete'
        else 'forming'
      end
    )::public.circle_status
  where id::text = p_circle_id;

  return jsonb_build_object(
    'mutualMatch', v_mutual,
    'addedToCircle', v_added,
    'circleComplete', v_complete
  );
end;
$$;

revoke all on function public.submit_circle_swipe(text, boolean) from public;
grant execute on function public.submit_circle_swipe(text, boolean) to authenticated;

notify pgrst, 'reload schema';
