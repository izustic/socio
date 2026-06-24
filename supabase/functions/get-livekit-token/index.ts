// @ts-nocheck
/* eslint-disable import/no-unresolved */
import { createClient } from "npm:@supabase/supabase-js";
import { AccessToken } from "npm:livekit-server-sdk";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Invalid or expired token" }, 401);
    }

    const userId = user.id;
    const { circleId, userName } = await req.json();

    if (!circleId) {
      return json({ error: "Missing circleId" }, 400);
    }

    const { data: circle, error: circleError } = await supabase
      .from("circles")
      .select("id, members, status")
      .eq("id", circleId)
      .maybeSingle();

    if (circleError || !circle) {
      return json({ error: "Circle not found" }, 404);
    }

    const members = Array.isArray(circle.members)
      ? circle.members.map((member) => String(member))
      : [];

    if (!members.includes(userId)) {
      return json({ error: "User is not a member of this circle" }, 403);
    }

    if (circle.status !== "complete") {
      return json({ error: "Circle is not complete yet" }, 403);
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY")!;
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")!;
    const livekitUrl = Deno.env.get("LIVEKIT_URL")!;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return json({ error: "LiveKit credentials not configured" }, 500);
    }

    const roomName = String(circle.id);
    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName || user.email?.split("@")[0] || "Member",
      // ttl: "2h",
    });

    accessToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return json({
      token: await accessToken.toJwt(),
      url: livekitUrl,
      roomName,
    });
  } catch (error) {
    console.error("Error in get-livekit-token:", error);

    return json(
      {
        error: String(error),
        stack: error?.stack,
      },
      500,
    );
  }
});
