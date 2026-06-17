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

const LIMITED_TO_BEST_THREE = ["Dolphin", "Wahoo"];

const TUNA_SPECIES = ["Yellowfin Tuna", "Bigeye Tuna"];

export function getOfficialEligiblePoints(catches: CatchRecord[]) {
  const unlimited: CatchRecord[] = [];
  const dolphin: CatchRecord[] = [];
  const wahoo: CatchRecord[] = [];
  const tuna: CatchRecord[] = [];

  catches.forEach((catchRecord) => {
    const speciesName = catchRecord.species?.name;

    if (speciesName === "Dolphin") {
      dolphin.push(catchRecord);
    } else if (speciesName === "Wahoo") {
      wahoo.push(catchRecord);
    } else if (speciesName && TUNA_SPECIES.includes(speciesName)) {
      tuna.push(catchRecord);
    } else {
      unlimited.push(catchRecord);
    }
  });

  const bestThree = (items: CatchRecord[]) =>
    items
      .sort(
        (a, b) =>
          Number(b.points_awarded || 0) - Number(a.points_awarded || 0)
      )
      .slice(0, 3);

  const eligibleCatches = [
    ...unlimited,
    ...bestThree(dolphin),
    ...bestThree(wahoo),
    ...bestThree(tuna),
  ];

  return eligibleCatches.reduce(
    (total, catchRecord) => total + Number(catchRecord.points_awarded || 0),
    0
  );
}

export function getExcludedCatches(catches: CatchRecord[]) {
  const eligibleIds = new Set<number>();

  const unlimited: CatchRecord[] = [];
  const dolphin: CatchRecord[] = [];
  const wahoo: CatchRecord[] = [];
  const tuna: CatchRecord[] = [];

  catches.forEach((catchRecord) => {
    const speciesName = catchRecord.species?.name;

    if (speciesName === "Dolphin") {
      dolphin.push(catchRecord);
    } else if (speciesName === "Wahoo") {
      wahoo.push(catchRecord);
    } else if (speciesName && TUNA_SPECIES.includes(speciesName)) {
      tuna.push(catchRecord);
    } else {
      unlimited.push(catchRecord);
    }
  });

  const bestThree = (items: CatchRecord[]) =>
    items
      .sort(
        (a, b) =>
          Number(b.points_awarded || 0) - Number(a.points_awarded || 0)
      )
      .slice(0, 3);

  [...unlimited, ...bestThree(dolphin), ...bestThree(wahoo), ...bestThree(tuna)]
    .forEach((catchRecord) => eligibleIds.add(catchRecord.id));

  return catches.filter((catchRecord) => !eligibleIds.has(catchRecord.id));
}