const CLUB_TIME_ZONE = "America/Chicago";

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function differenceInDays(laterDateKey: string, earlierDateKey: string) {
  const later = Date.parse(`${laterDateKey}T00:00:00.000Z`);
  const earlier = Date.parse(`${earlierDateKey}T00:00:00.000Z`);

  return Math.max(0, Math.round((later - earlier) / 86_400_000));
}

export type SubmissionTiming = {
  applies: boolean;
  deadlineDate: string | null;
  isLate: boolean;
  daysLate: number;
};

export function getSubmissionTiming({
  released,
  tagged,
  submittedAt,
  eventEndDate,
}: {
  released: boolean;
  tagged: boolean;
  submittedAt: string | null;
  eventEndDate: string | null;
}): SubmissionTiming {
  const applies = released || tagged;
  const submittedDate = submittedAt ? toDateKey(submittedAt) : null;
  const eventEndDateKey = eventEndDate?.slice(0, 10) || null;

  if (!applies || !submittedDate || !eventEndDateKey) {
    return { applies, deadlineDate: null, isLate: false, daysLate: 0 };
  }

  const deadlineDate = addDays(eventEndDateKey, 7);
  const isLate = submittedDate > deadlineDate;

  return {
    applies,
    deadlineDate,
    isLate,
    daysLate: isLate ? differenceInDays(submittedDate, deadlineDate) : 0,
  };
}

export function formatClubDate(dateKey: string | null) {
  if (!dateKey) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}
