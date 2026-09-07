import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCatchPoints,
  validateCatchInput,
  validateEventAssignment,
} from "../lib/scoring.ts";

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
