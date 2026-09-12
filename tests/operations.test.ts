import assert from "node:assert/strict";
import test from "node:test";
import { createCsv, escapeCsvValue } from "../lib/csv.ts";
import {
  canRunCompetitionOperations,
  isRoleAuthorized,
} from "../lib/role-access.ts";
import { getSubmissionTiming } from "../lib/submission-timing.ts";

test("tag and release submissions are due seven days after tournament end", () => {
  const onTime = getSubmissionTiming({
    released: true,
    tagged: false,
    submittedAt: "2026-09-12T23:59:00-05:00",
    eventEndDate: "2026-09-05",
  });
  const late = getSubmissionTiming({
    released: false,
    tagged: true,
    submittedAt: "2026-09-14T01:00:00-05:00",
    eventEndDate: "2026-09-05",
  });

  assert.equal(onTime.deadlineDate, "2026-09-12");
  assert.equal(onTime.isLate, false);
  assert.equal(late.isLate, true);
  assert.equal(late.daysLate, 2);
});

test("weighed catches do not receive the tag and release submission warning", () => {
  const timing = getSubmissionTiming({
    released: false,
    tagged: false,
    submittedAt: "2026-10-01T12:00:00Z",
    eventEndDate: "2026-09-05",
  });

  assert.equal(timing.applies, false);
  assert.equal(timing.isLate, false);
});

test("CSV output escapes commas, quotes, and line breaks", () => {
  assert.equal(escapeCsvValue('Board review, "pending"'), '"Board review, ""pending"""');
  assert.equal(
    createCsv(["Name", "Notes"], [["TENACIOUS", "Line one\nLine two"]]),
    'Name,Notes\r\nTENACIOUS,"Line one\nLine two"',
  );
});

test("CSV output neutralizes spreadsheet formulas", () => {
  assert.equal(escapeCsvValue("=1+1"), "'=1+1");
  assert.equal(escapeCsvValue("+123"), "'+123");
});

test("competition operations remain limited to weighmasters and admins", () => {
  assert.equal(canRunCompetitionOperations("member"), false);
  assert.equal(canRunCompetitionOperations("boat"), false);
  assert.equal(canRunCompetitionOperations("weighmaster"), true);
  assert.equal(canRunCompetitionOperations("admin"), true);
  assert.equal(isRoleAuthorized("admin", "weighmaster"), true);
  assert.equal(isRoleAuthorized("weighmaster", "admin"), false);
});
