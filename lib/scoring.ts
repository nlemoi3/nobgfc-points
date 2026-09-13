export type CatchRecord = {
  id: number;
  status?: string | null;
  points_awarded: number | null;
  released: boolean | null;
  tagged: boolean | null;
  weight: number | null;
  line_class?: number | null;
  species?: {
    name: string;
  } | null;
};

export const EVENT_SCORING_RULESETS = {
  CLUB: "nobgfc_club",
  NOIBT_2026: "noibt_2026",
} as const;

export type EventScoringRuleset =
  (typeof EVENT_SCORING_RULESETS)[keyof typeof EVENT_SCORING_RULESETS];

export function normalizeEventScoringRuleset(
  ruleset: string | null | undefined,
): EventScoringRuleset {
  return ruleset === EVENT_SCORING_RULESETS.NOIBT_2026
    ? EVENT_SCORING_RULESETS.NOIBT_2026
    : EVENT_SCORING_RULESETS.CLUB;
}

type CatchWeight = {
  weight: number | string | null;
  released: boolean | null;
};

export function isWeighedCatch(catchRecord: CatchWeight) {
  return (
    !catchRecord.released &&
    catchRecord.weight !== null &&
    Number.isFinite(Number(catchRecord.weight)) &&
    Number(catchRecord.weight) > 0
  );
}

export function formatCatchWeight(catchRecord: CatchWeight) {
  if (catchRecord.released) {
    return catchRecord.weight !== null
      ? `${catchRecord.weight} lbs (estimated)`
      : "Released";
  }

  return catchRecord.weight !== null ? `${catchRecord.weight} lbs` : "—";
}

export const LINE_CLASS_MULTIPLIERS: Record<number, number> = {
  130: 1,
  80: 1.3,
  50: 1.5,
  30: 2,
  20: 3,
  16: 3.5,
  12: 4,
  8: 4.5,
  4: 5,
  2: 6,
};

const BILLFISH_SPECIES = new Set([
  "Blue Marlin",
  "White Marlin",
  "Sailfish",
  "Spearfish",
  "Swordfish",
]);

export function isBillfishSpecies(speciesName: string | null | undefined) {
  return Boolean(speciesName && BILLFISH_SPECIES.has(speciesName));
}

export type TournamentStanding = {
  points: number;
  totalReachedAt: string | null;
};

export function compareTournamentStandings(
  a: TournamentStanding,
  b: TournamentStanding,
) {
  const pointDifference = b.points - a.points;
  if (pointDifference !== 0) return pointDifference;

  const aTime = a.totalReachedAt ? Date.parse(a.totalReachedAt) : Number.NaN;
  const bTime = b.totalReachedAt ? Date.parse(b.totalReachedAt) : Number.NaN;
  const aHasTime = Number.isFinite(aTime);
  const bHasTime = Number.isFinite(bTime);

  if (aHasTime && bHasTime) return aTime - bTime;
  if (aHasTime) return -1;
  if (bHasTime) return 1;
  return 0;
}

export function laterValidTimestamp(
  current: string | null,
  candidate: string | null | undefined,
) {
  if (!candidate || !Number.isFinite(Date.parse(candidate))) return current;
  if (!current || !Number.isFinite(Date.parse(current))) return candidate;

  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

const BEST_THREE_WEIGHED_SPECIES = ["Dolphin", "Wahoo"] as const;
const LIMITED_TUNA_SPECIES = ["Yellowfin Tuna", "Bigeye Tuna"] as const;
const ANNUAL_LIMITED_TUNA_SPECIES = "Yellowfin Tuna";
const LIMITED_RELEASE_SPECIES = ["Swordfish"] as const;

export const PROVISIONAL_SWORDFISH_LIMIT_NOTE =
  "Working interpretation pending club confirmation: no more than three qualifying Swordfish releases per angler per fishing year for individual standings, and no more than three per boat per fishing year for boat standings.";

type PointCalculationInput = {
  speciesName: string;
  weight: number | null;
  lineClass: number;
  released: boolean;
  tagged: boolean;
};

type EventPointCalculationInput = PointCalculationInput & {
  eventScoringRuleset?: string | null;
};

type CatchValidationInput = PointCalculationInput & {
  minimumWeight: number | null;
};

export function validateCatchInput(input: CatchValidationInput) {
  const errors: string[] = [];

  if (!(input.lineClass in LINE_CLASS_MULTIPLIERS)) {
    errors.push("Select a valid line class.");
  }

  if (input.tagged && !input.released) {
    errors.push("A tagged fish must also be marked released.");
  }

  if (!input.released) {
    if (input.weight === null || !Number.isFinite(input.weight)) {
      errors.push("A weight is required for a weighed catch.");
    } else {
      if (input.weight <= 0) {
        errors.push("Weight must be greater than zero.");
      }

      if (
        input.minimumWeight !== null &&
        input.weight < input.minimumWeight
      ) {
        errors.push(
          `${input.speciesName} must weigh at least ${input.minimumWeight} lb.`
        );
      }
    }
  }

  return errors;
}

type EventAssignmentValidationInput = {
  catchDateTime: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  eventStatus?: string | null;
  eventIsTournament?: boolean | null;
};

export function isCatchWithinEventDates(
  catchDateTime: string | null | undefined,
  eventStartDate: string | null | undefined,
  eventEndDate: string | null | undefined,
) {
  let catchDate = catchDateTime?.slice(0, 10) || "";
  const eventStart = eventStartDate || "";
  const eventEnd = eventEndDate || eventStart;

  if (catchDateTime && /(?:Z|[+-]\d{2}:\d{2})$/.test(catchDateTime)) {
    const parsed = new Date(catchDateTime);

    if (!Number.isNaN(parsed.getTime())) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(parsed);
      const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
      );
      catchDate = `${values.year}-${values.month}-${values.day}`;
    }
  }

  return Boolean(
    catchDate &&
      eventStart &&
      catchDate >= eventStart &&
      catchDate <= eventEnd,
  );
}

export function validateEventAssignment(input: EventAssignmentValidationInput) {
  const errors: string[] = [];

  if (!input.catchDateTime?.slice(0, 10)) {
    errors.push("Catch date and time are required.");
  }

  if (["locked", "cancelled"].includes(input.eventStatus || "")) {
    errors.push(`The selected event is ${input.eventStatus}.`);
  }

  return errors;
}

export function getEventAssignmentWarnings(
  input: EventAssignmentValidationInput,
) {
  const warnings: string[] = [];

  if (input.eventIsTournament === false) {
    warnings.push("The selected event is not classified as a tournament.");
  }

  if (
    input.catchDateTime?.slice(0, 10) &&
    !isCatchWithinEventDates(
      input.catchDateTime,
      input.eventStartDate,
      input.eventEndDate,
    )
  ) {
    warnings.push("The catch date falls outside the selected event dates.");
  }

  return warnings;
}

export function calculateCatchPoints({
  speciesName,
  weight,
  lineClass,
  released,
  tagged,
}: PointCalculationInput) {
  const multiplier = LINE_CLASS_MULTIPLIERS[lineClass];

  if (multiplier === undefined) {
    throw new Error("Invalid line class.");
  }

  let basePoints = 0;
  let tagBonus = 0;

  if (released && speciesName === "Blue Marlin") {
    basePoints = 500;
  } else if (
    released &&
    ["White Marlin", "Sailfish", "Spearfish", "Swordfish"].includes(speciesName)
  ) {
    basePoints = 150;
  } else if (
    released &&
    ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName)
  ) {
    return 100;
  } else if (weight !== null) {
    // Club points use whole pounds. The original fractional weight remains on
    // the catch record for deterministic tie-breaking.
    basePoints = Math.floor(weight);
  }

  if (tagged && speciesName === "Blue Marlin") {
    tagBonus = 50;
  } else if (
    tagged &&
    ["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)
  ) {
    tagBonus = 25;
  }

  return basePoints * multiplier + tagBonus;
}

export function calculateAnnualCatchPoints({
  eventScoringRuleset,
  ...input
}: EventPointCalculationInput) {
  const ruleset = normalizeEventScoringRuleset(eventScoringRuleset);

  // NOIBT Rule 15 allows an untagged release to earn tournament points, but
  // only a properly tagged released billfish receives annual club credit.
  if (
    ruleset === EVENT_SCORING_RULESETS.NOIBT_2026 &&
    input.released &&
    isBillfishSpecies(input.speciesName) &&
    !input.tagged
  ) {
    return 0;
  }

  return calculateCatchPoints(input);
}

export function calculateTournamentCatchPoints({
  eventScoringRuleset,
  speciesName,
  weight,
  released,
  lineClass,
  tagged,
}: EventPointCalculationInput) {
  const ruleset = normalizeEventScoringRuleset(eventScoringRuleset);

  if (ruleset !== EVENT_SCORING_RULESETS.NOIBT_2026) {
    return calculateCatchPoints({
      speciesName,
      weight,
      lineClass,
      released,
      tagged,
    });
  }

  if (released) {
    if (speciesName === "Blue Marlin") return 500;
    if (["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)) {
      return 200;
    }
    return 0;
  }

  if (
    weight !== null &&
    [
      "Blue Marlin",
      "Dolphin",
      "Yellowfin Tuna",
      "Bigeye Tuna",
      "Wahoo",
    ].includes(speciesName)
  ) {
    return weight;
  }

  return 0;
}

export function countsTowardTournamentPointStandings({
  eventScoringRuleset,
  speciesName,
  released,
}: Pick<
  EventPointCalculationInput,
  "eventScoringRuleset" | "speciesName" | "released"
>) {
  const ruleset = normalizeEventScoringRuleset(eventScoringRuleset);

  if (ruleset === EVENT_SCORING_RULESETS.NOIBT_2026) {
    // NOIBT publishes team release standings; weighed-fish awards are ranked
    // as individual fish by weight rather than as a cumulative team score.
    return (
      released &&
      ["Blue Marlin", "White Marlin", "Sailfish", "Spearfish"].includes(
        speciesName,
      )
    );
  }

  return isBillfishSpecies(speciesName);
}

export function countsTowardTournamentAnglerStandings({
  eventScoringRuleset,
  speciesName,
  released,
}: Pick<
  EventPointCalculationInput,
  "eventScoringRuleset" | "speciesName" | "released"
>) {
  const ruleset = normalizeEventScoringRuleset(eventScoringRuleset);

  if (ruleset === EVENT_SCORING_RULESETS.NOIBT_2026) {
    return (
      ["Blue Marlin", "White Marlin", "Sailfish", "Spearfish"].includes(
        speciesName,
      ) &&
      (released || speciesName === "Blue Marlin")
    );
  }

  return isBillfishSpecies(speciesName);
}

export function isPublishedCatch(catchRecord: { status?: string | null }) {
  return catchRecord.status === "approved";
}

type OfficialStandingCatch = CatchRecord & {
  boat_id?: number | null;
  angler_id?: number | null;
  boats?: { id?: number | null; name?: string | null } | null;
  anglers?: {
    id?: number | null;
    first_name?: string | null;
    last_name?: string | null;
    is_member?: boolean | null;
  } | null;
};

export function buildOfficialBoatStandings(catches: OfficialStandingCatch[]) {
  const groups = new Map<
    string,
    { boatId?: number; boatName: string; catches: OfficialStandingCatch[] }
  >();

  catches.filter(isPublishedCatch).forEach((catchRecord) => {
    const boatId = Number(catchRecord.boat_id || catchRecord.boats?.id) || undefined;
    const boatName = catchRecord.boats?.name || "Unknown Boat";
    const key = boatId ? String(boatId) : `unknown:${boatName}`;
    const group = groups.get(key) || { boatId, boatName, catches: [] };

    group.catches.push(catchRecord);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map(({ boatId, boatName, catches: boatCatches }) => ({
      boatId,
      boatName,
      ...getOfficialStandingScore(boatCatches),
    }))
    .sort(
      (a, b) =>
        compareOfficialStandings(a, b) || a.boatName.localeCompare(b.boatName),
    );
}

export function buildOfficialMemberAnglerStandings(
  catches: OfficialStandingCatch[],
) {
  const groups = new Map<
    string,
    { anglerId?: number; anglerName: string; catches: OfficialStandingCatch[] }
  >();

  catches.filter(isPublishedCatch).forEach((catchRecord) => {
    if (!catchRecord.anglers?.is_member) return;

    const anglerId =
      Number(catchRecord.angler_id || catchRecord.anglers?.id) || undefined;
    const anglerName =
      `${catchRecord.anglers?.first_name || "Unknown"} ${catchRecord.anglers?.last_name || "Angler"}`;
    const key = anglerId ? String(anglerId) : `unknown:${anglerName}`;
    const group = groups.get(key) || { anglerId, anglerName, catches: [] };

    group.catches.push(catchRecord);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map(({ anglerId, anglerName, catches: anglerCatches }) => ({
      anglerId,
      anglerName,
      ...getOfficialStandingScore(anglerCatches),
    }))
    .sort(
      (a, b) =>
        compareOfficialStandings(a, b) ||
        a.anglerName.localeCompare(b.anglerName),
    );
}

function rankForEligibility(a: CatchRecord, b: CatchRecord) {
  return (
    Number(b.points_awarded || 0) - Number(a.points_awarded || 0) ||
    getCatchTieBreakPoints(b) - getCatchTieBreakPoints(a) ||
    a.id - b.id
  );
}

function getCatchTieBreakPoints(catchRecord: CatchRecord) {
  const officialPoints = Number(catchRecord.points_awarded || 0);
  if (!isWeighedCatch(catchRecord)) return officialPoints;

  const multiplier = LINE_CLASS_MULTIPLIERS[Number(catchRecord.line_class)];
  if (multiplier === undefined) return officialPoints;

  const fractionalPounds = Number(catchRecord.weight) % 1;
  return officialPoints + fractionalPounds * multiplier;
}

function selectOfficialCatches(catches: CatchRecord[]) {
  const eligible: CatchRecord[] = [];
  const limitedWeighed = new Map<string, CatchRecord[]>(
    BEST_THREE_WEIGHED_SPECIES.map((name) => [name, []])
  );
  const weighedTuna: CatchRecord[] = [];
  const releasedTuna: CatchRecord[] = [];
  const limitedReleases = new Map<string, CatchRecord[]>(
    LIMITED_RELEASE_SPECIES.map((name) => [name, []])
  );

  catches.forEach((catchRecord) => {
    const speciesName = catchRecord.species?.name;

    if (
      catchRecord.released &&
      speciesName &&
      limitedReleases.has(speciesName)
    ) {
      limitedReleases.get(speciesName)?.push(catchRecord);
    } else if (speciesName && limitedWeighed.has(speciesName)) {
      limitedWeighed.get(speciesName)?.push(catchRecord);
    } else if (
      speciesName &&
      LIMITED_TUNA_SPECIES.includes(
        speciesName as (typeof LIMITED_TUNA_SPECIES)[number]
      )
    ) {
      // Rule 6 and Rule 11 jointly limit Yellowfin and Bigeye tuna to
      // three weighed and three tagged/released entries.
      (catchRecord.released ? releasedTuna : weighedTuna).push(catchRecord);
    } else {
      eligible.push(catchRecord);
    }
  });

  limitedWeighed.forEach((items) => {
    eligible.push(...[...items].sort(rankForEligibility).slice(0, 3));
  });

  limitedReleases.forEach((items) => {
    eligible.push(...[...items].sort(rankForEligibility).slice(0, 3));
  });

  // Rules 6 and 11 first limit the combined Yellowfin/Bigeye category to
  // three weighed and three tag-and-release entries. Annual award Rules
  // 13(d) and 13(f) add a second limit: only the three highest-point
  // Yellowfin count across both weighed and tag-and-release entries.
  const generallyEligibleTuna = [
    ...weighedTuna.sort(rankForEligibility).slice(0, 3),
    ...releasedTuna.sort(rankForEligibility).slice(0, 3),
  ];
  const annualLimitedTuna = generallyEligibleTuna
    .filter(
      (catchRecord) =>
        catchRecord.species?.name === ANNUAL_LIMITED_TUNA_SPECIES,
    )
    .sort(rankForEligibility)
    .slice(0, 3);
  const otherTuna = generallyEligibleTuna.filter(
    (catchRecord) =>
      catchRecord.species?.name !== ANNUAL_LIMITED_TUNA_SPECIES,
  );

  eligible.push(...annualLimitedTuna, ...otherTuna);

  return eligible;
}

export function getOfficialEligiblePoints(catches: CatchRecord[]) {
  return getOfficialStandingScore(catches).points;
}

export function getOfficialStandingScore(catches: CatchRecord[]) {
  const eligibleCatches = selectOfficialCatches(catches);

  return {
    points: eligibleCatches.reduce(
    (total, catchRecord) => total + Number(catchRecord.points_awarded || 0),
      0,
    ),
    tieBreakPoints: eligibleCatches.reduce(
      (total, catchRecord) => total + getCatchTieBreakPoints(catchRecord),
      0,
    ),
  };
}

export function compareOfficialStandings(
  a: { points: number; tieBreakPoints: number },
  b: { points: number; tieBreakPoints: number },
) {
  return b.points - a.points || b.tieBreakPoints - a.tieBreakPoints;
}

export function getExcludedCatches(catches: CatchRecord[]) {
  const eligibleIds = new Set(
    selectOfficialCatches(catches).map((catchRecord) => catchRecord.id)
  );

  return catches.filter((catchRecord) => !eligibleIds.has(catchRecord.id));
}
