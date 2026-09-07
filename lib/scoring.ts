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

const BEST_THREE_SPECIES = ["Dolphin", "Wahoo", "Yellowfin Tuna"] as const;

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

function selectOfficialCatches(catches: CatchRecord[]) {
  const eligible: CatchRecord[] = [];
  const limited = new Map<string, CatchRecord[]>(
    BEST_THREE_SPECIES.map((name) => [name, []])
  );

  catches.forEach((catchRecord) => {
    const speciesName = catchRecord.species?.name;

    if (speciesName && limited.has(speciesName)) {
      limited.get(speciesName)?.push(catchRecord);
    } else {
      // Bigeye is intentionally unlimited here. The three-fish tuna rule is
      // specific to Yellowfin and must not combine the two species.
      eligible.push(catchRecord);
    }
  });

  limited.forEach((items) => {
    eligible.push(
      ...[...items]
        .sort(
          (a, b) =>
            Number(b.points_awarded || 0) - Number(a.points_awarded || 0)
        )
        .slice(0, 3)
    );
  });

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
