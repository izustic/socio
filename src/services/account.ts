import { supabase } from "./supabase";

type FunctionErrorWithContext = Error & {
  context?: Response;
};

const getFunctionErrorMessage = async (error: FunctionErrorWithContext) => {
  const response = error.context;
  if (!response) return error.message;

  try {
    const body = await response.clone().text();
    if (!body) return error.message;

    try {
      const parsed = JSON.parse(body) as { error?: unknown; message?: unknown };
      if (typeof parsed.error === "string") return parsed.error;
      if (typeof parsed.message === "string") return parsed.message;
      return body;
    } catch {
      return body;
    }
  } catch {
    return error.message;
  }
};

export const deleteAccount = async (confirmation: string): Promise<void> => {
  const { error } = await supabase.functions.invoke("delete-account", {
    body: { confirmation },
  });

  if (error) {
    const message = await getFunctionErrorMessage(error as FunctionErrorWithContext);
    throw new Error(message);
  }

  await supabase.auth.signOut();
};
