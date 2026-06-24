// @ts-nocheck
/* eslint-disable import/no-unresolved */
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const ignoreMissingRelation = async (operation: PromiseLike<{ error: any }>) => {
  const { error } = await operation;
  if (
    error &&
    error.code !== "42P01" &&
    error.code !== "42703" &&
    error.code !== "23503"
  ) {
    throw error;
  }
};

const getAuthUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, response: json({ error: "Missing authorization" }, 401) };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, response: json({ error: "Invalid session" }, 401) };
  }

  return { user, response: null };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, response } = await getAuthUser(req);
    if (response) return response;

    const { confirmation } = await req.json().catch(() => ({}));
    if (confirmation !== "DELETE") {
      return json({ error: "Type DELETE to confirm account deletion" }, 400);
    }

    const userId = user.id;
    const { data: userRow } = await supabase
      .from("users")
      .select("display_name, email")
      .eq("id", userId)
      .maybeSingle();

    const displayName =
      userRow?.display_name || userRow?.email?.split("@")[0] || "A member";

    const { data: memberCircles, error: circleError } = await supabase
      .from("circles")
      .select("id, name, creator_id, members")
      .contains("members", [userId]);

    if (circleError) throw circleError;

    const circles = memberCircles ?? [];
    const hostedCircleIds = circles
      .filter((circle) => String(circle.creator_id) === userId)
      .map((circle) => String(circle.id));
    const joinedCircles = circles.filter(
      (circle) => String(circle.creator_id) !== userId,
    );

    for (const circle of circles) {
      const recipients = ((circle.members as string[] | undefined) ?? [])
        .map((memberId) => String(memberId))
        .filter((memberId) => memberId !== userId);

      if (recipients.length > 0) {
        await ignoreMissingRelation(
          supabase.from("notifications").insert(
            recipients.map((recipientId) => ({
              user_id: recipientId,
              type: "system",
              title: `${displayName} left Socio`,
              body:
                String(circle.creator_id) === userId
                  ? `${circle.name} was closed because the host deleted their account.`
                  : `${displayName} left ${circle.name}.`,
              data: {
                action: "account_deleted",
                circleId: circle.id,
                actorId: userId,
              },
              read: false,
            })),
          ),
        );
      }
    }

    if (hostedCircleIds.length > 0) {
      await ignoreMissingRelation(
        supabase.from("messages").delete().in("circle_id", hostedCircleIds),
      );
      await ignoreMissingRelation(
        supabase.from("circle_pending").delete().in("circle_id", hostedCircleIds),
      );
      await ignoreMissingRelation(
        supabase.from("polls").delete().in("circle_id", hostedCircleIds),
      );
      await ignoreMissingRelation(
        supabase.from("circles").delete().in("id", hostedCircleIds),
      );
    }

    for (const circle of joinedCircles) {
      const nextMembers = ((circle.members as string[] | undefined) ?? [])
        .map((memberId) => String(memberId))
        .filter((memberId) => memberId !== userId);

      await ignoreMissingRelation(
        supabase
          .from("circles")
          .update({ members: nextMembers })
          .eq("id", circle.id),
      );
    }

    await ignoreMissingRelation(
      supabase.from("messages").delete().eq("sender_id", userId),
    );
    await ignoreMissingRelation(
      supabase.from("polls").delete().eq("created_by", userId),
    );
    await ignoreMissingRelation(
      supabase.from("poll_votes").delete().eq("user_id", userId),
    );
    await ignoreMissingRelation(
      supabase.from("circle_pending").delete().eq("user_id", userId),
    );
    await ignoreMissingRelation(
      supabase
        .from("blocked_users")
        .delete()
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    );
    await ignoreMissingRelation(
      supabase
        .from("reports")
        .delete()
        .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
    );
    await ignoreMissingRelation(
      supabase.from("notifications").delete().eq("user_id", userId),
    );
    await ignoreMissingRelation(
      supabase.from("users").delete().eq("id", userId),
    );

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw deleteAuthError;

    return json({
      deleted: true,
      closedCircles: hostedCircleIds.length,
      leftCircles: joinedCircles.length,
    });
  } catch (error) {
    console.error("Error in delete-account:", error);
    return json({ error: String(error) }, 500);
  }
});
