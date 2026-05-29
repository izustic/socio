import type { PollData } from "@/src/components/chat/PollComponents";
import { supabase } from "./supabase";

interface PollRow {
  id: string;
  circle_id: string;
  created_by: string;
  question: string;
  allow_multiple: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PollOptionRow {
  id: string;
  poll_id: string;
  text: string;
  sort_index: number;
}

interface PollVoteRow {
  poll_id: string;
  option_id: string;
  user_id: string;
}

const toPollData = (
  poll: PollRow,
  options: PollOptionRow[],
  votes: PollVoteRow[],
): PollData => {
  const votesByOption = votes.reduce<Record<string, string[]>>((acc, vote) => {
    acc[vote.option_id] = acc[vote.option_id] || [];
    acc[vote.option_id].push(vote.user_id);
    return acc;
  }, {});

  return {
    id: poll.id,
    question: poll.question,
    allowMultiple: poll.allow_multiple,
    expiresAt: poll.expires_at ? new Date(poll.expires_at) : null,
    createdBy: poll.created_by,
    createdAt: new Date(poll.created_at),
    options: options
      .filter((option) => option.poll_id === poll.id)
      .sort((a, b) => a.sort_index - b.sort_index)
      .map((option) => ({
        id: option.id,
        text: option.text,
        votes: votesByOption[option.id] ?? [],
      })),
  };
};

export const createPoll = async (
  circleId: string,
  pollData: Omit<PollData, "id" | "createdAt">,
): Promise<PollData> => {
  const pollId = `poll-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { data: pollResult, error: pollError } = await supabase
    .from<PollRow>("polls")
    .insert({
      id: pollId,
      circle_id: circleId,
      created_by: pollData.createdBy,
      question: pollData.question,
      allow_multiple: pollData.allowMultiple,
      expires_at: pollData.expiresAt ? pollData.expiresAt.toISOString() : null,
    })
    .select("*")
    .single();

  if (pollError || !pollResult) {
    throw pollError ?? new Error("Could not create poll");
  }

  const optionRows = pollData.options.map((option, index) => ({
    id: option.id,
    poll_id: pollId,
    text: option.text,
    sort_index: index,
  }));

  const { error: optionError } = await supabase
    .from<PollOptionRow>("poll_options")
    .insert(optionRows);

  if (optionError) {
    throw optionError;
  }

  return toPollData(pollResult, optionRows, []);
};

export const getPollsByIds = async (pollIds: string[]): Promise<PollData[]> => {
  if (pollIds.length === 0) return [];

  const { data: pollRows, error: pollError } = await supabase
    .from<PollRow>("polls")
    .select("*")
    .in("id", pollIds);

  if (pollError) throw pollError;
  if (!pollRows || pollRows.length === 0) return [];

  const { data: optionRows, error: optionError } = await supabase
    .from<PollOptionRow>("poll_options")
    .select("*")
    .in("poll_id", pollIds);

  if (optionError) throw optionError;

  const { data: voteRows, error: voteError } = await supabase
    .from<PollVoteRow>("poll_votes")
    .select("*")
    .in("poll_id", pollIds);

  if (voteError) throw voteError;

  return pollRows.map((poll) =>
    toPollData(poll, optionRows ?? [], voteRows ?? []),
  );
};

export const addPollVote = async (
  pollId: string,
  optionIds: string[],
  userId: string,
): Promise<PollData> => {
  const [poll] = await getPollsByIds([pollId]);
  if (!poll) {
    throw new Error("Poll not found");
  }

  if (!poll.allowMultiple && optionIds.length > 1) {
    throw new Error("This poll only allows a single choice.");
  }

  const { error: deleteError } = await supabase
    .from("poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  if (optionIds.length > 0) {
    const voteRows = optionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    }));

    const { error: insertError } = await supabase
      .from("poll_votes")
      .insert(voteRows);
    if (insertError) throw insertError;
  }

  const [updatedPoll] = await getPollsByIds([pollId]);
  if (!updatedPoll) {
    throw new Error("Failed to load updated poll");
  }

  return updatedPoll;
};

export const getPollById = async (pollId: string): Promise<PollData | null> => {
  const polls = await getPollsByIds([pollId]);
  return polls[0] ?? null;
};
