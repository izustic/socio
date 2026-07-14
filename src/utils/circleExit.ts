import { Circle } from "@/src/types";
import { hasMeetupDeadlineElapsed } from "@/src/utils/circleDeadline";
import { tx } from "@/src/utils/localization";

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
  const actionLabel = isHost ? tx("circleExit.close") : tx("circleExit.leave");

  if (deadlineElapsed) {
    return {
      isHost,
      label: actionLabel,
      helperText: tx("circleExit.expired"),
      locked: false,
      deadlineElapsed,
      freeExits: FREE_EXITS_DEFAULT,
    };
  }

  if (normalizedFreeExits > 0) {
    return {
      isHost,
      label: actionLabel,
      helperText: normalizedFreeExits === 1
        ? tx("circleExit.oneRemaining")
        : tx("circleExit.remaining", { count: normalizedFreeExits }),
      locked: false,
      deadlineElapsed,
      freeExits: normalizedFreeExits,
    };
  }

  return {
    isHost,
    label: actionLabel,
    helperText: tx("circleExit.noneRemaining"),
    locked: true,
    deadlineElapsed,
    freeExits: 0,
  };
};
