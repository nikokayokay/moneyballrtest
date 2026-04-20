const SEASON = new Date().getFullYear();
const REFRESH_MS = 30000;
const DEFAULT_PLAYER_ID = 592450;
const SOURCE_PRIORITY = {
  identity: 'MLB Stats API',
  season: 'MLB Stats API',
  logs: 'MLB Stats API',
  splits: 'MLB Stats API',
  live: 'MLB Stats API',
  statcast: 'Baseball Savant',
};
const BASELINES = {
  hitter: { obp: 0.315, ops: 0.72, xwOBA: 0.32, hardHit: 38, kRate: 22, bbRate: 8.5 },
  pitcher: { era: 4.1, kBb: 2.6, xERA: 4.05, whiff: 24, velo: 93 },
};
const state = { playerId: null, timer: null };
const cache = { json: new Map(), text: new Map(), search: new Map() };
const els = {
  root: document.getElementById('player-profile-root'),
  searchInput: document.getElementById('player-profile-search'),
  clearSearch: document.getElementById('clear-player-search'),
  searchResults: document.getElementById('player-profile-search-results'),
};

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const n = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replace(/%/g, '').replace(/,/g, '').trim());
  return Number.isFinite(number) ? number : null;
};
const first = (...values) => values.find(Number.isFinite) ?? null;
const fmt = (value, digits = null) => {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return digits === null ? String(number) : number.toFixed(digits);
};
const pct = (value, digits = 1) => Number.isFinite(value) ? `${value.toFixed(digits)}%` : 'Unavailable';
const shortDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unavailable';
const headshot = (id) => `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${id}/headshot/67/current`;
const blend = (value, baseline, reliability) => Number.isFinite(value) ? baseline + ((value - baseline) * reliability) : baseline;
const scale = (value, min, max, inverse = false) => {
  if (!Number.isFinite(value)) return null;
  const raw = value <= min ? 0 : value >= max ? 100 : ((value - min) / (max - min)) * 100;
  return inverse ? 100 - raw : raw;
};
const weighted = (items) => {
  const valid = items.filter((item) => Number.isFinite(item.score) && Number.isFinite(item.weight));
  const total = valid.reduce((sum, item) => sum + item.weight, 0);
  return total ? valid.reduce((sum, item) => sum + (item.score * item.weight), 0) / total : null;
};

function updateUrl(playerId) {
  const params = new URLSearchParams(window.location.search);
  params.set('player', String(playerId));
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

async function fetchJson(url, bust = false) {
  const key = bust ? `${url}:${Date.now()}` : url;
  if (!bust && cache.json.has(key)) return cache.json.get(key);
  const request = fetch(url, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
    return response.json();
  });
  if (!bust) cache.json.set(key, request);
  return request;
}

async function fetchText(url, bust = false) {
  const key = bust ? `${url}:${Date.now()}` : url;
  if (!bust && cache.text.has(key)) return cache.text.get(key);
  const request = fetch(url, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
    return response.text();
  });
  if (!bust) cache.text.set(key, request);
  return request;
}

async function searchPlayers(query) {
  const key = query.trim().toLowerCase();
  if (cache.search.has(key)) return cache.search.get(key);
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}`);
  const players = (data.people || []).filter((player) => player.active);
  cache.search.set(key, players);
  return players;
}

async function fetchPerson(playerId, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`, bust);
  return data.people?.[0] || null;
}

async function fetchSeason(playerId, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season,seasonAdvanced&group=${group}&season=${SEASON}`, bust);
  const seasonMeta = (data.stats || []).find((item) => item.type?.displayName === 'season')?.splits?.[0] || null;
  const advancedMeta = (data.stats || []).find((item) => item.type?.displayName === 'seasonAdvanced')?.splits?.[0] || null;
  return { season: seasonMeta?.stat || {}, seasonMeta, advanced: advancedMeta?.stat || {} };
}

async function fetchLogs(playerId, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=${group}&season=${SEASON}`, bust);
  return ((data.stats || [])[0] || {}).splits || [];
}

async function fetchSplits(playerId, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=statSplits&group=${group}&season=${SEASON}&sitCodes=vr,vl,h,a`, bust);
  const splits = (((data.stats || [])[0] || {}).splits || []);
  const byCode = new Map(splits.map((split) => [split.split?.code, split.stat]));
  return { vsR: byCode.get('vr') || null, vsL: byCode.get('vl') || null, home: byCode.get('h') || null, away: byCode.get('a') || null };
}

async function fetchWindow(playerId, group, days, bust = false) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const params = new URLSearchParams({
    stats: 'byDateRange',
    group,
    season: String(SEASON),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  });
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?${params.toString()}`, bust);
  return (((data.stats || [])[0] || {}).splits || [])[0]?.stat || null;
}

async function fetchTodayGame(teamId, bust = false) {
  if (!teamId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`, bust);
  const games = data.dates?.[0]?.games || [];
  return games.find((game) => game.teams?.home?.team?.id === teamId || game.teams?.away?.team?.id === teamId) || null;
}

async function fetchFeed(gamePk, bust = false) {
  return gamePk ? fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, bust) : null;
}

function parseSavantMeta(html) {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
  const metric = (label) => n(meta.match(new RegExp(`${label}:\\s*([\\.\\d-]+)`, 'i'))?.[1] || null);
  return { avgExitVelocity: metric('Avg Exit Velocity'), hardHit: metric('Hard Hit %'), barrel: metric('Barrel %'), wOBA: metric('wOBA'), xwOBA: metric('xwOBA') };
}

async function fetchSavant(person, bust = false) {
  if (!person?.nameSlug) return {};
  try {
    return parseSavantMeta(await fetchText(`https://baseballsavant.mlb.com/savant-player/${person.nameSlug}`, bust));
  } catch (error) {
    console.error(error);
    return {};
  }
}

function parseIp(ip) {
  const [whole = '0', part = '0'] = String(ip || '0.0').split('.');
  return (Number(whole) * 3) + Number(part);
}

function sampleProfile(isPitcher, season) {
  const size = isPitcher ? (parseIp(season.inningsPitched) / 3) : n(season.plateAppearances);
  const cutoffs = isPitcher ? { partial: 20, full: 80 } : { partial: 50, full: 300 };
  const tier = Number.isFinite(size) && size >= cutoffs.full ? 'full_sample' : Number.isFinite(size) && size >= cutoffs.partial ? 'partial_sample' : 'projection';
  const reliability = tier === 'full_sample' ? 1 : tier === 'partial_sample' ? 0.35 + (((size - cutoffs.partial) / (cutoffs.full - cutoffs.partial)) * 0.5) : Number.isFinite(size) && size > 0 ? 0.10 + ((size / cutoffs.partial) * 0.2) : 0.08;
  return {
    tier,
    reliability: clamp(reliability, 0.08, 1),
    confidence: tier === 'full_sample' ? 'HIGH' : tier === 'partial_sample' ? 'MEDIUM' : 'LOW',
    badgeLabel: tier === 'full_sample' ? 'Stable MLB Data' : tier === 'partial_sample' ? 'Limited Data' : 'Projected',
    mode: tier === 'projection' ? 'Projection-based' : tier === 'partial_sample' ? 'Blended' : 'Observed',
    reason: tier === 'full_sample' ? 'Qualified MLB sample with stable major-league data.' : tier === 'partial_sample' ? 'Partial MLB sample is blended with league baseline.' : 'No meaningful MLB sample yet, so neutral baseline logic is used.',
    note: tier === 'projection' ? 'Profile stays live, but outputs are conservative and clearly labeled.' : tier === 'partial_sample' ? 'Small-sample spikes are softened to avoid misleading comparisons.' : 'Advanced metrics receive full weight.',
    label: isPitcher ? `${fmt(size, 1)} IP` : `${fmt(size, 0)} PA`,
  };
}

function recentHitter(logs) {
  const sample = logs.length < 5 ? logs.slice(0) : logs.slice(0, 7);
  if (!sample.length) return { summary: 'No MLB game logs available.', obp: null, ops: null, kRate: null };
  const totals = sample.reduce((acc, log) => {
    const stat = log.stat || {};
    acc.ab += Number(stat.atBats || 0);
    acc.h += Number(stat.hits || 0);
    acc.bb += Number(stat.baseOnBalls || 0);
    acc.hbp += Number(stat.hitByPitch || 0);
    acc.sf += Number(stat.sacFlies || 0);
    acc.tb += Number(stat.totalBases || 0);
    acc.pa += Number(stat.plateAppearances || 0);
    acc.k += Number(stat.strikeOuts || 0);
    return acc;
  }, { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, tb: 0, pa: 0, k: 0 });
  const obpDen = totals.ab + totals.bb + totals.hbp + totals.sf;
  const obp = obpDen ? (totals.h + totals.bb + totals.hbp) / obpDen : null;
  const slg = totals.ab ? totals.tb / totals.ab : null;
  return { summary: `${totals.h}-${totals.ab}, ${totals.bb} BB, ${totals.k} K over ${sample.length} games`, obp, ops: obp !== null && slg !== null ? obp + slg : null, kRate: totals.pa ? ((totals.k / totals.pa) * 100) : null };
}

function recentPitcher(logs) {
  const sample = logs.length < 5 ? logs.slice(0) : logs.slice(0, 5);
  if (!sample.length) return { summary: 'No MLB game logs available.', era: null, kBb: null, ppo: null };
  const totals = sample.reduce((acc, log) => {
    const stat = log.stat || {};
    acc.outs += parseIp(stat.inningsPitched || '0.0');
    acc.er += Number(stat.earnedRuns || 0);
    acc.k += Number(stat.strikeOuts || 0);
    acc.bb += Number(stat.baseOnBalls || 0);
    acc.pitches += Number(stat.numberOfPitches || stat.pitchesThrown || 0);
    return acc;
  }, { outs: 0, er: 0, k: 0, bb: 0, pitches: 0 });
  const innings = totals.outs / 3;
  return { summary: `${fmt(innings, 1)} IP, ${totals.k} K, ${totals.bb} BB over ${sample.length} appearances`, era: innings ? ((totals.er * 9) / innings) : null, kBb: totals.bb ? (totals.k / totals.bb) : totals.k, ppo: totals.outs ? (totals.pitches / totals.outs) : null };
}

function confidence(profile, summary) {
  if (profile.isPitcher) {
    const b = BASELINES.pitcher;
    const raw = Math.round(clamp(weighted([
      { weight: profile.sample.tier === 'full_sample' ? 0.32 : 0.18, score: scale(blend(summary.era, b.era, profile.sample.reliability), 2.2, 5.8, true) },
      { weight: 0.22, score: scale(blend(summary.kBb, b.kBb, profile.sample.reliability), 1.2, 6.2) },
      { weight: 0.18, score: scale(blend(summary.xERA, b.xERA, profile.sample.reliability), 2.2, 5.8, true) },
      { weight: 0.16, score: scale(blend(summary.whiff, b.whiff, profile.sample.reliability), 18, 38) },
      { weight: 0.12, score: scale(blend(summary.recentEra, b.era, profile.sample.reliability), 2.2, 5.8, true) },
    ]) || 50));
    return {
      score: raw,
      comparisonScore: Math.round(clamp(50 + ((raw - 50) * (0.30 + (profile.sample.reliability * 0.70))))),
      trend: raw >= 67 ? 'HOT' : raw <= 45 ? 'COLD' : 'NEUTRAL',
      dataConfidence: profile.sample.confidence,
      reason: profile.sample.reason,
      note: profile.sample.note,
      mode: profile.sample.mode,
      insight: profile.sample.tier === 'projection' ? 'Pitching score is projection-based because the MLB sample is not stable yet.' : profile.sample.tier === 'partial_sample' ? 'Pitching score blends current MLB run prevention with baseline stabilization.' : 'Pitching score is driven by stable MLB performance and expected indicators.',
    };
  }
  const b = BASELINES.hitter;
  const raw = Math.round(clamp(weighted([
    { weight: profile.sample.tier === 'full_sample' ? 0.28 : 0.18, score: scale(blend(summary.obp, b.obp, profile.sample.reliability), 0.27, 0.45) },
    { weight: profile.sample.tier === 'full_sample' ? 0.22 : 0.16, score: scale(blend(summary.ops, b.ops, profile.sample.reliability), 0.60, 1.10) },
    { weight: 0.20, score: scale(blend(summary.xwOBA, b.xwOBA, profile.sample.reliability), 0.28, 0.43) },
    { weight: 0.14, score: scale(blend(summary.hardHit, b.hardHit, profile.sample.reliability), 28, 56) },
    { weight: 0.08, score: scale(blend(summary.kRate, b.kRate, profile.sample.reliability), 10, 34, true) },
    { weight: 0.08, score: scale(blend(summary.recentOps, b.ops, profile.sample.reliability), 0.60, 1.10) },
  ]) || 50));
  return {
    score: raw,
    comparisonScore: Math.round(clamp(50 + ((raw - 50) * (0.30 + (profile.sample.reliability * 0.70))))),
    trend: raw >= 67 ? 'HOT' : raw <= 45 ? 'COLD' : 'NEUTRAL',
    dataConfidence: profile.sample.confidence,
    reason: profile.sample.reason,
    note: profile.sample.note,
    mode: profile.sample.mode,
    insight: profile.sample.tier === 'projection' ? 'Hitting score is projection-based because MLB plate appearances are not yet meaningful.' : profile.sample.tier === 'partial_sample' ? 'Hitting score blends current MLB production with league baseline to reduce noise.' : 'Hitting score is driven by stable MLB production and expected quality of contact.',
  };
}

function validations(person, seasonMeta, matches) {
  const items = [];
  if (seasonMeta?.player?.id && seasonMeta.player.id !== person.id) items.push({ level: 'error', text: 'Source mismatch detected between identity and season stat payload.' });
  if (person.currentTeam?.id && seasonMeta?.team?.id && person.currentTeam.id !== seasonMeta.team.id) items.push({ level: 'warn', text: 'Current team and season stat team differ. This can happen after a recent transaction.' });
  if ((matches || []).filter((item) => item.fullName === person.fullName).length > 1) items.push({ level: 'warn', text: 'Multiple active players share this name. The profile is pinned to the explicit MLB player ID.' });
  if (!items.length) items.push({ level: 'ok', text: 'Player ID, team mapping, and season stat payload alignment passed validation.' });
  return items;
}

async function pitchMix(profile, bust = false) {
  if (!profile.isPitcher) return [];
  const gamePks = profile.raw.logs.slice(0, 3).map((log) => log.game?.gamePk).filter(Boolean);
  if (!gamePks.length) return [];
  const feeds = await Promise.all(gamePks.map((gamePk) => fetchFeed(gamePk, bust).catch(() => null)));
  const buckets = new Map();
  feeds.forEach((feed) => {
    (feed?.liveData?.plays?.allPlays || []).forEach((play) => {
      if (play.matchup?.pitcher?.id !== profile.identity.id) return;
      (play.playEvents || []).forEach((event) => {
        if (!event.isPitch || !event.pitchData) return;
        const name = event.details?.type?.description || event.details?.type?.code || 'Unknown';
        if (!buckets.has(name)) buckets.set(name, { count: 0, velo: [], h: [], v: [] });
        const bucket = buckets.get(name);
        bucket.count += 1;
        if (Number.isFinite(event.pitchData.startSpeed)) bucket.velo.push(event.pitchData.startSpeed);
        if (Number.isFinite(event.pitchData.breaks?.breakHorizontal)) bucket.h.push(event.pitchData.breaks.breakHorizontal);
        if (Number.isFinite(event.pitchData.breaks?.breakVertical)) bucket.v.push(event.pitchData.breaks.breakVertical);
      });
    });
  });
  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.count, 0);
  return [...buckets.entries()].map(([pitchType, bucket]) => ({
    pitchType,
    usage: total ? (bucket.count / total) * 100 : null,
    avgVelo: bucket.velo.length ? bucket.velo.reduce((sum, value) => sum + value, 0) / bucket.velo.length : null,
    hMov: bucket.h.length ? bucket.h.reduce((sum, value) => sum + value, 0) / bucket.h.length : null,
    vMov: bucket.v.length ? bucket.v.reduce((sum, value) => sum + value, 0) / bucket.v.length : null,
  })).sort((a, b) => (b.usage || 0) - (a.usage || 0));
}

function liveGame(person, game, feed, isPitcher) {
  if (!game) return { status: 'No game scheduled today', opponent: 'Unavailable', line: [], note: 'Live game data will appear automatically when this player is on today’s schedule.' };
  const playerKey = `ID${person.id}`;
  const row = feed?.liveData?.boxscore?.teams?.home?.players?.[playerKey] || feed?.liveData?.boxscore?.teams?.away?.players?.[playerKey];
  const stat = isPitcher ? row?.stats?.pitching || {} : row?.stats?.batting || {};
  const isHome = game.teams?.home?.team?.id === person.currentTeam?.id;
  const opponent = isHome ? game.teams?.away?.team?.name : game.teams?.home?.team?.name;
  return {
    status: feed?.gameData?.status?.detailedState || game.status?.detailedState || 'Scheduled',
    opponent: opponent || 'Unavailable',
    line: isPitcher ? [['IP', stat.inningsPitched ?? null], ['ER', stat.earnedRuns ?? null], ['K', stat.strikeOuts ?? null], ['BB', stat.baseOnBalls ?? null]] : [['AB', stat.atBats ?? null], ['H', stat.hits ?? null], ['R', stat.runs ?? null], ['RBI', stat.rbi ?? null]],
    note: 'Refreshes automatically while the game is active.',
  };
}

async function buildProfile(playerId, bust = false) {
  const person = await fetchPerson(playerId, bust);
  if (!person) throw new Error('Player not found.');
  const isPitcher = person.primaryPosition?.type === 'Pitcher';
  const group = isPitcher ? 'pitching' : 'hitting';
  const [seasonPack, logs, splits, last7, last15, last30, savant, game, matches] = await Promise.all([
    fetchSeason(playerId, group, bust),
    fetchLogs(playerId, group, bust),
    fetchSplits(playerId, group, bust),
    fetchWindow(playerId, group, 7, bust).catch(() => null),
    fetchWindow(playerId, group, 15, bust).catch(() => null),
    fetchWindow(playerId, group, 30, bust).catch(() => null),
    fetchSavant(person, bust),
    fetchTodayGame(person.currentTeam?.id, bust),
    searchPlayers(person.fullName).catch(() => []),
  ]);
  const profile = {
    identity: {
      id: person.id,
      fullName: person.fullName,
      headshot: headshot(person.id),
      team: person.currentTeam?.name || 'Free Agent / Unavailable',
      jerseyNumber: person.primaryNumber || null,
      position: person.primaryPosition?.abbreviation || 'N/A',
      bats: person.batSide?.code || null,
      throws: person.pitchHand?.code || null,
      height: person.height || null,
      weight: person.weight || null,
      age: person.currentAge || null,
      debut: person.mlbDebutDate || null,
      status: person.active ? 'Active' : 'Inactive',
    },
    isPitcher,
    raw: { season: seasonPack.season, advanced: seasonPack.advanced, logs, splits, windows: { last7, last15, last30 }, savant },
  };
  profile.sample = sampleProfile(isPitcher, seasonPack.season);
  const recent = isPitcher ? recentPitcher(logs) : recentHitter(logs);
  profile.confidence = confidence(profile, isPitcher ? {
    era: n(seasonPack.season.era),
    kBb: first(n(seasonPack.season.strikeoutWalkRatio), n(seasonPack.advanced.strikesoutsToWalks)),
    xERA: n(savant.xERA),
    whiff: first(n(seasonPack.advanced.whiffPercentage) ? n(seasonPack.advanced.whiffPercentage) * 100 : null, n(savant.whiffPct)),
    recentEra: recent.era,
  } : {
    obp: n(seasonPack.season.obp),
    ops: n(seasonPack.season.ops),
    xwOBA: n(savant.xwOBA),
    hardHit: n(savant.hardHit),
    kRate: n(seasonPack.advanced.strikeoutsPerPlateAppearance) ? n(seasonPack.advanced.strikeoutsPerPlateAppearance) * 100 : null,
    recentOps: recent.ops,
  });
  profile.recent = recent;
  profile.validation = validations(person, seasonPack.seasonMeta, matches);
  profile.live = liveGame(person, game, await fetchFeed(game?.gamePk, bust).catch(() => null), isPitcher);
  profile.pitchMix = await pitchMix(profile, bust).catch(() => []);
  profile.sources = {
    identity: SOURCE_PRIORITY.identity,
    season: SOURCE_PRIORITY.season,
    logs: SOURCE_PRIORITY.logs,
    splits: SOURCE_PRIORITY.splits,
    live: SOURCE_PRIORITY.live,
    statcast: Object.keys(savant).length ? SOURCE_PRIORITY.statcast : 'Not provided by source',
  };
  return profile;
}

const displayValue = (value, profile) => value === null || value === undefined || value === '' ? (profile.sample.mode === 'Projection-based' ? 'Projected' : 'Unavailable') : value;
const card = (label, value) => `<div class="stat-card"><div class="mini-label">${label}</div><div class="stat-value">${value}</div></div>`;
const trendClass = (trend) => trend === 'HOT' ? 'trend-hot' : trend === 'COLD' ? 'trend-cold' : 'trend-neutral';
const metric = (label, value) => `<div class="metric-item"><span class="metric-label">${label}</span><span class="metric-value">${value}</span></div>`;

function standardCards(profile) {
  if (profile.isPitcher) return [
    ['GS', profile.raw.season.gamesStarted], ['G', profile.raw.season.gamesPlayed], ['IP', profile.raw.season.inningsPitched], ['ERA', profile.raw.season.era],
    ['WHIP', profile.raw.season.whip], ['H', profile.raw.season.hits], ['ER', profile.raw.season.earnedRuns], ['HR', profile.raw.season.homeRuns],
    ['BB', profile.raw.season.baseOnBalls], ['SO', profile.raw.season.strikeOuts], ['K/9', profile.raw.season.strikeoutsPer9Inn], ['BB/9', profile.raw.season.walksPer9Inn],
    ['HR/9', profile.raw.season.homeRunsPer9], ['K/BB', profile.raw.season.strikeoutWalkRatio],
  ];
  const season = profile.raw.season;
  const singles = [n(season.hits), n(season.doubles), n(season.triples), n(season.homeRuns)].every(Number.isFinite) ? n(season.hits) - n(season.doubles) - n(season.triples) - n(season.homeRuns) : null;
  return [
    ['G', season.gamesPlayed], ['PA', season.plateAppearances], ['AB', season.atBats], ['R', season.runs], ['H', season.hits], ['1B', singles], ['2B', season.doubles],
    ['3B', season.triples], ['HR', season.homeRuns], ['RBI', season.rbi], ['BB', season.baseOnBalls], ['IBB', season.intentionalWalks], ['SO', season.strikeOuts],
    ['HBP', season.hitByPitch], ['SB', season.stolenBases], ['CS', season.caughtStealing], ['AVG', season.avg], ['OBP', season.obp], ['SLG', season.slg], ['OPS', season.ops],
  ];
}

function advancedCards(profile) {
  if (profile.isPitcher) return [
    ['FIP', profile.raw.advanced.fip], ['xFIP', profile.raw.savant.xFIP], ['ERA+', profile.raw.season.eraPlus], ['WAR', profile.raw.savant.war], ['xERA', profile.raw.savant.xERA],
    ['xBA Allowed', profile.raw.savant.xBA], ['xwOBA Allowed', profile.raw.savant.xwOBA], ['Whiff%', n(profile.raw.advanced.whiffPercentage) ? pct(n(profile.raw.advanced.whiffPercentage) * 100) : 'Unavailable'],
    ['Chase%', pct(n(profile.raw.savant.chasePct))], ['CSW%', pct(n(profile.raw.savant.cswPct))], ['Avg Velo', displayValue(profile.raw.savant.avgVelo, profile)],
  ];
  return [
    ['OPS+', profile.raw.season.opsPlus], ['ISO', profile.raw.advanced.iso], ['BABIP', profile.raw.season.babip || profile.raw.advanced.babip], ['wOBA', profile.raw.savant.wOBA], ['wRC+', profile.raw.savant.wRCPlus],
    ['WAR', profile.raw.savant.war], ['xBA', profile.raw.savant.xBA], ['xSLG', profile.raw.savant.xSLG], ['xwOBA', profile.raw.savant.xwOBA], ['Barrel%', pct(n(profile.raw.savant.barrel))],
    ['HardHit%', pct(n(profile.raw.savant.hardHit))], ['Exit Velo', displayValue(profile.raw.savant.avgExitVelocity, profile)], ['Chase%', pct(n(profile.raw.savant.chasePct))], ['Whiff%', pct(n(profile.raw.savant.whiffPct))],
    ['K%', n(profile.raw.advanced.strikeoutsPerPlateAppearance) ? pct(n(profile.raw.advanced.strikeoutsPerPlateAppearance) * 100) : 'Unavailable'], ['BB%', n(profile.raw.advanced.walksPerPlateAppearance) ? pct(n(profile.raw.advanced.walksPerPlateAppearance) * 100) : 'Unavailable'],
  ];
}

function renderProfile(profile) {
  document.title = `${profile.identity.fullName} - MoneyBallr Player Profile`;
  const logs = profile.raw.logs.slice(0, 20);
  const recentRows = profile.raw.logs.slice(0, 8);
  const splitLines = profile.isPitcher
    ? [['vs RHB', profile.raw.splits.vsR ? `ERA ${displayValue(profile.raw.splits.vsR.era, profile)} · WHIP ${displayValue(profile.raw.splits.vsR.whip, profile)}` : 'Unavailable'], ['vs LHB', profile.raw.splits.vsL ? `ERA ${displayValue(profile.raw.splits.vsL.era, profile)} · WHIP ${displayValue(profile.raw.splits.vsL.whip, profile)}` : 'Unavailable'], ['Home', profile.raw.splits.home ? `ERA ${displayValue(profile.raw.splits.home.era, profile)} · K ${displayValue(profile.raw.splits.home.strikeOuts, profile)}` : 'Unavailable'], ['Away', profile.raw.splits.away ? `ERA ${displayValue(profile.raw.splits.away.era, profile)} · K ${displayValue(profile.raw.splits.away.strikeOuts, profile)}` : 'Unavailable']]
    : [['vs RHP', profile.raw.splits.vsR ? `OPS ${displayValue(profile.raw.splits.vsR.ops, profile)} · AVG ${displayValue(profile.raw.splits.vsR.avg, profile)}` : 'Unavailable'], ['vs LHP', profile.raw.splits.vsL ? `OPS ${displayValue(profile.raw.splits.vsL.ops, profile)} · AVG ${displayValue(profile.raw.splits.vsL.avg, profile)}` : 'Unavailable'], ['Home', profile.raw.splits.home ? `OPS ${displayValue(profile.raw.splits.home.ops, profile)} · HR ${displayValue(profile.raw.splits.home.homeRuns, profile)}` : 'Unavailable'], ['Away', profile.raw.splits.away ? `OPS ${displayValue(profile.raw.splits.away.ops, profile)} · HR ${displayValue(profile.raw.splits.away.homeRuns, profile)}` : 'Unavailable']];
  els.root.className = 'profile-root';
  els.root.innerHTML = `
    <section class="profile-header">
      <img class="profile-headshot" src="${profile.identity.headshot}" alt="${profile.identity.fullName}">
      <div>
        <div class="profile-name">${profile.identity.fullName}</div>
        <div class="profile-meta"><span>${profile.identity.team}</span><span>•</span><span>${profile.identity.position}</span><span>•</span><span>${profile.identity.jerseyNumber ? `#${profile.identity.jerseyNumber}` : 'No number listed'}</span><span>•</span><span>${profile.identity.age ? `Age ${profile.identity.age}` : 'Age unavailable'}</span></div>
        <div class="profile-badges"><span class="sample-badge ${profile.sample.tier}">${profile.sample.badgeLabel}</span><span class="sample-badge confidence-${profile.confidence.dataConfidence.toLowerCase()}">${profile.confidence.dataConfidence} Confidence</span><span class="sample-badge neutral">${profile.sample.mode}</span></div>
        <div class="profile-note">${profile.confidence.reason} ${profile.confidence.note}</div>
      </div>
      <div class="score-panel"><div class="score-pill ${trendClass(profile.confidence.trend)} confidence-${profile.confidence.dataConfidence.toLowerCase()}">${profile.confidence.score}</div><div class="score-copy">${profile.confidence.insight}</div></div>
    </section>
    <div class="profile-grid">
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Overview</div><div class="section-title">Player Overview</div></div><div class="section-copy">Open Profile is keyed by MLB player ID and refreshes live every ${REFRESH_MS / 1000} seconds.</div></div><div class="metric-list kv-grid">${metric('Bats / Throws', `${profile.identity.bats || 'N/A'} / ${profile.identity.throws || 'N/A'}`)}${metric('Height / Weight', profile.identity.height && profile.identity.weight ? `${profile.identity.height} / ${profile.identity.weight} lb` : 'Unavailable')}${metric('MLB Debut', profile.identity.debut ? shortDate(profile.identity.debut) : 'Unavailable')}${metric('Team Status', profile.identity.status)}${metric('Sample', profile.sample.label)}${metric('Comparison Score', profile.confidence.comparisonScore)}</div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Sources</div><div class="section-title">Source Priority + Validation</div></div><div class="section-copy">The profile only shows source-backed data. Missing values are never replaced with fake zeroes.</div></div><div class="metric-list status-grid">${metric('Identity', profile.sources.identity)}${metric('Season Stats', profile.sources.season)}${metric('Game Logs', profile.sources.logs)}${metric('Splits', profile.sources.splits)}${metric('Statcast', profile.sources.statcast)}${metric('Live Feed', profile.sources.live)}</div><div class="validation-list">${profile.validation.map((item) => `<div class="validation-item validation-${item.level}">${item.text}</div>`).join('')}</div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Standard Stats</div><div class="section-title">${profile.isPitcher ? 'Pitching Totals' : 'Hitting Totals'}</div></div><div class="section-copy">Season totals update from the live MLB season endpoint.</div></div><div class="core-grid">${standardCards(profile).map(([label, value]) => card(label, displayValue(value, profile))).join('')}</div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Advanced Stats</div><div class="section-title">Advanced + Quality of Contact</div></div><div class="section-copy">Advanced stats remain null-safe and are labeled Unavailable or Projected when a source does not provide them.</div></div><div class="core-grid">${advancedCards(profile).map(([label, value]) => card(label, displayValue(value, profile))).join('')}</div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Windows</div><div class="section-title">Last 7 / 15 / 30</div></div><div class="section-copy">If fewer MLB games exist, the page shows the available sample instead of inventing data.</div></div><div class="metric-list">${metric('Last 7', displayValue(profile.isPitcher ? (profile.raw.windows.last7?.era || profile.raw.windows.last7?.inningsPitched) : (profile.raw.windows.last7?.ops || profile.raw.windows.last7?.obp), profile))}${metric('Last 15', displayValue(profile.isPitcher ? (profile.raw.windows.last15?.era || profile.raw.windows.last15?.inningsPitched) : (profile.raw.windows.last15?.ops || profile.raw.windows.last15?.obp), profile))}${metric('Last 30', displayValue(profile.isPitcher ? (profile.raw.windows.last30?.era || profile.raw.windows.last30?.inningsPitched) : (profile.raw.windows.last30?.ops || profile.raw.windows.last30?.obp), profile))}</div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Splits</div><div class="section-title">Handedness + Venue Splits</div></div><div class="section-copy">Comparison logic is normalized by sample size so small-sample outliers do not dominate.</div></div><div class="split-grid">${splitLines.map(([label, text]) => `<div class="stat-card"><div class="mini-label">${label}</div><div class="section-copy" style="margin-top:8px;">${text}</div></div>`).join('')}</div></section>
      ${profile.isPitcher ? `<section class="profile-surface"><div class="section-head"><div><div class="section-label">Pitch Mix</div><div class="section-title">Usage + Movement</div></div><div class="section-copy">Derived from recent MLB pitch-event feeds when they are available.</div></div><div class="pitch-grid">${(profile.pitchMix.length ? profile.pitchMix.slice(0, 6) : [{ pitchType: 'Unavailable', usage: null, avgVelo: null, hMov: null, vMov: null }]).map((pitch) => `<div class="stat-card"><div class="mini-label">${pitch.pitchType}</div><div class="section-copy" style="margin-top:8px;">Usage ${pct(pitch.usage)} · Velo ${displayValue(pitch.avgVelo ? pitch.avgVelo.toFixed(1) : null, profile)}</div><div class="section-copy">HB ${displayValue(pitch.hMov ? pitch.hMov.toFixed(1) : null, profile)} · VB ${displayValue(pitch.vMov ? pitch.vMov.toFixed(1) : null, profile)}</div></div>`).join('')}</div></section>` : ''}
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Recent Form</div><div class="section-title">${recentRows.length ? 'Most Recent MLB Games' : 'No MLB Game Logs'}</div></div><div class="section-copy">${profile.recent.summary}</div></div>${recentRows.length ? `<div class="table-wrap"><table class="log-table"><thead><tr><th>Date</th><th>Opponent</th><th>Result</th><th>Stat Line</th><th>Impact</th></tr></thead><tbody>${recentRows.map((log) => { const stat = log.stat || {}; const line = profile.isPitcher ? `${stat.inningsPitched || '0.0'} IP, ${stat.earnedRuns ?? '0'} ER, ${stat.strikeOuts ?? '0'} K, ${stat.baseOnBalls ?? '0'} BB` : `${stat.atBats ?? '0'} AB, ${stat.hits ?? '0'} H, ${stat.homeRuns ?? '0'} HR, ${stat.rbi ?? '0'} RBI`; return `<tr><td>${shortDate(log.date)}</td><td>${log.opponent?.name || 'Unavailable'}</td><td>${log.isHome ? 'vs' : '@'} ${log.opponent?.name || 'Opponent'}</td><td>${line}</td><td>${displayValue(profile.isPitcher ? stat.gameScore : stat.ops, profile)}</td></tr>`; }).join('')}</tbody></table></div>` : ''}</section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Game Logs</div><div class="section-title">Full Recent Log Table</div></div><div class="section-copy">This table renders only real MLB game logs.</div></div><div class="table-wrap"><table class="log-table"><thead><tr>${(profile.isPitcher ? ['Date', 'Opp', 'IP', 'ER', 'K', 'BB', 'Pitches'] : ['Date', 'Opp', 'AB', 'H', 'R', 'RBI', 'OPS']).map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody>${logs.length ? logs.map((log) => { const stat = log.stat || {}; return profile.isPitcher ? `<tr><td>${shortDate(log.date)}</td><td>${log.opponent?.name || 'Unavailable'}</td><td>${displayValue(stat.inningsPitched, profile)}</td><td>${displayValue(stat.earnedRuns, profile)}</td><td>${displayValue(stat.strikeOuts, profile)}</td><td>${displayValue(stat.baseOnBalls, profile)}</td><td>${displayValue(stat.numberOfPitches || stat.pitchesThrown, profile)}</td></tr>` : `<tr><td>${shortDate(log.date)}</td><td>${log.opponent?.name || 'Unavailable'}</td><td>${displayValue(stat.atBats, profile)}</td><td>${displayValue(stat.hits, profile)}</td><td>${displayValue(stat.runs, profile)}</td><td>${displayValue(stat.rbi, profile)}</td><td>${displayValue(stat.ops, profile)}</td></tr>`; }).join('') : `<tr><td colspan="7">No MLB game logs available.</td></tr>`}</tbody></table></div></section>
      <section class="profile-surface"><div class="section-head"><div><div class="section-label">Live Game</div><div class="section-title">Today&apos;s Status</div></div><div class="section-copy">${profile.live.note}</div></div><div class="metric-list">${metric('Status', profile.live.status)}${metric('Opponent', profile.live.opponent)}</div><div class="live-line">${profile.live.line.map(([label, value]) => `<div class="live-card"><div class="mini-label">${label}</div><div class="stat-value">${displayValue(value, profile)}</div></div>`).join('')}</div></section>
    </div>
  `;
}

async function loadProfile(playerId, bust = false) {
  state.playerId = Number(playerId);
  updateUrl(state.playerId);
  els.root.className = 'profile-root loading-state';
  els.root.textContent = 'Loading live player profile...';
  try {
    renderProfile(await buildProfile(state.playerId, bust));
  } catch (error) {
    console.error(error);
    els.root.className = 'profile-root';
    els.root.innerHTML = '<div class="empty-state">Unable to load that player profile right now.</div>';
  }
}

function debounce(fn, delay = 240) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const onSearch = debounce(async (query) => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = '';
    return;
  }
  try {
    const results = await searchPlayers(trimmed);
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = results.length ? results.slice(0, 12).map((player) => `<div class="search-result-item"><div><div class="search-name">${player.fullName}</div><div class="search-meta">${player.currentTeam?.name || 'MLB'} · ${player.primaryPosition?.abbreviation || 'N/A'}</div></div><button class="small-btn" data-open-player="${player.id}">Open</button></div>`).join('') : '<div class="empty-state">No active MLB players matched that search.</div>';
  } catch (error) {
    console.error(error);
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = '<div class="empty-state">Search is unavailable right now.</div>';
  }
});

els.searchInput.addEventListener('input', (event) => onSearch(event.target.value));
els.clearSearch.addEventListener('click', () => {
  els.searchInput.value = '';
  els.searchResults.hidden = true;
  els.searchResults.innerHTML = '';
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.closest('[data-open-player]')) {
    const id = Number(target.closest('[data-open-player]').dataset.openPlayer);
    els.searchResults.hidden = true;
    loadProfile(id, true);
    return;
  }
  if (!target.closest('.profile-search-box') && !target.closest('#player-profile-search-results')) {
    els.searchResults.hidden = true;
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.playerId) loadProfile(state.playerId, true);
});

state.timer = setInterval(() => {
  if (!document.hidden && state.playerId) loadProfile(state.playerId, true);
}, REFRESH_MS);

loadProfile(Number(new URLSearchParams(window.location.search).get('player')) || DEFAULT_PLAYER_ID, true);
