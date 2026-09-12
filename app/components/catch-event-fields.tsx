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
  onValuesChange,
}: {
  events: CatchEventOption[];
  defaultDateTime?: string;
  defaultEventId?: number | string | null;
  disabled?: boolean;
  onValuesChange?: (values: {
    catchDateTime: string;
    eventId: string;
  }) => void;
}) {
  const [catchDateTime, setCatchDateTime] = useState(defaultDateTime);
  const [eventId, setEventId] = useState(defaultEventId ? String(defaultEventId) : "");


  return (
    <>
      <p>
        <label htmlFor="catch-datetime">Catch Date & Time</label>
        <br />
        <input
          id="catch-datetime"
          name="catch_datetime"
          type="datetime-local"
          required
          value={catchDateTime}
          onChange={(event) => {
            event.stopPropagation();
            const nextCatchDateTime = event.target.value;
            const nextEventId = findMatchingEventId(events, nextCatchDateTime);
            setCatchDateTime(nextCatchDateTime);
            setEventId(nextEventId);
            onValuesChange?.({
              catchDateTime: nextCatchDateTime,
              eventId: nextEventId,
            });
          }}
          disabled={disabled}
        />
        <br />
        <span className="hint">
          Enter when the fish was caught, not when this form is submitted.
        </span>
      </p>

      <p>
        <label htmlFor="catch-event">Event</label>
        <br />
        <select
          id="catch-event"
          name="event_id"
          required
          value={eventId}
          onChange={(event) => {
            event.stopPropagation();
            const nextEventId = event.target.value;
            setEventId(nextEventId);
            onValuesChange?.({ catchDateTime, eventId: nextEventId });
          }}
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
