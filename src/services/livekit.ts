import { supabase } from "./supabase";

export interface LiveKitTokenResponse {
  token: string;
  url?: string;
  roomName?: string;
}

export const getLivekitToken = async (
  circleId: string,
  userName: string,
): Promise<LiveKitTokenResponse> => {
  const { data, error } = await supabase.functions.invoke("get-livekit-token", {
    body: { circleId, userName },
  });

  if (error) throw new Error(`Failed to get LiveKit token: ${error.message}`);
  if (!data?.token) throw new Error("No token returned from Edge Function");

  return {
    token: data.token,
    url: data.url,
    roomName: data.roomName,
  };
};
