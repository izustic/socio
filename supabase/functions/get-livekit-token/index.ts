// @ts-nocheck
// import { createClient } from "@supabase/supabase-js";
// import { AccessToken } from "livekit-server-sdk";
import { createClient } from "npm:@supabase/supabase-js";
import { AccessToken } from "npm:livekit-server-sdk";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
      });
    }

    const userId = user.id;
    const { circleId, userName } = await req.json();

    if (!circleId) {
      return new Response(JSON.stringify({ error: "Missing circleId" }), {
        status: 400,
      });
    }

    // Verify the user is a member of the circle
    const { data: circle, error: circleError } = await supabase
      .from("circles")
      .select("members, status")
      .eq("id", circleId)
      .single();

    if (circleError || !circle) {
      return new Response(JSON.stringify({ error: "Circle not found" }), {
        status: 404,
      });
    }

    // Check if user is in the members array
    if (!circle.members || !circle.members.includes(userId)) {
      return new Response(JSON.stringify({ error: "User is not a member of this circle" }), {
        status: 403,
      });
    }

    // Check if circle is complete (only complete circles can have calls)
    if (circle.status !== "complete") {
      return new Response(JSON.stringify({ error: "Circle is not complete yet" }), {
        status: 403,
      });
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY")!;
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")!;

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: "LiveKit credentials not configured" }), {
        status: 500,
      });
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName || user.email?.split("@")[0] || "Member",
      ttl: "2h",
    });

    accessToken.addGrant({
      room: circleId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return new Response(JSON.stringify({ token: await accessToken.toJwt() }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-livekit-token:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
});
