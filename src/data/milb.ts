export type MinorLeagueLevel = "AAA" | "AA" | "High-A" | "Single-A";

export type ProspectTrend = "rising" | "stable" | "falling";

export type ProspectTag =
  | "Top Prospect"
  | "Rising"
  | "Hidden Gem"
  | "Power Hitter"
  | "Contact Hitter"
  | "High Velocity Pitcher"
  | "Control Pitcher"
  | "Injured"
  | "Recently Promoted";

export type Affiliate = {
  level: MinorLeagueLevel;
  team: string;
  league: string;
  parentOrg?: string;
  orgAbbr?: string;
  location?: string;
  brandColor?: string;
  rosterRef?: string;
  scheduleRef?: string;
  record?: string;
};

export type ProspectStats = {
  games: number;
  pa?: number;
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  hr?: number;
  sb?: number;
  kRate?: number;
  bbRate?: number;
  ip?: number;
  era?: number;
  whip?: number;
  strikeOuts?: number;
  walks?: number;
  kPer9?: number;
  bbPer9?: number;
  avgVelo?: number;
};

export type Prospect = {
  id: string;
  name: string;
  headshotUrl?: string;
  bats?: string;
  throws?: string;
  heightWeight?: string;
  age: number;
  level: MinorLeagueLevel;
  organization: string;
  orgAbbr: string;
  position: string;
  type: "hitter" | "pitcher";
  affiliate: string;
  ranking?: number;
  eta: string;
  trend: ProspectTrend;
  tags: ProspectTag[];
  birthplace?: string;
  signingSource?: string;
  draftYear?: number;
  injuryStatus?: string;
  rosterStatus?: string;
  stats: ProspectStats;
  adjusted: ProspectStats;
  developmentScore: number;
  ceiling: string;
  comparablePlayers: string[];
  origin: string;
  risk?: string;
  confidence?: "Low" | "Medium" | "High";
  recentGames?: Array<{ label: string; line: string; score: number }>;
  transactions?: Array<{ date: string; type: "promotion" | "demotion" | "injury" | "rehab" | "assignment" | "callup"; note: string }>;
  timeline: Array<{ label: string; level: MinorLeagueLevel; note: string; score: number }>;
};

export type MinorLeagueTransaction = {
  id: string;
  date: string;
  prospectId: string;
  playerName: string;
  orgAbbr: string;
  type: "promotion" | "demotion" | "injury" | "rehab" | "assignment" | "callup";
  from?: MinorLeagueLevel | "MLB" | "Complex";
  to?: MinorLeagueLevel | "MLB" | "Complex";
  note: string;
};

export const LEAGUE_LEVELS: MinorLeagueLevel[] = ["AAA", "AA", "High-A", "Single-A"];

export const LEVEL_FACTORS: Record<MinorLeagueLevel, number> = {
  AAA: 0.92,
  AA: 0.84,
  "High-A": 0.76,
  "Single-A": 0.68,
};

const affiliate = (orgAbbr: string, parentOrg: string, level: MinorLeagueLevel, team: string, league: string, location: string, record = "Feed pending"): Affiliate => ({
  level,
  team,
  league,
  parentOrg,
  orgAbbr,
  location,
  rosterRef: `${orgAbbr.toLowerCase()}-${level.toLowerCase()}-roster`,
  scheduleRef: `${orgAbbr.toLowerCase()}-${level.toLowerCase()}-schedule`,
  record,
});

export const FARM_SYSTEMS: Record<string, Affiliate[]> = {
  ARI: [
    affiliate("ARI", "Arizona Diamondbacks", "AAA", "Reno Aces", "Pacific Coast League", "Reno, Nevada"),
    affiliate("ARI", "Arizona Diamondbacks", "AA", "Amarillo Sod Poodles", "Texas League", "Amarillo, Texas"),
    affiliate("ARI", "Arizona Diamondbacks", "High-A", "Hillsboro Hops", "Northwest League", "Hillsboro, Oregon"),
    affiliate("ARI", "Arizona Diamondbacks", "Single-A", "Visalia Rawhide", "California League", "Visalia, California"),
  ],
  ATH: [
    affiliate("ATH", "Athletics", "AAA", "Las Vegas Aviators", "Pacific Coast League", "Las Vegas, Nevada"),
    affiliate("ATH", "Athletics", "AA", "Midland RockHounds", "Texas League", "Midland, Texas"),
    affiliate("ATH", "Athletics", "High-A", "Lansing Lugnuts", "Midwest League", "Lansing, Michigan"),
    affiliate("ATH", "Athletics", "Single-A", "Stockton Ports", "California League", "Stockton, California"),
  ],
  ATL: [
    affiliate("ATL", "Atlanta Braves", "AAA", "Gwinnett Stripers", "International League", "Lawrenceville, Georgia"),
    affiliate("ATL", "Atlanta Braves", "AA", "Columbus Clingstones", "Southern League", "Columbus, Georgia"),
    affiliate("ATL", "Atlanta Braves", "High-A", "Rome Emperors", "South Atlantic League", "Rome, Georgia"),
    affiliate("ATL", "Atlanta Braves", "Single-A", "Augusta GreenJackets", "Carolina League", "North Augusta, South Carolina"),
  ],
  BAL: [
    affiliate("BAL", "Baltimore Orioles", "AAA", "Norfolk Tides", "International League", "Norfolk, Virginia"),
    affiliate("BAL", "Baltimore Orioles", "AA", "Chesapeake Baysox", "Eastern League", "Bowie, Maryland"),
    affiliate("BAL", "Baltimore Orioles", "High-A", "Frederick Keys", "South Atlantic League", "Frederick, Maryland"),
    affiliate("BAL", "Baltimore Orioles", "Single-A", "Delmarva Shorebirds", "Carolina League", "Salisbury, Maryland"),
  ],
  BOS: [
    affiliate("BOS", "Boston Red Sox", "AAA", "Worcester Red Sox", "International League", "Worcester, Massachusetts"),
    affiliate("BOS", "Boston Red Sox", "AA", "Portland Sea Dogs", "Eastern League", "Portland, Maine"),
    affiliate("BOS", "Boston Red Sox", "High-A", "Greenville Drive", "South Atlantic League", "Greenville, South Carolina"),
    affiliate("BOS", "Boston Red Sox", "Single-A", "Salem Red Sox", "Carolina League", "Salem, Virginia"),
  ],
  CHC: [
    affiliate("CHC", "Chicago Cubs", "AAA", "Iowa Cubs", "International League", "Des Moines, Iowa"),
    affiliate("CHC", "Chicago Cubs", "AA", "Knoxville Smokies", "Southern League", "Knoxville, Tennessee"),
    affiliate("CHC", "Chicago Cubs", "High-A", "South Bend Cubs", "Midwest League", "South Bend, Indiana"),
    affiliate("CHC", "Chicago Cubs", "Single-A", "Myrtle Beach Pelicans", "Carolina League", "Myrtle Beach, South Carolina"),
  ],
  CWS: [
    affiliate("CWS", "Chicago White Sox", "AAA", "Charlotte Knights", "International League", "Charlotte, North Carolina"),
    affiliate("CWS", "Chicago White Sox", "AA", "Birmingham Barons", "Southern League", "Birmingham, Alabama"),
    affiliate("CWS", "Chicago White Sox", "High-A", "Winston-Salem Dash", "South Atlantic League", "Winston-Salem, North Carolina"),
    affiliate("CWS", "Chicago White Sox", "Single-A", "Kannapolis Cannon Ballers", "Carolina League", "Kannapolis, North Carolina"),
  ],
  CIN: [
    affiliate("CIN", "Cincinnati Reds", "AAA", "Louisville Bats", "International League", "Louisville, Kentucky"),
    affiliate("CIN", "Cincinnati Reds", "AA", "Chattanooga Lookouts", "Southern League", "Chattanooga, Tennessee"),
    affiliate("CIN", "Cincinnati Reds", "High-A", "Dayton Dragons", "Midwest League", "Dayton, Ohio"),
    affiliate("CIN", "Cincinnati Reds", "Single-A", "Daytona Tortugas", "Florida State League", "Daytona Beach, Florida"),
  ],
  CLE: [
    affiliate("CLE", "Cleveland Guardians", "AAA", "Columbus Clippers", "International League", "Columbus, Ohio"),
    affiliate("CLE", "Cleveland Guardians", "AA", "Akron RubberDucks", "Eastern League", "Akron, Ohio"),
    affiliate("CLE", "Cleveland Guardians", "High-A", "Lake County Captains", "Midwest League", "Eastlake, Ohio"),
    affiliate("CLE", "Cleveland Guardians", "Single-A", "Lynchburg Hillcats", "Carolina League", "Lynchburg, Virginia"),
  ],
  COL: [
    affiliate("COL", "Colorado Rockies", "AAA", "Albuquerque Isotopes", "Pacific Coast League", "Albuquerque, New Mexico"),
    affiliate("COL", "Colorado Rockies", "AA", "Hartford Yard Goats", "Eastern League", "Hartford, Connecticut"),
    affiliate("COL", "Colorado Rockies", "High-A", "Spokane Indians", "Northwest League", "Spokane, Washington"),
    affiliate("COL", "Colorado Rockies", "Single-A", "Fresno Grizzlies", "California League", "Fresno, California"),
  ],
  DET: [
    affiliate("DET", "Detroit Tigers", "AAA", "Toledo Mud Hens", "International League", "Toledo, Ohio"),
    affiliate("DET", "Detroit Tigers", "AA", "Erie SeaWolves", "Eastern League", "Erie, Pennsylvania"),
    affiliate("DET", "Detroit Tigers", "High-A", "West Michigan Whitecaps", "Midwest League", "Comstock Park, Michigan"),
    affiliate("DET", "Detroit Tigers", "Single-A", "Lakeland Flying Tigers", "Florida State League", "Lakeland, Florida"),
  ],
  HOU: [
    affiliate("HOU", "Houston Astros", "AAA", "Sugar Land Space Cowboys", "Pacific Coast League", "Sugar Land, Texas"),
    affiliate("HOU", "Houston Astros", "AA", "Corpus Christi Hooks", "Texas League", "Corpus Christi, Texas"),
    affiliate("HOU", "Houston Astros", "High-A", "Asheville Tourists", "South Atlantic League", "Asheville, North Carolina"),
    affiliate("HOU", "Houston Astros", "Single-A", "Fayetteville Woodpeckers", "Carolina League", "Fayetteville, North Carolina"),
  ],
  KC: [
    affiliate("KC", "Kansas City Royals", "AAA", "Omaha Storm Chasers", "International League", "Papillion, Nebraska"),
    affiliate("KC", "Kansas City Royals", "AA", "Northwest Arkansas Naturals", "Texas League", "Springdale, Arkansas"),
    affiliate("KC", "Kansas City Royals", "High-A", "Quad Cities River Bandits", "Midwest League", "Davenport, Iowa"),
    affiliate("KC", "Kansas City Royals", "Single-A", "Columbia Fireflies", "Carolina League", "Columbia, South Carolina"),
  ],
  LAA: [
    affiliate("LAA", "Los Angeles Angels", "AAA", "Salt Lake Bees", "Pacific Coast League", "Salt Lake City, Utah"),
    affiliate("LAA", "Los Angeles Angels", "AA", "Rocket City Trash Pandas", "Southern League", "Madison, Alabama"),
    affiliate("LAA", "Los Angeles Angels", "High-A", "Tri-City Dust Devils", "Northwest League", "Pasco, Washington"),
    affiliate("LAA", "Los Angeles Angels", "Single-A", "Inland Empire 66ers", "California League", "San Bernardino, California"),
  ],
  LAD: [
    affiliate("LAD", "Los Angeles Dodgers", "AAA", "Oklahoma City Comets", "Pacific Coast League", "Oklahoma City, Oklahoma"),
    affiliate("LAD", "Los Angeles Dodgers", "AA", "Tulsa Drillers", "Texas League", "Tulsa, Oklahoma"),
    affiliate("LAD", "Los Angeles Dodgers", "High-A", "Great Lakes Loons", "Midwest League", "Midland, Michigan"),
    affiliate("LAD", "Los Angeles Dodgers", "Single-A", "Ontario Tower Buzzers", "California League", "Ontario, California"),
  ],
  MIA: [
    affiliate("MIA", "Miami Marlins", "AAA", "Jacksonville Jumbo Shrimp", "International League", "Jacksonville, Florida"),
    affiliate("MIA", "Miami Marlins", "AA", "Pensacola Blue Wahoos", "Southern League", "Pensacola, Florida"),
    affiliate("MIA", "Miami Marlins", "High-A", "Beloit Sky Carp", "Midwest League", "Beloit, Wisconsin"),
    affiliate("MIA", "Miami Marlins", "Single-A", "Jupiter Hammerheads", "Florida State League", "Jupiter, Florida"),
  ],
  MIL: [
    affiliate("MIL", "Milwaukee Brewers", "AAA", "Nashville Sounds", "International League", "Nashville, Tennessee"),
    affiliate("MIL", "Milwaukee Brewers", "AA", "Biloxi Shuckers", "Southern League", "Biloxi, Mississippi"),
    affiliate("MIL", "Milwaukee Brewers", "High-A", "Wisconsin Timber Rattlers", "Midwest League", "Appleton, Wisconsin"),
    affiliate("MIL", "Milwaukee Brewers", "Single-A", "Wilson Warbirds", "Carolina League", "Wilson, North Carolina"),
  ],
  MIN: [
    affiliate("MIN", "Minnesota Twins", "AAA", "St. Paul Saints", "International League", "Saint Paul, Minnesota"),
    affiliate("MIN", "Minnesota Twins", "AA", "Wichita Wind Surge", "Texas League", "Wichita, Kansas"),
    affiliate("MIN", "Minnesota Twins", "High-A", "Cedar Rapids Kernels", "Midwest League", "Cedar Rapids, Iowa"),
    affiliate("MIN", "Minnesota Twins", "Single-A", "Fort Myers Mighty Mussels", "Florida State League", "Fort Myers, Florida"),
  ],
  NYM: [
    affiliate("NYM", "New York Mets", "AAA", "Syracuse Mets", "International League", "Syracuse, New York"),
    affiliate("NYM", "New York Mets", "AA", "Binghamton Rumble Ponies", "Eastern League", "Binghamton, New York"),
    affiliate("NYM", "New York Mets", "High-A", "Brooklyn Cyclones", "South Atlantic League", "Brooklyn, New York"),
    affiliate("NYM", "New York Mets", "Single-A", "St. Lucie Mets", "Florida State League", "Port St. Lucie, Florida"),
  ],
  NYY: [
    affiliate("NYY", "New York Yankees", "AAA", "Scranton/Wilkes-Barre RailRiders", "International League", "Moosic, Pennsylvania"),
    affiliate("NYY", "New York Yankees", "AA", "Somerset Patriots", "Eastern League", "Bridgewater, New Jersey"),
    affiliate("NYY", "New York Yankees", "High-A", "Hudson Valley Renegades", "South Atlantic League", "Fishkill, New York"),
    affiliate("NYY", "New York Yankees", "Single-A", "Tampa Tarpons", "Florida State League", "Tampa, Florida"),
  ],
  PHI: [
    affiliate("PHI", "Philadelphia Phillies", "AAA", "Lehigh Valley IronPigs", "International League", "Allentown, Pennsylvania"),
    affiliate("PHI", "Philadelphia Phillies", "AA", "Reading Fightin Phils", "Eastern League", "Reading, Pennsylvania"),
    affiliate("PHI", "Philadelphia Phillies", "High-A", "Jersey Shore BlueClaws", "South Atlantic League", "Lakewood, New Jersey"),
    affiliate("PHI", "Philadelphia Phillies", "Single-A", "Clearwater Threshers", "Florida State League", "Clearwater, Florida"),
  ],
  PIT: [
    affiliate("PIT", "Pittsburgh Pirates", "AAA", "Indianapolis Indians", "International League", "Indianapolis, Indiana"),
    affiliate("PIT", "Pittsburgh Pirates", "AA", "Altoona Curve", "Eastern League", "Altoona, Pennsylvania"),
    affiliate("PIT", "Pittsburgh Pirates", "High-A", "Greensboro Grasshoppers", "South Atlantic League", "Greensboro, North Carolina"),
    affiliate("PIT", "Pittsburgh Pirates", "Single-A", "Bradenton Marauders", "Florida State League", "Bradenton, Florida"),
  ],
  SD: [
    affiliate("SD", "San Diego Padres", "AAA", "El Paso Chihuahuas", "Pacific Coast League", "El Paso, Texas"),
    affiliate("SD", "San Diego Padres", "AA", "San Antonio Missions", "Texas League", "San Antonio, Texas"),
    affiliate("SD", "San Diego Padres", "High-A", "Fort Wayne TinCaps", "Midwest League", "Fort Wayne, Indiana"),
    affiliate("SD", "San Diego Padres", "Single-A", "Lake Elsinore Storm", "California League", "Lake Elsinore, California"),
  ],
  SEA: [
    affiliate("SEA", "Seattle Mariners", "AAA", "Tacoma Rainiers", "Pacific Coast League", "Tacoma, Washington"),
    affiliate("SEA", "Seattle Mariners", "AA", "Arkansas Travelers", "Texas League", "North Little Rock, Arkansas"),
    affiliate("SEA", "Seattle Mariners", "High-A", "Everett AquaSox", "Northwest League", "Everett, Washington"),
    affiliate("SEA", "Seattle Mariners", "Single-A", "Inland Empire 66ers", "California League", "San Bernardino, California"),
  ],
  SF: [
    affiliate("SF", "San Francisco Giants", "AAA", "Sacramento River Cats", "Pacific Coast League", "West Sacramento, California"),
    affiliate("SF", "San Francisco Giants", "AA", "Richmond Flying Squirrels", "Eastern League", "Richmond, Virginia"),
    affiliate("SF", "San Francisco Giants", "High-A", "Eugene Emeralds", "Northwest League", "Eugene, Oregon"),
    affiliate("SF", "San Francisco Giants", "Single-A", "San Jose Giants", "California League", "San Jose, California"),
  ],
  STL: [
    affiliate("STL", "St. Louis Cardinals", "AAA", "Memphis Redbirds", "International League", "Memphis, Tennessee"),
    affiliate("STL", "St. Louis Cardinals", "AA", "Springfield Cardinals", "Texas League", "Springfield, Missouri"),
    affiliate("STL", "St. Louis Cardinals", "High-A", "Peoria Chiefs", "Midwest League", "Peoria, Illinois"),
    affiliate("STL", "St. Louis Cardinals", "Single-A", "Palm Beach Cardinals", "Florida State League", "Palm Beach, Florida"),
  ],
  TB: [
    affiliate("TB", "Tampa Bay Rays", "AAA", "Durham Bulls", "International League", "Durham, North Carolina"),
    affiliate("TB", "Tampa Bay Rays", "AA", "Montgomery Biscuits", "Southern League", "Montgomery, Alabama"),
    affiliate("TB", "Tampa Bay Rays", "High-A", "Bowling Green Hot Rods", "South Atlantic League", "Bowling Green, Kentucky"),
    affiliate("TB", "Tampa Bay Rays", "Single-A", "Charleston RiverDogs", "Carolina League", "Charleston, South Carolina"),
  ],
  TEX: [
    affiliate("TEX", "Texas Rangers", "AAA", "Round Rock Express", "Pacific Coast League", "Round Rock, Texas"),
    affiliate("TEX", "Texas Rangers", "AA", "Frisco RoughRiders", "Texas League", "Frisco, Texas"),
    affiliate("TEX", "Texas Rangers", "High-A", "Hub City Spartanburgers", "South Atlantic League", "Spartanburg, South Carolina"),
    affiliate("TEX", "Texas Rangers", "Single-A", "Hickory Crawdads", "Carolina League", "Hickory, North Carolina"),
  ],
  TOR: [
    affiliate("TOR", "Toronto Blue Jays", "AAA", "Buffalo Bisons", "International League", "Buffalo, New York"),
    affiliate("TOR", "Toronto Blue Jays", "AA", "New Hampshire Fisher Cats", "Eastern League", "Manchester, New Hampshire"),
    affiliate("TOR", "Toronto Blue Jays", "High-A", "Vancouver Canadians", "Northwest League", "Vancouver, British Columbia"),
    affiliate("TOR", "Toronto Blue Jays", "Single-A", "Dunedin Blue Jays", "Florida State League", "Dunedin, Florida"),
  ],
  WSH: [
    affiliate("WSH", "Washington Nationals", "AAA", "Rochester Red Wings", "International League", "Rochester, New York"),
    affiliate("WSH", "Washington Nationals", "AA", "Harrisburg Senators", "Eastern League", "Harrisburg, Pennsylvania"),
    affiliate("WSH", "Washington Nationals", "High-A", "Wilmington Blue Rocks", "South Atlantic League", "Wilmington, Delaware"),
    affiliate("WSH", "Washington Nationals", "Single-A", "Fredericksburg Nationals", "Carolina League", "Fredericksburg, Virginia"),
  ],
};

function adjustStats(level: MinorLeagueLevel, stats: ProspectStats, type: Prospect["type"]): ProspectStats {
  const factor = LEVEL_FACTORS[level];
  if (type === "pitcher") {
    return {
      ...stats,
      era: stats.era ? stats.era / factor : undefined,
      whip: stats.whip ? stats.whip / Math.sqrt(factor) : undefined,
      kPer9: stats.kPer9 ? stats.kPer9 * factor : undefined,
      bbPer9: stats.bbPer9 ? stats.bbPer9 / factor : undefined,
    };
  }
  return {
    ...stats,
    avg: stats.avg ? stats.avg * factor : undefined,
    obp: stats.obp ? stats.obp * factor : undefined,
    slg: stats.slg ? stats.slg * factor : undefined,
    ops: stats.ops ? stats.ops * factor : undefined,
    hr: stats.hr ? Math.round(stats.hr * factor) : undefined,
  };
}

function scoreProspect(input: Omit<Prospect, "adjusted" | "developmentScore">) {
  const rankingBoost = input.ranking ? Math.max(0, 34 - input.ranking * 0.22) : 8;
  const levelBoost = LEVEL_FACTORS[input.level] * 22;
  const trendBoost = input.trend === "rising" ? 16 : input.trend === "falling" ? -8 : 6;
  const performance = input.type === "pitcher"
    ? Math.max(0, 28 - ((input.stats.era || 5) * 4)) + ((input.stats.kPer9 || 7) * 1.8)
    : ((input.stats.ops || 0.700) * 42) + ((input.stats.hr || 0) * 0.8);
  return Math.round(Math.max(20, Math.min(99, rankingBoost + levelBoost + trendBoost + performance)));
}

function prospect(input: Omit<Prospect, "adjusted" | "developmentScore">): Prospect {
  return {
    ...input,
    adjusted: adjustStats(input.level, input.stats, input.type),
    developmentScore: scoreProspect(input),
  };
}

export const PROSPECTS: Prospect[] = [
  prospect({
    id: "milb-konnor-griffin",
    name: "Konnor Griffin",
    age: 19,
    level: "Single-A",
    organization: "Pittsburgh Pirates",
    orgAbbr: "PIT",
    position: "SS/OF",
    type: "hitter",
    affiliate: "Bradenton Marauders",
    ranking: 12,
    eta: "2028",
    trend: "rising",
    tags: ["Top Prospect", "Rising", "Power Hitter"],
    stats: { games: 54, pa: 236, avg: .282, obp: .354, slg: .478, ops: .832, hr: 9, sb: 18, kRate: 24.8, bbRate: 9.1 },
    ceiling: "Impact regular with power-speed ceiling",
    comparablePlayers: ["Bobby Witt Jr.", "Oneil Cruz"],
    origin: "United States",
    timeline: [
      { label: "Draft year", level: "Single-A", note: "Power-speed foundation", score: 64 },
      { label: "Early pro", level: "Single-A", note: "Contact stabilizing", score: 71 },
      { label: "Current", level: "Single-A", note: "Rising run-production signal", score: 79 },
    ],
  }),
  prospect({
    id: "milb-sal-stewart",
    name: "Sal Stewart",
    age: 22,
    level: "AAA",
    organization: "Cincinnati Reds",
    orgAbbr: "CIN",
    position: "3B",
    type: "hitter",
    affiliate: "Louisville Bats",
    ranking: 74,
    eta: "2026",
    trend: "rising",
    tags: ["Top Prospect", "Contact Hitter", "Recently Promoted"],
    stats: { games: 88, pa: 382, avg: .302, obp: .389, slg: .462, ops: .851, hr: 10, sb: 7, kRate: 17.9, bbRate: 12.2 },
    ceiling: "High-OBP corner bat with everyday role traits",
    comparablePlayers: ["Justin Turner", "Alex Bregman"],
    origin: "United States",
    timeline: [
      { label: "High-A", level: "High-A", note: "Zone control emerged", score: 66 },
      { label: "AA", level: "AA", note: "Approach held vs better arms", score: 74 },
      { label: "AAA", level: "AAA", note: "Near-ready offensive profile", score: 83 },
    ],
  }),
  prospect({
    id: "milb-max-clark",
    name: "Max Clark",
    age: 21,
    level: "AA",
    organization: "Detroit Tigers",
    orgAbbr: "DET",
    position: "OF",
    type: "hitter",
    affiliate: "Erie SeaWolves",
    ranking: 18,
    eta: "2027",
    trend: "stable",
    tags: ["Top Prospect", "Contact Hitter"],
    stats: { games: 79, pa: 350, avg: .277, obp: .372, slg: .421, ops: .793, hr: 7, sb: 21, kRate: 19.2, bbRate: 11.6 },
    ceiling: "Plus-defense center fielder with OBP and speed value",
    comparablePlayers: ["Brandon Nimmo", "Corbin Carroll"],
    origin: "United States",
    timeline: [
      { label: "A", level: "Single-A", note: "Speed translated immediately", score: 62 },
      { label: "High-A", level: "High-A", note: "OBP profile stabilized", score: 70 },
      { label: "AA", level: "AA", note: "Approach continues to travel", score: 76 },
    ],
  }),
  prospect({
    id: "milb-river-ryan",
    name: "River Ryan",
    age: 27,
    level: "AAA",
    organization: "Los Angeles Dodgers",
    orgAbbr: "LAD",
    position: "RHP",
    type: "pitcher",
    affiliate: "Oklahoma City Baseball Club",
    ranking: 88,
    eta: "2026",
    trend: "stable",
    tags: ["High Velocity Pitcher"],
    stats: { games: 14, ip: 61.1, era: 3.18, whip: 1.18, strikeOuts: 72, walks: 23, kPer9: 10.6, bbPer9: 3.4, avgVelo: 95.4 },
    ceiling: "Mid-rotation arm with power fastball foundation",
    comparablePlayers: ["Joe Ryan", "Michael King"],
    origin: "United States",
    timeline: [
      { label: "AA", level: "AA", note: "Starter workload built up", score: 66 },
      { label: "AAA", level: "AAA", note: "Velocity held deeper into starts", score: 75 },
      { label: "Current", level: "AAA", note: "Command is separator", score: 78 },
    ],
  }),
  prospect({
    id: "milb-marcelo-mayer",
    name: "Marcelo Mayer",
    age: 23,
    level: "AAA",
    organization: "Boston Red Sox",
    orgAbbr: "BOS",
    position: "SS",
    type: "hitter",
    affiliate: "Worcester Red Sox",
    ranking: 31,
    eta: "2026",
    trend: "rising",
    tags: ["Top Prospect", "Power Hitter"],
    stats: { games: 72, pa: 318, avg: .286, obp: .361, slg: .497, ops: .858, hr: 13, sb: 4, kRate: 22.1, bbRate: 8.8 },
    ceiling: "Two-way shortstop with middle-order damage",
    comparablePlayers: ["Corey Seager", "Brandon Crawford"],
    origin: "United States",
    timeline: [
      { label: "AA", level: "AA", note: "Power returned", score: 72 },
      { label: "AAA", level: "AAA", note: "Pull-side damage increased", score: 81 },
      { label: "Current", level: "AAA", note: "MLB-ready swing decisions", score: 85 },
    ],
  }),
  prospect({
    id: "milb-chase-hampton",
    name: "Chase Hampton",
    age: 24,
    level: "AA",
    organization: "New York Yankees",
    orgAbbr: "NYY",
    position: "RHP",
    type: "pitcher",
    affiliate: "Somerset Patriots",
    ranking: 92,
    eta: "2027",
    trend: "falling",
    tags: ["Control Pitcher"],
    stats: { games: 12, ip: 52.2, era: 4.32, whip: 1.34, strikeOuts: 57, walks: 21, kPer9: 9.7, bbPer9: 3.6, avgVelo: 93.1 },
    ceiling: "Back-end starter if command rebounds",
    comparablePlayers: ["Clarke Schmidt", "Tanner Houck"],
    origin: "United States",
    timeline: [
      { label: "A", level: "Single-A", note: "Whiff traits popped", score: 68 },
      { label: "AA", level: "AA", note: "Walk rate pressure arrived", score: 63 },
      { label: "Current", level: "AA", note: "Needs command reset", score: 58 },
    ],
  }),
];

export function farmSystemForOrg(orgAbbr: string) {
  const affiliates = FARM_SYSTEMS[orgAbbr] || [];
  return LEAGUE_LEVELS.map((level) => ({
    level,
    affiliate: affiliates.find((item) => item.level === level),
    prospects: PROSPECTS.filter((player) => player.orgAbbr === orgAbbr && player.level === level),
  }));
}

export function farmSystemScore(orgAbbr: string) {
  const players = PROSPECTS.filter((player) => player.orgAbbr === orgAbbr);
  if (!players.length) return 48;
  const quality = players.reduce((sum, player) => sum + player.developmentScore, 0) / players.length;
  const depth = Math.min(16, players.length * 4);
  return Math.round(Math.min(99, quality + depth));
}

export function hiddenGems() {
  return PROSPECTS
    .filter((player) => !player.ranking || player.ranking > 60)
    .sort((a, b) => b.developmentScore - a.developmentScore)
    .slice(0, 6);
}

export function trendingProspects() {
  return PROSPECTS
    .filter((player) => player.trend === "rising" || player.tags.includes("Recently Promoted"))
    .sort((a, b) => b.developmentScore - a.developmentScore)
    .slice(0, 8);
}

export const MILB_TRANSACTIONS: MinorLeagueTransaction[] = [
  {
    id: "move-sal-stewart-aaa",
    date: "2026-04-18",
    prospectId: "milb-sal-stewart",
    playerName: "Sal Stewart",
    orgAbbr: "CIN",
    type: "promotion",
    from: "AA",
    to: "AAA",
    note: "Moved into near-ready evaluation window after sustained zone-control gains.",
  },
  {
    id: "move-konnor-griffin-watch",
    date: "2026-04-17",
    prospectId: "milb-konnor-griffin",
    playerName: "Konnor Griffin",
    orgAbbr: "PIT",
    type: "assignment",
    to: "Single-A",
    note: "Power-speed profile remains on the high-variance breakout track.",
  },
  {
    id: "move-river-ryan-aaa",
    date: "2026-04-16",
    prospectId: "milb-river-ryan",
    playerName: "River Ryan",
    orgAbbr: "LAD",
    type: "assignment",
    to: "AAA",
    note: "Starter workload and fastball quality keep him in the callup depth band.",
  },
  {
    id: "move-chase-hampton-command",
    date: "2026-04-15",
    prospectId: "milb-chase-hampton",
    playerName: "Chase Hampton",
    orgAbbr: "NYY",
    type: "assignment",
    to: "AA",
    note: "Command volatility flagged before the next promotion discussion.",
  },
];

export function getProspect(id: string | undefined) {
  return PROSPECTS.find((prospect) => prospect.id === id);
}

export function orgName(orgAbbr: string) {
  return FARM_SYSTEMS[orgAbbr]?.[0]?.parentOrg || PROSPECTS.find((prospect) => prospect.orgAbbr === orgAbbr)?.organization || orgAbbr;
}

export function ageContext(prospect: Prospect) {
  const levelAverage: Record<MinorLeagueLevel, number> = {
    AAA: 25.2,
    AA: 23.8,
    "High-A": 22.4,
    "Single-A": 21.1,
  };
  const delta = prospect.age - levelAverage[prospect.level];
  if (delta <= -1.2) return { label: "Young for level", delta, tone: "text-emerald-200" };
  if (delta >= 1.4) return { label: "Old for level", delta, tone: "text-yellow-200" };
  return { label: "Age appropriate", delta, tone: "text-cyan-200" };
}

export function promotionWatch(prospect: Prospect) {
  const age = ageContext(prospect);
  const readyLevel = prospect.level === "AAA" || prospect.level === "AA";
  const scorePush = prospect.developmentScore >= 78;
  const trendPush = prospect.trend === "rising";
  if (readyLevel && scorePush) return "Near MLB ready";
  if (trendPush && scorePush) return "Promotion watch";
  if (prospect.trend === "falling") return "Needs reset";
  return age.label;
}

export function prospectArchetype(prospect: Prospect) {
  if (prospect.type === "pitcher") {
    if ((prospect.stats.avgVelo || 0) >= 95) return "High-velo arm";
    if ((prospect.stats.bbPer9 || 5) <= 3) return "Command-first pitcher";
    return "Pitchability depth arm";
  }
  const iso = (prospect.stats.slg || 0) - (prospect.stats.avg || 0);
  if (iso >= 0.18 && (prospect.stats.kRate || 0) >= 22) return "Power-upside bat";
  if ((prospect.stats.bbRate || 0) >= 11 && (prospect.stats.kRate || 30) <= 20) return "Contact/OBP bat";
  if ((prospect.stats.sb || 0) >= 15) return "Speed-impact athlete";
  return "Balanced position player";
}

export function orgProspects(orgAbbr: string) {
  return PROSPECTS.filter((prospect) => prospect.orgAbbr === orgAbbr).sort((a, b) => b.developmentScore - a.developmentScore);
}

export function farmSystemHealth(orgAbbr: string) {
  const prospects = orgProspects(orgAbbr);
  const levels = farmSystemForOrg(orgAbbr);
  const levelScores = LEAGUE_LEVELS.map((level) => {
    const players = prospects.filter((prospect) => prospect.level === level);
    return {
      level,
      score: players.length ? Math.round(players.reduce((sum, prospect) => sum + prospect.developmentScore, 0) / players.length) : 48,
      count: players.length,
    };
  });
  const strongest = [...levelScores].sort((a, b) => b.score - a.score)[0];
  const hitters = prospects.filter((prospect) => prospect.type === "hitter").length;
  const pitchers = prospects.length - hitters;
  return {
    orgAbbr,
    organization: orgName(orgAbbr),
    score: farmSystemScore(orgAbbr),
    topProspects: prospects.slice(0, 5),
    affiliates: levels,
    strongestLevel: strongest,
    depthByPosition: {
      hitters,
      pitchers,
      upTheMiddle: prospects.filter((prospect) => /SS|CF|C|2B/.test(prospect.position)).length,
    },
    recentMoves: MILB_TRANSACTIONS.filter((move) => move.orgAbbr === orgAbbr),
    healthNote: prospects.length
      ? `${strongest.level} carries the strongest tracked signal, with ${hitters >= pitchers ? "hitting" : "pitching"} depth leading the current model.`
      : "Affiliate structure is mapped; tracked player coverage is still expanding.",
  };
}

export type MilbLeaderboardCategory =
  | "OPS"
  | "AVG"
  | "HR"
  | "SB"
  | "BB%"
  | "K%"
  | "ERA"
  | "WHIP"
  | "K/9"
  | "Dev Score";

export function milbLeaderboard(category: MilbLeaderboardCategory, level: MinorLeagueLevel | "ALL" = "ALL") {
  const players = PROSPECTS.filter((prospect) => level === "ALL" || prospect.level === level);
  const valueFor = (prospect: Prospect) => {
    switch (category) {
      case "OPS": return prospect.adjusted.ops || 0;
      case "AVG": return prospect.adjusted.avg || 0;
      case "HR": return prospect.adjusted.hr || 0;
      case "SB": return prospect.stats.sb || 0;
      case "BB%": return prospect.stats.bbRate || 0;
      case "K%": return prospect.type === "pitcher" ? prospect.stats.kPer9 || 0 : -(prospect.stats.kRate || 99);
      case "ERA": return -(prospect.adjusted.era || 99);
      case "WHIP": return -(prospect.adjusted.whip || 99);
      case "K/9": return prospect.adjusted.kPer9 || 0;
      case "Dev Score": return prospect.developmentScore;
      default: return 0;
    }
  };
  return players
    .map((prospect) => ({ prospect, value: valueFor(prospect) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);
}

export function prospectRisers() {
  return [...PROSPECTS]
    .filter((prospect) => prospect.trend === "rising")
    .sort((a, b) => b.developmentScore - a.developmentScore);
}

export function prospectFallers() {
  return [...PROSPECTS]
    .filter((prospect) => prospect.trend === "falling")
    .sort((a, b) => a.developmentScore - b.developmentScore);
}

export function nearMlbReady() {
  return [...PROSPECTS]
    .filter((prospect) => prospect.level === "AAA" || (prospect.level === "AA" && prospect.developmentScore >= 78))
    .sort((a, b) => b.developmentScore - a.developmentScore);
}

export function internationalPipeline() {
  return Array.from(new Set(PROSPECTS.map((prospect) => prospect.origin))).map((origin) => {
    const players = PROSPECTS.filter((prospect) => prospect.origin === origin).sort((a, b) => b.developmentScore - a.developmentScore);
    const orgs = Array.from(new Set(players.map((prospect) => prospect.orgAbbr)));
    return {
      origin,
      count: players.length,
      topProspects: players.slice(0, 4),
      organizations: orgs,
      intensity: Math.min(1, players.length / 8),
    };
  }).sort((a, b) => b.count - a.count);
}
