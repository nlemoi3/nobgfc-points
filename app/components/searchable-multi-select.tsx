"use client";

import { useMemo, useState } from "react";

type SearchableMultiSelectOption = {
  label: string;
  value: string;
};

export default function SearchableMultiSelect({
  label,
  name,
  options,
  defaultSelectedValues = [],
  height = "220px",
}: {
  label: string;
  name: string;
  options: SearchableMultiSelectOption[];
  defaultSelectedValues?: string[];
  height?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(defaultSelectedValues),
  );

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredValues = useMemo(() => {
    if (!normalizedQuery) {
      return new Set(options.map((option) => option.value));
    }

    return new Set(
      options
        .filter((option) =>
          option.label.toLocaleLowerCase().includes(normalizedQuery),
        )
        .map((option) => option.value),
    );
  }, [normalizedQuery, options]);

  const selectedCount = selectedValues.size;

  return (
    <div>
      <label>{label}</label>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label.toLocaleLowerCase()}`}
        aria-label={`Search ${label.toLocaleLowerCase()}`}
        style={{ marginBottom: "8px", minWidth: "280px", marginTop: "6px" }}
      />

      <span style={{ display: "inline-block", marginBottom: "8px", color: "#555" }}>
        {selectedCount} selected
      </span>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          maxWidth: "500px",
          height,
          overflowY: "auto",
          background: "#fff",
        }}
      >
        {options.map((option) => {
          const visible = filteredValues.has(option.value);

          return (
            <label
              key={option.value}
              style={{
                display: visible ? "block" : "none",
                marginBottom: "6px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={selectedValues.has(option.value)}
                onChange={(event) => {
                  const next = new Set(selectedValues);

                  if (event.target.checked) {
                    next.add(option.value);
                  } else {
                    next.delete(option.value);
                  }

                  setSelectedValues(next);
                }}
                style={{ marginRight: "8px" }}
              />
              {option.label}
            </label>
          );
        })}

        {normalizedQuery && filteredValues.size === 0 && (
          <span style={{ color: "#666" }}>No matching options</span>
        )}
      </div>
    </div>
  );
}
