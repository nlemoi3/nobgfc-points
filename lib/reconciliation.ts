import {
  calculateCatchPoints,
  compareOfficialStandings,
  getExcludedCatches,
  getOfficialStandingScore,
  isCatchWithinEventDates,
} from "./scoring";
import { getSubmissionTiming } from "./submission-timing";

export function getCatchChecks(catchRecord: any) {
  const expectedPoints = calculateCatchPoints({
    speciesName: catchRecord.species?.name || "",
    weight:
      catchRecord.weight === null ? null : Number(catchRecord.weight),
    lineClass: Number(catchRecord.line_class || 130),
    released: Boolean(catchRecord.released),
    tagged: Boolean(catchRecord.tagged),
  });
  const storedPoints = Number(catchRecord.points_awarded || 0);
  const scoreMatches = Math.abs(storedPoints - expectedPoints) < 0.01;
  const eventDateMatches = isCatchWithinEventDates(
    catchRecord.catch_datetime,
    catchRecord.events?.start_date,
    catchRecord.events?.end_date,
  );
  const submissionTiming = getSubmissionTiming({
    released: Boolean(catchRecord.released),
    tagged: Boolean(catchRecord.tagged),
    submittedAt: catchRecord.created_at || null,
    eventEndDate: catchRecord.events?.end_date || null,
  });

  return {
    expectedPoints,
    storedPoints,
    difference: storedPoints - expectedPoints,
    scoreMatches,
    eventDateMatches,
    submissionTiming,
    hasException:
      !scoreMatches || !eventDateMatches || submissionTiming.isLate,
  };
}

export function buildBoatStandings(catches: any[]) {
  const groups = new Map<
    number,
    { boatId: number; boatName: string; catches: any[] }
  >();

  for (const catchRecord of catches) {
    const boatId = Number(catchRecord.boat_id || catchRecord.boats?.id);
    if (!boatId) continue;

    const group = groups.get(boatId) || {
      boatId,
      boatName: catchRecord.boats?.name || "Unknown Boat",
      catches: [],
    };
    group.catches.push(catchRecord);
    groups.set(boatId, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const score = getOfficialStandingScore(group.catches);
      return {
        boatId: group.boatId,
        boatName: group.boatName,
        approvedCatches: group.catches.length,
        countingCatches:
          group.catches.length - getExcludedCatches(group.catches).length,
        officialPoints: score.points,
        ...score,
      };
    })
    .sort(
      (left, right) =>
        compareOfficialStandings(left, right) ||
        left.boatName.localeCompare(right.boatName),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
