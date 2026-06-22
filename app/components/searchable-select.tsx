"use client";

import { useMemo, useState } from "react";

type SearchableSelectOption = {
  label: string;
  value: string;
};

export default function SearchableSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: SearchableSelectOption[];
}) {
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const visibleOptions =
    selectedValue &&
    !filteredOptions.some((option) => option.value === selectedValue)
      ? [
          options.find((option) => option.value === selectedValue),
          ...filteredOptions,
        ].filter((option): option is SearchableSelectOption => Boolean(option))
      : filteredOptions;

  const inputId = `${name}-search`;
  const selectId = `${name}-select`;

  return (
    <p>
      <label htmlFor={selectId}>{label}</label>
      <br />
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label.toLocaleLowerCase()}s`}
        aria-label={`Search ${label.toLocaleLowerCase()}s`}
        aria-controls={selectId}
        style={{ marginBottom: "6px", minWidth: "220px" }}
      />
      <br />
      <select
        id={selectId}
        name={name}
        required
        value={selectedValue}
        onChange={(event) => setSelectedValue(event.target.value)}
        style={{ minWidth: "220px" }}
      >
        <option value="">Select {label.toLocaleLowerCase()}</option>
        {visibleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {query && filteredOptions.length === 0 && (
        <span
          role="status"
          style={{ display: "block", marginTop: "4px", color: "#666" }}
        >
          No matching {label.toLocaleLowerCase()}s
        </span>
      )}
    </p>
  );
}
