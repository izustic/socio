const REQUIRED_PUBLIC_ENV_VARS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const OPTIONAL_PUBLIC_ENV_VARS = [
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
  "EXPO_PUBLIC_LIVEKIT_URL",
] as const;

export type RequiredPublicEnvVar = (typeof REQUIRED_PUBLIC_ENV_VARS)[number];

export const getMissingRequiredEnvVars = (): RequiredPublicEnvVar[] => {
  const missing: RequiredPublicEnvVar[] = [];

  // Must use static process.env references (via `env`) — dynamic
  // `process.env[key]` is never inlined by Expo/Metro in production builds.
  if (!env.supabaseUrl) {
    missing.push("EXPO_PUBLIC_SUPABASE_URL");
  }
  if (!env.supabaseAnonKey) {
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  return missing;
};

export const assertRequiredEnv = (): void => {
  const missing = getMissingRequiredEnvVars();
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      "For local dev, add them to .env. For EAS builds, set them with `eas env:create` " +
      "or in the Expo dashboard under Project > Environment variables.",
  );
};

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "",
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "",
  googleAndroidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "",
  livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL?.trim() ?? "",
};

export const optionalEnvKeys = OPTIONAL_PUBLIC_ENV_VARS;
