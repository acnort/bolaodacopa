"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { APP_TIME_ZONE, normalizeAppDateTimeToIso } from "@/lib/app-time";

function isoToBrazilianDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");
  const hour = getPart("hour");
  const minute = getPart("minute");

  if (!day || !month || !year || !hour || !minute) return "";
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function brazilianDateTimeToIso(value: string) {
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);

  if (!match) return "";

  const [, day, month, year, hour = "00", minute = "00"] = match;
  return normalizeAppDateTimeToIso(`${day}/${month}/${year} ${hour}:${minute}`);
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
