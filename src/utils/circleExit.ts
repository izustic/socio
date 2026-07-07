import { Circle } from "@/src/types";
import { hasMeetupDeadlineElapsed } from "@/src/utils/circleDeadline";

export const FREE_EXITS_DEFAULT = 2;

export type CircleExitState = {
  isHost: boolean;
  label: string;
  helperText: string;
  locked: boolean;
  deadlineElapsed: boolean;
  freeExits: number;
};

export const getCircleExitState = (
  circle: Circle,
  userId: string,
  freeExits = FREE_EXITS_DEFAULT,
  now = Date.now(),
): CircleExitState => {
  const normalizedFreeExits = Math.max(0, Math.min(FREE_EXITS_DEFAULT, freeExits));
  const isHost = circle.creatorId === userId;
  const deadlineElapsed = hasMeetupDeadlineElapsed(circle, now);
  const actionLabel = isHost ? "Close Circle" : "Leave Circle";

  if (deadlineElapsed) {
    return {
      isHost,
      label: actionLabel,
      helperText: "This Circle's time is up. Your free exits are restored.",
      locked: false,
      deadlineElapsed,
      freeExits: FREE_EXITS_DEFAULT,
    };
  }

  if (normalizedFreeExits > 0) {
    return {
      isHost,
      label: actionLabel,
      helperText: `${normalizedFreeExits} free ${
        normalizedFreeExits === 1 ? "exit" : "exits"
      } remaining`,
      locked: false,
      deadlineElapsed,
      freeExits: normalizedFreeExits,
    };
  }

  return {
    isHost,
    label: actionLabel,
    helperText:
      "You've used your free exits. You'll be able to leave once this Circle's time is up.",
    locked: true,
    deadlineElapsed,
    freeExits: 0,
  };
};
