import { supabase } from "./supabase";

export interface LiveKitTokenResponse {
  token: string;
  url?: string;
  roomName?: string;
}

type FunctionErrorWithContext = Error & {
  context?: Response;
};

const getFunctionErrorDetail = async (
  error: FunctionErrorWithContext,
): Promise<{ status?: number; message?: string }> => {
  const response = error.context;
  if (!response) return {};

  try {
    const body = await response.clone().text();
    if (!body) return { status: response.status };

    try {
      const parsed = JSON.parse(body) as {
        error?: unknown;
        message?: unknown;
      };
      const message =
        typeof parsed.error === "string"
          ? parsed.error
          : typeof parsed.message === "string"
            ? parsed.message
            : body;

      return { status: response.status, message };
    } catch {
      return { status: response.status, message: body };
    }
  } catch {
    return { status: response.status };
  }
};

const buildTokenError = async (error: Error): Promise<Error> => {
  const { status, message } = await getFunctionErrorDetail(
    error as FunctionErrorWithContext,
  );
  const statusText = status ? ` (${status})` : "";
  const detail = message || error.message;

  console.error("LiveKit token request failed:", {
    status,
    message: detail,
  });

  return new Error(`Failed to get LiveKit token${statusText}: ${detail}`);
};

export const getLivekitToken = async (
  circleId: string,
  userName: string,
): Promise<LiveKitTokenResponse> => {
  if (!circleId) {
    throw new Error("Cannot join call without a Circle ID");
  }

  const { data, error } = await supabase.functions.invoke("get-livekit-token", {
    body: { circleId, userName },
  });

  if (error) throw await buildTokenError(error);

  if (data?.error && typeof data.error === "string") {
    throw new Error(`Failed to get LiveKit token: ${data.error}`);
  }

  if (!data?.token) {
    throw new Error("Failed to get LiveKit token: no token returned");
  }

  return {
    token: data.token,
    url: data.url,
    roomName: data.roomName,
  };
};
