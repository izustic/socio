import { Circle } from "@/src/types";

export const MIN_MEETUP_DAYS = 3;
export const MAX_MEETUP_DAYS = 10;

export const clampMeetupDays = (days: number) =>
  Math.max(MIN_MEETUP_DAYS, Math.min(MAX_MEETUP_DAYS, Math.round(days)));

export const createMeetupDeadline = (days: number, from = new Date()) => {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + clampMeetupDays(days));
  return deadline;
};

export const getCircleMeetupDeadline = (circle: Circle) => {
  if (circle.meetupDeadline) return circle.meetupDeadline;
  return createMeetupDeadline(circle.meetupDays ?? MIN_MEETUP_DAYS, circle.createdAt);
};

export const hasMeetupDeadlineElapsed = (circle: Circle, now = Date.now()) =>
  getCircleMeetupDeadline(circle).getTime() <= now;

export const getCountdownParts = (deadline: Date, now = Date.now()) => {
  const diffMs = Math.max(0, deadline.getTime() - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
};
