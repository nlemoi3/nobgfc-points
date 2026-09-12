import assert from "node:assert/strict";
import test from "node:test";
import { createCsv, escapeCsvValue } from "../lib/csv.ts";
import {
  CATCH_DRAFT_MAX_AGE_MS,
  isValidSubmissionToken,
  parseCatchEntryDraft,
} from "../lib/catch-entry.ts";
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

test("catch submission tokens must be UUIDs", () => {
  assert.equal(
    isValidSubmissionToken("123e4567-e89b-42d3-a456-426614174000"),
    true,
  );
  assert.equal(isValidSubmissionToken("same-catch"), false);
  assert.equal(isValidSubmissionToken(null), false);
});

test("a valid catch draft can be restored", () => {
  const now = Date.UTC(2026, 8, 12);
  const restored = parseCatchEntryDraft(
    JSON.stringify({
      savedAt: now - 1000,
      entry_token: "123e4567-e89b-42d3-a456-426614174000",
      event_id: "12",
      boat_id: "4",
      angler_id: "8",
      species_id: "2",
      weight: "25.6",
      line_class: "50",
      released: false,
      tagged: false,
      catch_datetime: "2026-09-04T16:30",
    }),
    now,
  );

  assert.equal(restored?.event_id, "12");
  assert.equal(restored?.weight, "25.6");
  assert.equal(restored?.catch_datetime, "2026-09-04T16:30");
});

test("expired or corrupt catch drafts are discarded", () => {
  const now = Date.UTC(2026, 8, 12);
  const expired = JSON.stringify({
    savedAt: now - CATCH_DRAFT_MAX_AGE_MS - 1,
    entry_token: "123e4567-e89b-42d3-a456-426614174000",
  });

  assert.equal(parseCatchEntryDraft(expired, now), null);
  assert.equal(parseCatchEntryDraft("not-json", now), null);
});
