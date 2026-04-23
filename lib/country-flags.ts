const COUNTRY_CODES: Record<string, string> = {
  "United States": "us",
  "Dominican Republic": "do",
  Venezuela: "ve",
  Japan: "jp",
  Cuba: "cu",
  Mexico: "mx",
  Canada: "ca",
  Colombia: "co",
  Panama: "pa",
  "Puerto Rico": "pr",
  Curacao: "cw",
  "South Korea": "kr",
  Australia: "au",
  Aruba: "aw",
  Bahamas: "bs",
  Brazil: "br",
  Germany: "de",
  Nicaragua: "ni",
  Netherlands: "nl",
  Taiwan: "tw",
};

export function normalizeCountry(country?: string | null) {
  const value = String(country || "").trim();
  if (!value) return "Unknown";
  const normalized: Record<string, string> = {
    USA: "United States",
    "United States of America": "United States",
    "D.R.": "Dominican Republic",
    DR: "Dominican Republic",
    "Dominican Rep.": "Dominican Republic",
    "Korea, South": "South Korea",
    "Republic of Korea": "South Korea",
    Curacao: "Curacao",
    Curaçao: "Curacao",
  };
  return normalized[value] || value;
}

export function countryCode(country?: string | null) {
  return COUNTRY_CODES[normalizeCountry(country)] || null;
}

export function countryFlagUrl(country?: string | null) {
  const code = countryCode(country);
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

export function nationalTeamLabel(country?: string | null) {
  const normalized = normalizeCountry(country);
  return normalized === "Unknown" ? null : `${normalized} National Team`;
}
