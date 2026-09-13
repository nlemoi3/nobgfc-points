import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("annual award and champion previews are limited to the active season", () => {
  for (const page of [
    source("../app/awards/page.tsx"),
    source("../app/admin/season-champions/page.tsx"),
  ]) {
    assert.match(page, /getActiveSeasonRange/);
    assert.match(page, /\.gte\("catch_datetime", start\)/);
    assert.match(page, /\.lt\("catch_datetime", end\)/);
  }
});

test("aggregate tournament standings enforce the same event dates as details", () => {
  const page = source("../app/tournament-standings/page.tsx");
  assert.match(page, /isCatchWithinEventDates\(c\.catch_datetime, event\.start_date, event\.end_date\)/);
});

test("catch creation and editing convert Central Time before persistence", () => {
  const createAction = source("../app/admin/catch-entry/actions.ts");
  const editPage = source("../app/admin/catches/[id]/page.tsx");

  assert.match(createAction, /clubDateTimeToIso\(catchDateTimeInput\)/);
  assert.match(editPage, /clubDateTimeToIso\(catchDateTimeInput\)/);
  assert.match(editPage, /isoToClubDateTimeInput\(catchRecord\.catch_datetime\)/);
});

test("login displays successful authentication-link completion messages", () => {
  const loginPage = source("../app/login/page.tsx");
  assert.match(loginPage, /message\?: string/);
  assert.match(loginPage, /alert alert-success/);
});
