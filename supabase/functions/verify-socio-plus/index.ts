// @ts-nocheck
/* eslint-disable import/no-unresolved */
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_IDS = new Set(
  (Deno.env.get("SOCIO_PLUS_PRODUCT_IDS") || "socio_plus_monthly")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

const APPLE_BUNDLE_ID = Deno.env.get("APPLE_BUNDLE_ID") || "com.izustic.socio";
const APPLE_ENVIRONMENT = Deno.env.get("APPLE_ENVIRONMENT") || "Production";
const GOOGLE_PACKAGE_NAME =
  Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME") || "com.izustic.socio";

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

const base64UrlEncode = (input: ArrayBuffer | string) => {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const decodeJwtPayload = (jwt: string) => {
  const payload = jwt.split(".")[1];
  if (!payload) return {};
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return JSON.parse(jsonPayload);
};

const importPkcs8Key = async (privateKey: string) =>
  crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(
      atob(
        privateKey
          .replace(/\\n/g, "\n")
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace(/\s/g, ""),
      ),
      (char) => char.charCodeAt(0),
    ),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

const createAppleToken = async () => {
  const issuerId = Deno.env.get("APPLE_ISSUER_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY");

  if (!issuerId || !keyId || !privateKey) {
    throw new Error("Apple App Store Server API secrets are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 900,
    aud: "appstoreconnect-v1",
    bid: APPLE_BUNDLE_ID,
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}`;
  const key = await importPkcs8Key(privateKey);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
};

const validateApplePurchase = async ({
  transactionId,
  purchaseToken,
}: {
  transactionId?: string | null;
  purchaseToken?: string | null;
}) => {
  if (purchaseToken) {
    const signedPayload = decodeJwtPayload(purchaseToken);
    const productId = signedPayload.productId;
    const expiresAtMs = Number(signedPayload.expiresDate || 0);
    const revocationDate = signedPayload.revocationDate;

    return {
      productId,
      purchaseToken,
      transactionId: signedPayload.transactionId || transactionId,
      originalTransactionId: signedPayload.originalTransactionId,
      status:
        revocationDate || expiresAtMs <= Date.now() ? "expired" : "active",
      expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
      isActive: !revocationDate && expiresAtMs > Date.now(),
      raw: signedPayload,
    };
  }

  if (!transactionId) {
    throw new Error("Missing Apple transaction ID");
  }

  const appleToken = await createAppleToken();
  const host =
    APPLE_ENVIRONMENT === "Sandbox"
      ? "https://api.storekit-sandbox.itunes.apple.com"
      : "https://api.storekit.itunes.apple.com";
  const response = await fetch(
    `${host}/inApps/v1/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${appleToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Apple validation failed: ${response.status}`);
  }

  const result = await response.json();
  const signedTransactionInfo = result.signedTransactionInfo;
  const decoded = signedTransactionInfo
    ? decodeJwtPayload(signedTransactionInfo)
    : result;
  const expiresAtMs = Number(decoded.expiresDate || 0);
  const revocationDate = decoded.revocationDate;

  return {
    productId: decoded.productId,
    purchaseToken: signedTransactionInfo ?? null,
    transactionId: decoded.transactionId || transactionId,
    originalTransactionId: decoded.originalTransactionId,
    status: revocationDate || expiresAtMs <= Date.now() ? "expired" : "active",
    expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
    isActive: !revocationDate && expiresAtMs > Date.now(),
    raw: result,
  };
};

const importGoogleServiceAccountKey = async (privateKey: string) =>
  crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(
      atob(
        privateKey
          .replace(/\\n/g, "\n")
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace(/\s/g, ""),
      ),
      (char) => char.charCodeAt(0),
    ),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

const getGoogleAccessToken = async () => {
  const clientEmail = Deno.env.get("GOOGLE_PLAY_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PLAY_PRIVATE_KEY");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Play service account secrets are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}`;
  const key = await importGoogleServiceAccountKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

const validateGooglePurchase = async ({
  productId,
  purchaseToken,
}: {
  productId: string;
  purchaseToken: string;
}) => {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${GOOGLE_PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Google Play validation failed: ${response.status}`);
  }

  const result = await response.json();
  const expiresAtMs = Number(result.expiryTimeMillis || 0);
  const paymentState = Number(result.paymentState ?? -1);
  const cancelReason = result.cancelReason;
  const isActive = expiresAtMs > Date.now() && paymentState !== 0 && cancelReason == null;
  const status =
    paymentState === 0
      ? "pending"
      : cancelReason != null
        ? "cancelled"
        : expiresAtMs <= Date.now()
          ? "expired"
          : "active";

  return {
    productId,
    purchaseToken,
    transactionId: result.orderId,
    originalTransactionId: result.linkedPurchaseToken,
    status,
    expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
    isActive,
    raw: result,
  };
};

const upsertEntitlement = async (
  userId: string,
  platform: "ios" | "android",
  validation: Record<string, unknown>,
) => {
  const productId = String(validation.productId || "");
  if (!PRODUCT_IDS.has(productId)) {
    throw new Error(`Unexpected product id: ${productId}`);
  }

  const row = {
    user_id: userId,
    platform,
    product_id: productId,
    purchase_token: validation.purchaseToken ?? null,
    transaction_id: validation.transactionId ?? null,
    original_transaction_id: validation.originalTransactionId ?? null,
    status: validation.status ?? "inactive",
    expires_at: validation.expiresAt ?? null,
    is_active: Boolean(validation.isActive),
    raw_response: validation.raw ?? {},
  };

  const conflictTarget =
    platform === "android" && row.purchase_token
      ? "purchase_token"
      : row.transaction_id
        ? "transaction_id"
        : undefined;

  const query = supabase.from("socio_plus_subscriptions").upsert(
    row,
    conflictTarget ? { onConflict: conflictTarget } : undefined,
  );
  const { error } = await query;
  if (error) throw error;

  const active = Boolean(validation.isActive);
  const { error: userError } = await supabase
    .from("users")
    .update({
      is_socio_plus: active,
      subscription_status: validation.status ?? "inactive",
      subscription_platform: platform,
      subscription_product_id: productId,
      subscription_expires_at: validation.expiresAt ?? null,
    })
    .eq("id", userId);

  if (userError) throw userError;

  return {
    isSocioPlus: active,
    subscriptionStatus: validation.status ?? "inactive",
    expiresAt: validation.expiresAt ?? null,
    productId,
    platform,
  };
};

const refreshFromLatestRecord = async (userId: string) => {
  const { data, error } = await supabase
    .from("socio_plus_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data?.platform === "ios" || data?.platform === "android") {
    try {
      const validation =
        data.platform === "ios"
          ? await validateApplePurchase({
              transactionId: data.transaction_id,
              purchaseToken: data.purchase_token,
            })
          : await validateGooglePurchase({
              productId: data.product_id,
              purchaseToken: data.purchase_token,
            });
      return upsertEntitlement(userId, data.platform, validation);
    } catch (error) {
      console.warn("Could not revalidate latest Socio+ record:", error);
    }
  }

  const isActive =
    Boolean(data?.is_active) &&
    (!data?.expires_at || new Date(data.expires_at).getTime() > Date.now());
  const status = isActive ? data.status : data ? "expired" : "inactive";

  const { error: userError } = await supabase
    .from("users")
    .update({
      is_socio_plus: isActive,
      subscription_status: status,
      subscription_platform: data?.platform ?? null,
      subscription_product_id: data?.product_id ?? null,
      subscription_expires_at: data?.expires_at ?? null,
    })
    .eq("id", userId);
  if (userError) throw userError;

  return {
    isSocioPlus: isActive,
    subscriptionStatus: status,
    expiresAt: data?.expires_at ?? null,
    productId: data?.product_id ?? null,
    platform: data?.platform ?? null,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
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

    const body = await req.json();
    const action = body.action || "verify_purchase";

    if (action === "refresh_status") {
      return json(await refreshFromLatestRecord(user.id));
    }

    const platform = body.platform;
    if (platform !== "ios" && platform !== "android") {
      return json({ error: "Invalid platform" }, 400);
    }

    const validation =
      platform === "ios"
        ? await validateApplePurchase({
            transactionId: body.transactionId,
            purchaseToken: body.purchaseToken,
          })
        : await validateGooglePurchase({
            productId: body.productId,
            purchaseToken: body.purchaseToken,
          });

    return json(await upsertEntitlement(user.id, platform, validation));
  } catch (error) {
    console.error("Error verifying Socio+:", error);
    return json({ error: error?.message || String(error) }, 500);
  }
});
