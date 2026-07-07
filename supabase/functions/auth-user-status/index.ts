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

const decodeJwtPayload = (jwt: string) => {
  const payload = jwt.split(".")[1];
  if (!payload) return {};
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return JSON.parse(jsonPayload);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ exists: false }, 200);
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = decodeJwtPayload(token);
    const userId = typeof payload.sub === "string" ? payload.sub : null;

    if (!userId) {
      return json({ exists: false }, 200);
    }

    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data?.user) {
      return json({ exists: false }, 200);
    }

    return json({ exists: true, userId: data.user.id }, 200);
  } catch (error) {
    console.error("Auth user status error:", error);
    return json({ exists: false }, 200);
  }
});
