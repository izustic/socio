import { supabase } from "./supabase";

export const getLivekitToken = async (
  circleId: string,
  userId: string,
  userName: string,
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("get-livekit-token", {
    body: { circleId, userName },
  });

  if (error) throw new Error(`Failed to get LiveKit token: ${error.message}`);
  if (!data?.token) throw new Error("No token returned from Edge Function");

  return data.token;
};
