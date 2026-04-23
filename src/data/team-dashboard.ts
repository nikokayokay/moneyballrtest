import { FARM_SYSTEMS, PROSPECTS, farmSystemScore, orgName } from "@/src/data/milb";

export type TeamMode = "Contender" | "Rebuild" | "Middle";

export type DashboardTeam = {
  id: number;
  abbr: string;
  name: string;
  league: "AL" | "NL";
  division: string;
  record: string;
  payroll: string;
  runDifferential: number;
  farmRank: number;
  last10: string;
  streak: string;
  mode: TeamMode;
  topPlayer: string;
  ops: number;
  era: number;
  logoUrl: string;
  metrics: Array<{ label: string; value: string; rank: number; tone: "good" | "warn" | "bad" | "neutral"; href: string }>;
  sparkline: number[];
  trends: {
    ops: number[];
    era: number[];
    runDiff: number[];
  };
};

export const dashboardTeams: DashboardTeam[] = [
  {
    id: 147,
    abbr: "NYY",
    name: "New York Yankees",
    league: "AL",
    division: "AL East",
    record: "12-7",
    payroll: "$302M",
    runDifferential: 31,
    farmRank: 14,
    last10: "7-3",
    streak: "W3",
    mode: "Contender",
    topPlayer: "Aaron Judge",
    ops: 0.781,
    era: 3.72,
    logoUrl: "https://www.mlbstatic.com/team-logos/147.svg",
    metrics: [
      { label: "Contact Rank", value: "8th", rank: 8, tone: "good", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "3rd", rank: 3, tone: "good", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "22.4", rank: 15, tone: "neutral", href: "/leaderboards" },
      { label: "BB%", value: "10.1", rank: 5, tone: "good", href: "/leaderboards" },
      { label: "ERA Rank", value: "11th", rank: 11, tone: "neutral", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "22nd", rank: 22, tone: "warn", href: "/leaderboards" },
    ],
    sparkline: [4, 6, 5, 7, 8, 7, 9, 10, 11, 12],
    trends: { ops: [0.701, 0.726, 0.742, 0.754, 0.781], era: [4.11, 3.98, 3.81, 3.77, 3.72], runDiff: [5, 12, 16, 22, 31] },
  },
  {
    id: 119,
    abbr: "LAD",
    name: "Los Angeles Dodgers",
    league: "NL",
    division: "NL West",
    record: "14-6",
    payroll: "$289M",
    runDifferential: 42,
    farmRank: 7,
    last10: "8-2",
    streak: "W4",
    mode: "Contender",
    topPlayer: "Shohei Ohtani",
    ops: 0.812,
    era: 3.28,
    logoUrl: "https://www.mlbstatic.com/team-logos/119.svg",
    metrics: [
      { label: "Contact Rank", value: "4th", rank: 4, tone: "good", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "2nd", rank: 2, tone: "good", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "20.8", rank: 7, tone: "good", href: "/leaderboards" },
      { label: "BB%", value: "11.4", rank: 2, tone: "good", href: "/leaderboards" },
      { label: "ERA Rank", value: "5th", rank: 5, tone: "good", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "13th", rank: 13, tone: "neutral", href: "/leaderboards" },
    ],
    sparkline: [7, 8, 7, 9, 10, 12, 11, 13, 14, 14],
    trends: { ops: [0.745, 0.759, 0.781, 0.799, 0.812], era: [3.77, 3.58, 3.44, 3.33, 3.28], runDiff: [9, 16, 24, 35, 42] },
  },
  {
    id: 113,
    abbr: "CIN",
    name: "Cincinnati Reds",
    league: "NL",
    division: "NL Central",
    record: "10-9",
    payroll: "$112M",
    runDifferential: 8,
    farmRank: 9,
    last10: "5-5",
    streak: "L1",
    mode: "Middle",
    topPlayer: "Elly De La Cruz",
    ops: 0.739,
    era: 4.08,
    logoUrl: "https://www.mlbstatic.com/team-logos/113.svg",
    metrics: [
      { label: "Contact Rank", value: "16th", rank: 16, tone: "neutral", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "10th", rank: 10, tone: "neutral", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "24.6", rank: 23, tone: "warn", href: "/leaderboards" },
      { label: "BB%", value: "9.4", rank: 9, tone: "good", href: "/leaderboards" },
      { label: "ERA Rank", value: "18th", rank: 18, tone: "warn", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "2nd", rank: 2, tone: "good", href: "/leaderboards" },
    ],
    sparkline: [3, 5, 6, 5, 6, 7, 8, 7, 9, 10],
    trends: { ops: [0.693, 0.704, 0.721, 0.733, 0.739], era: [4.44, 4.32, 4.18, 4.21, 4.08], runDiff: [-4, 1, 4, 6, 8] },
  },
  {
    id: 134,
    abbr: "PIT",
    name: "Pittsburgh Pirates",
    league: "NL",
    division: "NL Central",
    record: "8-11",
    payroll: "$91M",
    runDifferential: -12,
    farmRank: 4,
    last10: "4-6",
    streak: "W1",
    mode: "Rebuild",
    topPlayer: "Paul Skenes",
    ops: 0.682,
    era: 4.31,
    logoUrl: "https://www.mlbstatic.com/team-logos/134.svg",
    metrics: [
      { label: "Contact Rank", value: "24th", rank: 24, tone: "warn", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "21st", rank: 21, tone: "warn", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "25.1", rank: 25, tone: "bad", href: "/leaderboards" },
      { label: "BB%", value: "8.8", rank: 14, tone: "neutral", href: "/leaderboards" },
      { label: "ERA Rank", value: "20th", rank: 20, tone: "warn", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "7th", rank: 7, tone: "good", href: "/leaderboards" },
    ],
    sparkline: [5, 4, 4, 3, 5, 6, 6, 7, 7, 8],
    trends: { ops: [0.661, 0.667, 0.671, 0.679, 0.682], era: [4.52, 4.49, 4.41, 4.37, 4.31], runDiff: [-18, -17, -15, -13, -12] },
  },
  {
    id: 111,
    abbr: "BOS",
    name: "Boston Red Sox",
    league: "AL",
    division: "AL East",
    record: "11-9",
    payroll: "$186M",
    runDifferential: 11,
    farmRank: 6,
    last10: "6-4",
    streak: "W2",
    mode: "Middle",
    topPlayer: "Rafael Devers",
    ops: 0.746,
    era: 3.91,
    logoUrl: "https://www.mlbstatic.com/team-logos/111.svg",
    metrics: [
      { label: "Contact Rank", value: "12th", rank: 12, tone: "neutral", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "8th", rank: 8, tone: "good", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "23.3", rank: 18, tone: "warn", href: "/leaderboards" },
      { label: "BB%", value: "9.7", rank: 8, tone: "good", href: "/leaderboards" },
      { label: "ERA Rank", value: "14th", rank: 14, tone: "neutral", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "10th", rank: 10, tone: "neutral", href: "/leaderboards" },
    ],
    sparkline: [4, 5, 5, 6, 8, 7, 8, 9, 10, 11],
    trends: { ops: [0.708, 0.719, 0.727, 0.738, 0.746], era: [4.12, 4.05, 4.02, 3.96, 3.91], runDiff: [-2, 3, 7, 9, 11] },
  },
  {
    id: 116,
    abbr: "DET",
    name: "Detroit Tigers",
    league: "AL",
    division: "AL Central",
    record: "13-8",
    payroll: "$119M",
    runDifferential: 24,
    farmRank: 8,
    last10: "7-3",
    streak: "W2",
    mode: "Contender",
    topPlayer: "Tarik Skubal",
    ops: 0.731,
    era: 3.41,
    logoUrl: "https://www.mlbstatic.com/team-logos/116.svg",
    metrics: [
      { label: "Contact Rank", value: "13th", rank: 13, tone: "neutral", href: "/leaderboards?stat=avg" },
      { label: "Power Rank", value: "12th", rank: 12, tone: "neutral", href: "/leaderboards?stat=homeRuns" },
      { label: "K%", value: "22.1", rank: 13, tone: "neutral", href: "/leaderboards" },
      { label: "BB%", value: "8.9", rank: 13, tone: "neutral", href: "/leaderboards" },
      { label: "ERA Rank", value: "7th", rank: 7, tone: "good", href: "/leaderboards?stat=era" },
      { label: "Speed Rank", value: "15th", rank: 15, tone: "neutral", href: "/leaderboards" },
    ],
    sparkline: [6, 6, 7, 8, 8, 10, 11, 11, 12, 13],
    trends: { ops: [0.688, 0.703, 0.711, 0.722, 0.731], era: [3.81, 3.74, 3.61, 3.49, 3.41], runDiff: [4, 9, 14, 19, 24] },
  },
];

export function teamByAbbr(abbr: string) {
  return dashboardTeams.find((team) => team.abbr === abbr) || dashboardTeams[0];
}

export function affiliateRowsForTeam(team: DashboardTeam) {
  return (FARM_SYSTEMS[team.abbr] || []).map((affiliate) => {
    const prospects = PROSPECTS.filter((prospect) => prospect.orgAbbr === team.abbr && prospect.level === affiliate.level)
      .sort((a, b) => b.developmentScore - a.developmentScore);
    return {
      ...affiliate,
      record: affiliate.record || "Feed pending",
      topProspect: prospects[0],
      trendingPlayer: prospects.find((prospect) => prospect.trend === "rising") || prospects[1],
      farmScore: farmSystemScore(team.abbr),
      orgName: orgName(team.abbr),
    };
  });
}
