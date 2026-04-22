import { cn } from "@/lib/utils";

const fifaToIso2: Record<string, string> = {
  ARG: "ar",
  ALG: "dz",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CRO: "hr",
  CPV: "cv",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GHA: "gh",
  GER: "de",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  USA: "us",
  URU: "uy",
  UZB: "uz",
};

export function TeamFlag({
  code,
  className,
}: {
  code?: string;
  className?: string;
}) {
  const iso2 = code ? fifaToIso2[code.toUpperCase()] : "xx";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "fi fis inline-block overflow-hidden",
        iso2 ? `fi-${iso2}` : "fi-xx",
        className,
      )}
    />
  );
}
