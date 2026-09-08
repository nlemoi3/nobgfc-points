"use client";

import { useState } from "react";

type CatchEventOption = {
  id: number | string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status?: string | null;
};

function findMatchingEventId(
  events: CatchEventOption[],
  catchDateTime: string,
) {
  const catchDate = catchDateTime.slice(0, 10);

  if (!catchDate) return "";

  const matchingEvent = events.find((event) => {
    if (
      !event.start_date ||
      ["locked", "cancelled"].includes(event.status || "")
    ) {
      return false;
    }

    const startDate = event.start_date;
    const endDate = event.end_date || event.start_date;

    return startDate <= catchDate && catchDate <= endDate;
  });

  return matchingEvent ? String(matchingEvent.id) : "";
}

export default function CatchEventFields({
  events,
  defaultDateTime = "",
  defaultEventId = "",
  disabled = false,
}: {
  events: CatchEventOption[];
  defaultDateTime?: string;
  defaultEventId?: number | string | null;
  disabled?: boolean;
}) {
  const [catchDateTime, setCatchDateTime] = useState(defaultDateTime);
  const [eventId, setEventId] = useState(defaultEventId ? String(defaultEventId) : "");


  return (
    <>
      <p>
        <label>Catch Date & Time</label>
        <br />
        <input
          name="catch_datetime"
          type="datetime-local"
          required
          value={catchDateTime}
          onChange={(event) => {
            const nextCatchDateTime = event.target.value;
            setCatchDateTime(nextCatchDateTime);
            setEventId(findMatchingEventId(events, nextCatchDateTime));
          }}
          disabled={disabled}
        />
        <br />
        <span className="hint">
          Enter when the fish was caught, not when this form is submitted.
        </span>
      </p>

      <p>
        <label>Event</label>
        <br />
        <select
          name="event_id"
          required
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          disabled={disabled}
        >
          <option value="">Select event</option>
          {events.map((event) => {
            const unavailable = ["locked", "cancelled"].includes(
              event.status || "",
            );

            return (
              <option key={event.id} value={event.id} disabled={unavailable}>
                {event.name} {unavailable ? `(${event.status})` : ""}
              </option>
            );
          })}
        </select>
      </p>
    </>
  );
}
