export type CatchRecord = {
  id: number;
  points_awarded: number | null;
  released: boolean | null;
  tagged: boolean | null;
  weight: number | null;
  species?: {
    name: string;
  } | null;
};

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

type PointCalculationInput = {
  speciesName: string;
  weight: number | null;
  lineClass: number;
  released: boolean;
  tagged: boolean;
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
};

export function validateEventAssignment(input: EventAssignmentValidationInput) {
  const errors: string[] = [];
  const catchDate = input.catchDateTime?.slice(0, 10) || "";
  const eventStart = input.eventStartDate || "";
  const eventEnd = input.eventEndDate || eventStart;

  if (!catchDate) {
    errors.push("Catch date and time are required.");
  } else if (!eventStart || catchDate < eventStart || catchDate > eventEnd) {
    errors.push("Catch date must fall within the selected event dates.");
  }

  if (["locked", "cancelled"].includes(input.eventStatus || "")) {
    errors.push(`The selected event is ${input.eventStatus}.`);
  }

  return errors;
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

function rankForEligibility(a: CatchRecord, b: CatchRecord) {
  return (
    Number(b.points_awarded || 0) - Number(a.points_awarded || 0) ||
    Number(b.weight || 0) - Number(a.weight || 0) ||
    a.id - b.id
  );
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
  return selectOfficialCatches(catches).reduce(
    (total, catchRecord) => total + Number(catchRecord.points_awarded || 0),
    0
  );
}

export function getExcludedCatches(catches: CatchRecord[]) {
  const eligibleIds = new Set(
    selectOfficialCatches(catches).map((catchRecord) => catchRecord.id)
  );

  return catches.filter((catchRecord) => !eligibleIds.has(catchRecord.id));
}
