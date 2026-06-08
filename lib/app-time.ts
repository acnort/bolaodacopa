export const APP_TIME_ZONE = "America/Sao_Paulo";
export const APP_TIME_ZONE_OFFSET = "-03:00";

const BRAZILIAN_DATE_TIME_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;
const ISO_WITHOUT_TIME_ZONE_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)$/;
const TIME_ZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

function toIsoString(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function normalizeAppDateTimeToIso(value: string) {
  const trimmedValue = value.trim();

  const brazilianMatch = trimmedValue.match(BRAZILIAN_DATE_TIME_PATTERN);
  if (brazilianMatch) {
    const [, day, month, year, hour = "00", minute = "00"] = brazilianMatch;
    return toIsoString(
      `${year}-${month}-${day}T${hour}:${minute}:00${APP_TIME_ZONE_OFFSET}`,
    );
  }

  if (
    ISO_WITHOUT_TIME_ZONE_PATTERN.test(trimmedValue) &&
    !TIME_ZONE_SUFFIX_PATTERN.test(trimmedValue)
  ) {
    return toIsoString(`${trimmedValue}${APP_TIME_ZONE_OFFSET}`);
  }

  return toIsoString(trimmedValue);
}
