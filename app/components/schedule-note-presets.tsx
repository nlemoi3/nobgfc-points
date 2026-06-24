"use client";

import { useState } from "react";

const PRESETS = [
  {
    label: "Cancelled (Weather)",
    text: "Cancelled due to weather conditions. This tournament will not be fished on the original dates.",
  },
  {
    label: "Rescheduled",
    text: "Rescheduled. Please see updated tournament dates above.",
  },
  {
    label: "Moved (Weather Delay)",
    text: "Moved due to weather. The event has been shifted to the updated dates listed above.",
  },
  {
    label: "Moved (Logistics)",
    text: "Moved due to operational logistics. Updated dates are posted above.",
  },
];

export default function ScheduleNotePresets({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="schedule-presets">
      <div className="schedule-preset-row" role="group" aria-label="Scheduling note templates">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="schedule-preset-btn"
            onClick={() => setValue(preset.text)}
          >
            {preset.label}
          </button>
        ))}

        <button
          type="button"
          className="schedule-preset-btn schedule-preset-clear"
          onClick={() => setValue("")}
        >
          Clear
        </button>
      </div>

      <textarea
        name="notes"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        placeholder="Example: Moved due to weather. New dates June 24-25."
      />
    </div>
  );
}
