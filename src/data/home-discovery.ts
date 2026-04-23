import { dashboardTeams } from "@/src/data/team-dashboard";
import { PROSPECTS } from "@/src/data/milb";

export type HomePerformer = {
  playerId: number | string;
  name: string;
  team: string;
  teamId: number | null;
  position?: string;
  country: string;
  headshotUrl: string;
  keyStat: string;
  statLine: string;
  impactScore: number;
  signalType?: "clutch" | "streak" | "anomaly" | "standard";
  contextTag?: "neutral" | "high leverage" | "garbage time" | "clutch";
  clutchFactor?: number;
  insight?: {
    whyItMatters: string;
    whatChanged: string;
    whatToWatch: string;
    priority: number;
  };
  deeperStats: Array<[string, string]>;
  href: string;
};

export type OriginCluster = {
  country: string;
  count: number;
  topPerformer: string;
  lat: number;
  lng: number;
  intensity: number;
};

export const todayTopPerformers: HomePerformer[] = [
  {
    playerId: 592450,
    name: "Aaron Judge",
    team: "NYY",
    teamId: 147,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/592450/headshot/67/current",
    keyStat: "2 HR",
    statLine: "3-4, 2 HR, 5 RBI",
    impactScore: 96,
    deeperStats: [["EV", "112.4"], ["xwOBA", ".641"], ["HardHit", "75%"]],
    href: "/player/592450",
  },
  {
    playerId: 660271,
    name: "Shohei Ohtani",
    team: "LAD",
    teamId: 119,
    country: "Japan",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/660271/headshot/67/current",
    keyStat: "1 HR",
    statLine: "2-5, HR, 3 RBI",
    impactScore: 91,
    deeperStats: [["OPS", "1.021"], ["xSLG", ".702"], ["Barrel", "18%"]],
    href: "/player/660271",
  },
  {
    playerId: 672284,
    name: "Vladimir Guerrero Jr.",
    team: "TOR",
    teamId: 141,
    country: "Dominican Republic",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/672284/headshot/67/current",
    keyStat: "4 H",
    statLine: "4-5, 2B, 2 RBI",
    impactScore: 88,
    deeperStats: [["Contact", "92%"], ["xBA", ".612"], ["Chase", "18%"]],
    href: "/player/672284",
  },
  {
    playerId: 665742,
    name: "Ronald Acuna Jr.",
    team: "ATL",
    teamId: 144,
    country: "Venezuela",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/665742/headshot/67/current",
    keyStat: "HR + SB",
    statLine: "2-4, HR, SB, 2 R",
    impactScore: 86,
    deeperStats: [["Sprint", "30.1"], ["OPS", ".944"], ["wOBA", ".402"]],
    href: "/player/665742",
  },
  {
    playerId: 669242,
    name: "Juan Soto",
    team: "NYM",
    teamId: 121,
    country: "Dominican Republic",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/669242/headshot/67/current",
    keyStat: "3 BB",
    statLine: "1-2, 3 BB, 2 R",
    impactScore: 84,
    deeperStats: [["OBP", ".571"], ["BB%", "60"], ["xwOBA", ".536"]],
    href: "/player/669242",
  },
  {
    playerId: 605141,
    name: "Mookie Betts",
    team: "LAD",
    teamId: 119,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/605141/headshot/67/current",
    keyStat: "3 R",
    statLine: "2-4, 2B, 3 R",
    impactScore: 81,
    deeperStats: [["OPS", ".910"], ["K%", "0"], ["wRC+", "184"]],
    href: "/player/605141",
  },
  {
    playerId: 701398,
    name: "Sal Stewart",
    team: "CIN",
    teamId: 113,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/701398/headshot/67/current",
    keyStat: "3 H",
    statLine: "3-4, 2B, RBI",
    impactScore: 78,
    deeperStats: [["Adj OPS", ".783"], ["BB%", "12.2"], ["Trend", "Rising"]],
    href: "/player/701398",
  },
  {
    playerId: 804606,
    name: "Konnor Griffin",
    team: "PIT",
    teamId: 134,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/804606/headshot/67/current",
    keyStat: "HR + 2 SB",
    statLine: "2-4, HR, 2 SB",
    impactScore: 76,
    deeperStats: [["Dev", "79"], ["ETA", "2028"], ["Trend", "Rising"]],
    href: "/player/804606",
  },
  {
    playerId: 547180,
    name: "Bryce Harper",
    team: "PHI",
    teamId: 143,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/547180/headshot/67/current",
    keyStat: "4 RBI",
    statLine: "2-4, HR, 4 RBI",
    impactScore: 75,
    deeperStats: [["OPS", ".936"], ["xwOBA", ".487"], ["Barrel", "16%"]],
    href: "/player/547180",
  },
  {
    playerId: 621043,
    name: "Gleyber Torres",
    team: "DET",
    teamId: 116,
    country: "Venezuela",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/621043/headshot/67/current",
    keyStat: "3 H",
    statLine: "3-5, 2B, 2 RBI",
    impactScore: 73,
    deeperStats: [["Contact", "88%"], ["OPS", ".842"], ["wOBA", ".371"]],
    href: "/player/621043",
  },
  {
    playerId: 808982,
    name: "Roki Sasaki",
    team: "LAD",
    teamId: 119,
    country: "Japan",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/808982/headshot/67/current",
    keyStat: "9 K",
    statLine: "6 IP, 2 ER, 9 K",
    impactScore: 72,
    deeperStats: [["Velo", "98.7"], ["Whiff", "36%"], ["CSW", "33%"]],
    href: "/player/808982",
  },
  {
    playerId: 694973,
    name: "Elly De La Cruz",
    team: "CIN",
    teamId: 113,
    country: "Dominican Republic",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/694973/headshot/67/current",
    keyStat: "2 SB",
    statLine: "2-4, 3B, 2 SB",
    impactScore: 71,
    deeperStats: [["Sprint", "30.5"], ["xSLG", ".612"], ["Impact", "Speed"]],
    href: "/player/694973",
  },
  {
    playerId: 682829,
    name: "Corbin Carroll",
    team: "ARI",
    teamId: 109,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/682829/headshot/67/current",
    keyStat: "HR + SB",
    statLine: "2-5, HR, SB",
    impactScore: 70,
    deeperStats: [["OPS", ".881"], ["SB", "1"], ["xwOBA", ".398"]],
    href: "/player/682829",
  },
  {
    playerId: 514888,
    name: "Jose Ramirez",
    team: "CLE",
    teamId: 114,
    country: "Dominican Republic",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/514888/headshot/67/current",
    keyStat: "Walk-off",
    statLine: "2-4, HR, 3 RBI",
    impactScore: 69,
    deeperStats: [["Clutch", "High"], ["OPS", ".902"], ["K%", "8"]],
    href: "/player/514888",
  },
  {
    playerId: 665489,
    name: "Bo Bichette",
    team: "TOR",
    teamId: 141,
    country: "United States",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/665489/headshot/67/current",
    keyStat: "4 H",
    statLine: "4-5, RBI, 2 R",
    impactScore: 68,
    deeperStats: [["Contact", "94%"], ["AVG", ".412"], ["xBA", ".533"]],
    href: "/player/665489",
  },
  {
    playerId: 666969,
    name: "Julio Rodriguez",
    team: "SEA",
    teamId: 136,
    country: "Dominican Republic",
    headshotUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/666969/headshot/67/current",
    keyStat: "3 XBH",
    statLine: "3-5, HR, 2 2B",
    impactScore: 67,
    deeperStats: [["EV", "111.0"], ["HardHit", "80%"], ["OPS", ".921"]],
    href: "/player/666969",
  },
];

export function performerOrigins(performers = todayTopPerformers): OriginCluster[] {
  const coords: Record<string, { lat: number; lng: number }> = {
    "United States": { lat: 39, lng: -98 },
    "Dominican Republic": { lat: 18.7, lng: -70.2 },
    Venezuela: { lat: 6.4, lng: -66.6 },
    Japan: { lat: 36.2, lng: 138.2 },
    Cuba: { lat: 21.5, lng: -78.9 },
    Mexico: { lat: 23.6, lng: -102.5 },
    Canada: { lat: 56.1, lng: -106.3 },
    Colombia: { lat: 4.6, lng: -74.1 },
    Panama: { lat: 8.5, lng: -80.8 },
    "Puerto Rico": { lat: 18.2, lng: -66.5 },
    Curacao: { lat: 12.2, lng: -69 },
    "South Korea": { lat: 36.5, lng: 127.9 },
  };
  return Array.from(new Set(performers.map((player) => player.country).filter((country) => country && country !== "Unknown"))).map((country) => {
    const players = performers.filter((player) => player.country === country).sort((a, b) => b.impactScore - a.impactScore);
    return {
      country,
      count: players.length,
      topPerformer: players[0]?.name || "No performer",
      lat: coords[country]?.lat || 20,
      lng: coords[country]?.lng || 0,
      intensity: Math.min(1, players.length / 4),
    };
  });
}

export function trendingTeams() {
  return dashboardTeams
    .slice()
    .sort((a, b) => b.runDifferential - a.runDifferential)
    .slice(0, 8);
}

export function featuredProspectComparison() {
  const left = PROSPECTS.find((prospect) => prospect.name === "Konnor Griffin") || PROSPECTS[0];
  const right = PROSPECTS.find((prospect) => prospect.name === "Sal Stewart") || PROSPECTS[1];
  return { left, right };
}
