"use client";

import { useEffect, useState } from "react";

type CatchEventOption = {
  id: number | string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status?: string | null;
};

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

  useEffect(() => {
    const catchDate = catchDateTime.slice(0, 10);

    if (!catchDate || disabled) {
      return;
    }

    const matchingEvent = events.find((event) => {
      if (!event.start_date) {
        return false;
      }

      const startDate = event.start_date;
      const endDate = event.end_date || event.start_date;

      return startDate <= catchDate && catchDate <= endDate;
    });

    setEventId(matchingEvent ? String(matchingEvent.id) : "");
  }, [catchDateTime, disabled, events]);

  return (
    <>
      <p>
        <label>Catch Date & Time</label>
        <br />
        <input
          name="catch_datetime"
          type="datetime-local"
          value={catchDateTime}
          onChange={(event) => setCatchDateTime(event.target.value)}
          disabled={disabled}
        />
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
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} {event.status === "locked" ? "(locked)" : ""}
            </option>
          ))}
        </select>
      </p>
    </>
  );
}
