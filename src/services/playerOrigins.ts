import { DATA_TTL, cachedJson } from "@/src/data/cache";

export type OriginCluster = {
  country: string;
  count: number;
  lat: number;
  lon: number;
  topPlayer: string;
};

type PeopleResponse = {
  people?: Array<{
    id?: number;
    fullName?: string;
    active?: boolean;
    birthCountry?: string;
  }>;
};

const SEASON = new Date().getFullYear();

const COUNTRY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  USA: { lat: 39, lon: -98, label: "United States" },
  "United States": { lat: 39, lon: -98, label: "United States" },
  "Dominican Republic": { lat: 18.7, lon: -70.2, label: "Dominican Republic" },
  Venezuela: { lat: 7, lon: -66, label: "Venezuela" },
  Cuba: { lat: 21.5, lon: -80, label: "Cuba" },
  Japan: { lat: 36, lon: 138, label: "Japan" },
  Canada: { lat: 56, lon: -106, label: "Canada" },
  Mexico: { lat: 23.6, lon: -102, label: "Mexico" },
  Colombia: { lat: 4.5, lon: -74, label: "Colombia" },
  Panama: { lat: 8.5, lon: -80, label: "Panama" },
  "Puerto Rico": { lat: 18.2, lon: -66.5, label: "Puerto Rico" },
  Curaçao: { lat: 12.2, lon: -69, label: "Curacao" },
  Curacao: { lat: 12.2, lon: -69, label: "Curacao" },
  Korea: { lat: 36.5, lon: 127.8, label: "Korea" },
  "South Korea": { lat: 36.5, lon: 127.8, label: "South Korea" },
  Australia: { lat: -25, lon: 133, label: "Australia" },
  Aruba: { lat: 12.5, lon: -69.97, label: "Aruba" },
  Nicaragua: { lat: 12.8, lon: -85, label: "Nicaragua" },
  Bahamas: { lat: 25, lon: -77.4, label: "Bahamas" },
  Germany: { lat: 51, lon: 10, label: "Germany" },
  Taiwan: { lat: 23.7, lon: 121, label: "Taiwan" },
};

function coords(country: string) {
  return COUNTRY_COORDS[country] || null;
}

export async function fetchPlayerOriginClusters(): Promise<OriginCluster[]> {
  const data = await cachedJson<PeopleResponse>(
    `https://statsapi.mlb.com/api/v1/sports/1/players?season=${SEASON}`,
    DATA_TTL.static,
  );
  const buckets = new Map<string, OriginCluster>();
  (data.people || []).filter((player) => player.active !== false).forEach((player) => {
    const country = player.birthCountry || "Unknown";
    const mapped = coords(country);
    if (!mapped) return;
    const current = buckets.get(mapped.label) || {
      country: mapped.label,
      count: 0,
      lat: mapped.lat,
      lon: mapped.lon,
      topPlayer: player.fullName || "MLB Player",
    };
    current.count += 1;
    if (!current.topPlayer && player.fullName) current.topPlayer = player.fullName;
    buckets.set(mapped.label, current);
  });
  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 18);
}
