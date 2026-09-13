import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOfficialBoatStandings,
  buildOfficialMemberAnglerStandings,
  calculateAnnualCatchPoints,
  calculateCatchPoints,
  calculateTournamentCatchPoints,
  compareOfficialStandings,
  compareTournamentStandings,
  countsTowardTournamentAnglerStandings,
  countsTowardTournamentPointStandings,
  EVENT_SCORING_RULESETS,
  formatCatchWeight,
  getExcludedCatches,
  getEventAssignmentWarnings,
  getOfficialEligiblePoints,
  getOfficialStandingScore,
  isBillfishSpecies,
  isCatchWithinEventDates,
  isWeighedCatch,
  laterValidTimestamp,
  validateCatchInput,
  validateEventAssignment,
} from "../lib/scoring.ts";

test("tournament boat ties rank the boat that reached its total first", () => {
  const earlier = {
    points: 500,
    totalReachedAt: "2026-06-12T10:00:00-05:00",
  };
  const later = {
    points: 500,
    totalReachedAt: "2026-06-12T11:00:00-05:00",
  };

  assert.ok(compareTournamentStandings(earlier, later) < 0);
  assert.ok(compareTournamentStandings(later, earlier) > 0);
  assert.ok(
    compareTournamentStandings(
      { points: 600, totalReachedAt: later.totalReachedAt },
      earlier,
    ) < 0,
  );
  assert.ok(
    compareTournamentStandings(earlier, { points: 500, totalReachedAt: null }) <
      0,
  );
});

test("tournament attainment uses catch time even when timestamps have offsets", () => {
  const earlier = "2026-06-12T10:30:00-05:00";
  const later = "2026-06-12T16:00:00Z";

  assert.equal(laterValidTimestamp(null, earlier), earlier);
  assert.equal(laterValidTimestamp(earlier, later), later);
  assert.equal(laterValidTimestamp(later, earlier), later);
  assert.equal(laterValidTimestamp(later, "not-a-date"), later);
});

test("tournament point standings include billfish species only", () => {
  for (const speciesName of [
    "Blue Marlin",
    "White Marlin",
    "Sailfish",
    "Spearfish",
    "Swordfish",
  ]) {
    assert.equal(isBillfishSpecies(speciesName), true);
  }

  for (const speciesName of [
    "Yellowfin Tuna",
    "Bigeye Tuna",
    "Dolphin",
    "Wahoo",
  ]) {
    assert.equal(isBillfishSpecies(speciesName), false);
  }
});

test("weighed points use whole pounds and line multiplier", () => {
  assert.equal(
    calculateCatchPoints({
      speciesName: "Dolphin",
      weight: 25.6,
      lineClass: 50,
      released: false,
      tagged: false,
    }),
    37.5,
  );
});

test("fractional weighed points break otherwise tied annual standings", () => {
  const higherFraction = getOfficialStandingScore([
    {
      id: 1,
      points_awarded: 37.5,
      weight: 25.6,
      line_class: 50,
      released: false,
      tagged: false,
      species: { name: "Dolphin" },
    },
  ]);
  const lowerFraction = getOfficialStandingScore([
    {
      id: 2,
      points_awarded: 37.5,
      weight: 25.1,
      line_class: 50,
      released: false,
      tagged: false,
      species: { name: "Dolphin" },
    },
  ]);

  assert.equal(higherFraction.points, lowerFraction.points);
  assert.ok(higherFraction.tieBreakPoints > lowerFraction.tieBreakPoints);
  assert.ok(compareOfficialStandings(higherFraction, lowerFraction) < 0);
});

test("fractional line-class points select the best limited catches", () => {
  const dolphin = [
    { id: 1, weight: 20.1, line_class: 50 },
    { id: 2, weight: 20.2, line_class: 50 },
    { id: 3, weight: 20.3, line_class: 50 },
    { id: 4, weight: 20.9, line_class: 50 },
  ].map((catchRecord) => ({
    ...catchRecord,
    points_awarded: 30,
    released: false,
    tagged: false,
    species: { name: "Dolphin" },
  }));

  assert.deepEqual(
    getExcludedCatches(dolphin).map((catchRecord) => catchRecord.id),
    [1],
  );
});

test("billfish release and tag bonuses follow club rules", () => {
  assert.equal(
    calculateCatchPoints({
      speciesName: "Blue Marlin",
      weight: null,
      lineClass: 130,
      released: true,
      tagged: false,
    }),
    500,
  );
  assert.equal(
    calculateCatchPoints({
      speciesName: "White Marlin",
      weight: null,
      lineClass: 130,
      released: true,
      tagged: false,
    }),
    150,
  );
  assert.equal(
    calculateCatchPoints({
      speciesName: "Blue Marlin",
      weight: null,
      lineClass: 30,
      released: true,
      tagged: true,
    }),
    1050,
  );
  assert.equal(
    calculateCatchPoints({
      speciesName: "Sailfish",
      weight: null,
      lineClass: 20,
      released: true,
      tagged: true,
    }),
    475,
  );
});

test("NOIBT release values ignore line class and tournament tag bonuses", () => {
  assert.equal(
    calculateTournamentCatchPoints({
      eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
      speciesName: "Blue Marlin",
      weight: null,
      lineClass: 2,
      released: true,
      tagged: true,
    }),
    500,
  );

  for (const speciesName of ["White Marlin", "Sailfish", "Spearfish"]) {
    assert.equal(
      calculateTournamentCatchPoints({
        eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
        speciesName,
        weight: null,
        lineClass: 2,
        released: true,
        tagged: true,
      }),
      200,
    );
  }
});

test("NOIBT weighed fish score one tournament point per pound", () => {
  for (const speciesName of [
    "Blue Marlin",
    "Dolphin",
    "Yellowfin Tuna",
    "Bigeye Tuna",
    "Wahoo",
  ]) {
    assert.equal(
      calculateTournamentCatchPoints({
        eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
        speciesName,
        weight: 125.6,
        lineClass: 2,
        released: false,
        tagged: false,
      }),
      125.6,
    );
  }

  assert.equal(
    calculateTournamentCatchPoints({
      eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
      speciesName: "Swordfish",
      weight: null,
      lineClass: 130,
      released: true,
      tagged: false,
    }),
    0,
  );
});

test("NOIBT release teams and Top Angler use their distinct eligible catches", () => {
  const noibt = EVENT_SCORING_RULESETS.NOIBT_2026;

  assert.equal(
    countsTowardTournamentPointStandings({
      eventScoringRuleset: noibt,
      speciesName: "Blue Marlin",
      released: true,
    }),
    true,
  );
  assert.equal(
    countsTowardTournamentPointStandings({
      eventScoringRuleset: noibt,
      speciesName: "Blue Marlin",
      released: false,
    }),
    false,
  );
  assert.equal(
    countsTowardTournamentAnglerStandings({
      eventScoringRuleset: noibt,
      speciesName: "Blue Marlin",
      released: false,
    }),
    true,
  );
  assert.equal(
    countsTowardTournamentAnglerStandings({
      eventScoringRuleset: noibt,
      speciesName: "Dolphin",
      released: false,
    }),
    false,
  );
});

test("one tagged NOIBT White Marlin produces independent tournament and annual scores", () => {
  const catchInput = {
    eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
    speciesName: "White Marlin",
    weight: null,
    lineClass: 50,
    released: true,
    tagged: true,
  };

  assert.equal(calculateTournamentCatchPoints(catchInput), 200);
  assert.equal(calculateAnnualCatchPoints(catchInput), 250);
});

test("an untagged NOIBT billfish release earns tournament points but no annual club points", () => {
  const catchInput = {
    eventScoringRuleset: EVENT_SCORING_RULESETS.NOIBT_2026,
    speciesName: "White Marlin",
    weight: null,
    lineClass: 50,
    released: true,
    tagged: false,
  };

  assert.equal(calculateTournamentCatchPoints(catchInput), 200);
  assert.equal(calculateAnnualCatchPoints(catchInput), 0);
});

test("guest catches count for boats but not member-individual standings", () => {
  const guestCatch = {
    id: 1,
    status: "approved",
    points_awarded: 500,
    released: true,
    tagged: false,
    weight: null,
    line_class: 130,
    boats: { id: 4, name: "Guest Boat" },
    anglers: {
      id: 8,
      first_name: "Guest",
      last_name: "Angler",
      is_member: false,
    },
    species: { name: "Blue Marlin" },
  };

  assert.equal(buildOfficialBoatStandings([guestCatch])[0]?.points, 500);
  assert.deepEqual(buildOfficialMemberAnglerStandings([guestCatch]), []);
});

test("ordinary approved event catches score without a roster record", () => {
  const ordinaryCatch = {
    id: 2,
    status: "approved",
    points_awarded: 150,
    released: true,
    tagged: false,
    weight: null,
    line_class: 130,
    boats: { id: 5, name: "Ordinary Boat" },
    anglers: {
      id: 9,
      first_name: "Club",
      last_name: "Member",
      is_member: true,
    },
    species: { name: "White Marlin" },
  };

  assert.equal(buildOfficialBoatStandings([ordinaryCatch])[0]?.points, 150);
  assert.equal(
    buildOfficialMemberAnglerStandings([ordinaryCatch])[0]?.points,
    150,
  );
});

test("pending and rejected catches are excluded from published standings", () => {
  const catches = ["approved", "pending", "rejected"].map((status, index) => ({
    id: index + 1,
    status,
    points_awarded: 500,
    released: true,
    tagged: false,
    weight: null,
    line_class: 130,
    boats: { id: 6, name: "Review Boat" },
    anglers: {
      id: 10,
      first_name: "Review",
      last_name: "Angler",
      is_member: true,
    },
    species: { name: "Blue Marlin" },
  }));

  assert.equal(buildOfficialBoatStandings(catches)[0]?.points, 500);
  assert.equal(
    buildOfficialMemberAnglerStandings(catches)[0]?.points,
    500,
  );
});

test("released tuna receives 100 points without a line bonus", () => {
  assert.equal(
    calculateCatchPoints({
      speciesName: "Yellowfin Tuna",
      weight: null,
      lineClass: 2,
      released: true,
      tagged: true,
    }),
    100,
  );
});

test("only the three highest-point Yellowfin count across weighed and released entries", () => {
  const yellowfin = [
    { id: 1, points_awarded: 90, released: false, tagged: false, weight: 90 },
    { id: 2, points_awarded: 80, released: false, tagged: false, weight: 80 },
    { id: 3, points_awarded: 70, released: false, tagged: false, weight: 70 },
    { id: 4, points_awarded: 100, released: true, tagged: true, weight: null },
    { id: 5, points_awarded: 100, released: true, tagged: true, weight: null },
    { id: 6, points_awarded: 100, released: true, tagged: true, weight: null },
  ].map((catchRecord) => ({
    ...catchRecord,
    species: { name: "Yellowfin Tuna" },
  }));

  assert.equal(getOfficialEligiblePoints(yellowfin), 300);
  assert.deepEqual(
    getExcludedCatches(yellowfin).map((catchRecord) => catchRecord.id),
    [1, 2, 3],
  );
});

test("Bigeye does not consume the annual three-Yellowfin limit", () => {
  const tuna = [
    { id: 1, points_awarded: 100, released: true, tagged: true, weight: null, species: { name: "Yellowfin Tuna" } },
    { id: 2, points_awarded: 100, released: true, tagged: true, weight: null, species: { name: "Yellowfin Tuna" } },
    { id: 3, points_awarded: 100, released: true, tagged: true, weight: null, species: { name: "Yellowfin Tuna" } },
    { id: 4, points_awarded: 200, released: false, tagged: false, weight: 200, species: { name: "Bigeye Tuna" } },
  ];

  assert.equal(getOfficialEligiblePoints(tuna), 500);
  assert.deepEqual(getExcludedCatches(tuna), []);
});

test("release estimates are labeled and excluded from weighed records", () => {
  const releasedEstimate = {
    weight: 250,
    released: true,
  };

  assert.equal(formatCatchWeight(releasedEstimate), "250 lbs (estimated)");
  assert.equal(isWeighedCatch(releasedEstimate), false);
  assert.equal(isWeighedCatch({ weight: 250, released: false }), true);
});

test("only three released Swordfish count toward an official total", () => {
  const swordfishReleases = [1, 2, 3, 4].map((id) => ({
    id,
    points_awarded: 150,
    released: true,
    tagged: false,
    weight: null,
    species: { name: "Swordfish" },
  }));

  assert.equal(getOfficialEligiblePoints(swordfishReleases), 450);
  assert.deepEqual(
    getExcludedCatches(swordfishReleases).map((catchRecord) => catchRecord.id),
    [4],
  );
});

test("minimum weight and tag/release combinations are enforced", () => {
  assert.deepEqual(
    validateCatchInput({
      speciesName: "Wahoo",
      minimumWeight: 20,
      weight: 8,
      lineClass: 50,
      released: false,
      tagged: false,
    }),
    ["Wahoo must weigh at least 20 lb."],
  );

  assert.deepEqual(
    validateCatchInput({
      speciesName: "Blue Marlin",
      minimumWeight: null,
      weight: null,
      lineClass: 130,
      released: false,
      tagged: true,
    }),
    [
      "A tagged fish must also be marked released.",
      "A weight is required for a weighed catch.",
    ],
  );
});

test("date discrepancies are review warnings rather than automatic decisions", () => {
  assert.deepEqual(
    validateEventAssignment({
      catchDateTime: "2027-05-15T08:00",
      eventStartDate: "2027-05-15",
      eventEndDate: "2027-05-16",
      eventStatus: "scheduled",
    }),
    [],
  );

  assert.deepEqual(
    validateEventAssignment({
      catchDateTime: "2027-05-17T08:00",
      eventStartDate: "2027-05-15",
      eventEndDate: "2027-05-16",
      eventStatus: "scheduled",
    }),
    [],
  );

  assert.deepEqual(
    getEventAssignmentWarnings({
      catchDateTime: "2027-05-17T08:00",
      eventStartDate: "2027-05-15",
      eventEndDate: "2027-05-16",
      eventStatus: "scheduled",
    }),
    ["The catch date falls outside the selected event dates."],
  );

  assert.deepEqual(
    validateEventAssignment({
      catchDateTime: "2027-05-15T08:00",
      eventStartDate: "2027-05-15",
      eventEndDate: "2027-05-16",
      eventStatus: "locked",
    }),
    ["The selected event is locked."],
  );
});

test("event eligibility uses the catch date, not the later entry date", () => {
  assert.equal(
    isCatchWithinEventDates(
      "2027-05-15T23:30:00-05:00",
      "2027-05-15",
      "2027-05-16",
    ),
    true,
  );
  assert.equal(
    isCatchWithinEventDates(
      "2027-05-17T05:01:00Z",
      "2027-05-15",
      "2027-05-16",
    ),
    false,
  );
  assert.equal(
    isCatchWithinEventDates(
      "2027-05-17T04:30:00Z",
      "2027-05-15",
      "2027-05-16",
    ),
    true,
  );
});

test("locked and cancelled events reject catch assignment", () => {
  for (const eventStatus of ["locked", "cancelled"]) {
    assert.deepEqual(
      validateEventAssignment({
        catchDateTime: "2027-05-01T09:30",
        eventStartDate: "2027-05-01",
        eventEndDate: "2027-05-02",
        eventStatus,
      }),
      [`The selected event is ${eventStatus}.`],
    );
  }
});

test("non-tournament event assignment is flagged for official review", () => {
  assert.deepEqual(
    validateEventAssignment({
      catchDateTime: "2027-04-18T18:00",
      eventStartDate: "2027-04-18",
      eventEndDate: "2027-04-18",
      eventStatus: "completed",
      eventIsTournament: false,
    }),
    [],
  );
  assert.deepEqual(
    getEventAssignmentWarnings({
      catchDateTime: "2027-04-18T18:00",
      eventStartDate: "2027-04-18",
      eventEndDate: "2027-04-18",
      eventStatus: "completed",
      eventIsTournament: false,
    }),
    ["The selected event is not classified as a tournament."],
  );
});
