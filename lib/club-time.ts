const CLUB_TIME_ZONE = "America/Chicago";

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getClubParts(date: Date): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function sameParts(left: DateTimeParts, right: DateTimeParts) {
  return Object.keys(left).every(
    (key) => left[key as keyof DateTimeParts] === right[key as keyof DateTimeParts],
  );
}

/** Convert a datetime-local value entered in the club timezone to an ISO timestamp. */
export function clubDateTimeToIso(value: string | null | undefined) {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/,
  );
  if (!match) return null;

  const desired: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = getClubParts(new Date(candidate));
    if (sameParts(actual, desired)) return new Date(candidate).toISOString();

    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate += desiredAsUtc - actualAsUtc;
  }

  return null;
}

/** Format a stored timestamp for an HTML datetime-local control in club time. */
export function isoToClubDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = getClubParts(date);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function getClubSeasonRange(year: number) {
  return {
    start: clubDateTimeToIso(`${year}-01-01T00:00`)!,
    end: clubDateTimeToIso(`${year + 1}-01-01T00:00`)!,
  };
}
