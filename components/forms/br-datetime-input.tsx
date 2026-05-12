"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

function isoToBrazilianDateTime(value: string) {
  const localValue = value.slice(0, 16);
  const [date, time = "00:00"] = localValue.split("T");
  const [year, month, day] = (date ?? "").split("-");

  if (!year || !month || !day) return "";
  return `${day}/${month}/${year} ${time}`;
}

function brazilianDateTimeToIso(value: string) {
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);

  if (!match) return "";

  const [, day, month, year, hour = "00", minute = "00"] = match;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function BrazilianDateTimeInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const initialDisplayValue = useMemo(
    () => isoToBrazilianDateTime(defaultValue),
    [defaultValue],
  );
  const [displayValue, setDisplayValue] = useState(initialDisplayValue);
  const isoValue = brazilianDateTimeToIso(displayValue);

  return (
    <>
      <Input
        inputMode="numeric"
        placeholder="dd/mm/aaaa hh:mm"
        value={displayValue}
        onChange={(event) => setDisplayValue(event.target.value)}
      />
      <input type="hidden" name={name} value={isoValue} />
    </>
  );
}
