import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCatchPoints,
  formatCatchWeight,
  getExcludedCatches,
  getOfficialEligiblePoints,
  isBillfishSpecies,
  isWeighedCatch,
  validateCatchInput,
  validateEventAssignment,
} from "../lib/scoring.ts";

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

test("billfish release and tag bonuses follow club rules", () => {
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

test("catch date must fall inside an unlocked event", () => {
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
    ["Catch date must fall within the selected event dates."],
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
