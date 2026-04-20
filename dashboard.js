const SEASON = new Date().getFullYear();
const state = {
  selectedPlayerId: null,
  selectedTab: 'overview',
  compareIds: [],
};

const cache = {
  json: new Map(),
  text: new Map(),
  players: new Map(),
  schedule: null,
  search: new Map(),
};

const els = {
  searchInput: document.getElementById('player-search'),
  clearSearch: document.getElementById('clear-search'),
  searchResults: document.getElementById('search-results'),
  playerRoot: document.getElementById('player-page-root'),
  compareRoot: document.getElementById('compare-root'),
  compareTray: document.getElementById('compare-tray'),
  topPlayers: document.getElementById('top-players-today'),
  runCompare: document.getElementById('run-compare'),
  loadJudge: document.getElementById('load-aaron-judge'),
  loadYamamoto: document.getElementById('load-yamamoto'),
};

const trendClass = {
  HOT: 'trend-hot',
  COLD: 'trend-cold',
  NEUTRAL: 'trend-neutral',
};

function updateDashboardUrl() {
  const params = new URLSearchParams();
  if (state.selectedPlayerId) params.set('player', String(state.selectedPlayerId));
  if (state.compareIds.length) params.set('compare', state.compareIds.join(','));
  if (state.selectedPlayerId && state.selectedTab && state.selectedTab !== 'overview') {
    params.set('tab', state.selectedTab);
  }
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function avg(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function stddev(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length < 2) return null;
  const mean = avg(valid);
  const variance = avg(valid.map((value) => (value - mean) ** 2));
  return variance === null ? null : Math.sqrt(variance);
}

function scale(value, min, max, inverse = false) {
  if (!Number.isFinite(value)) return null;
  const bounded = value <= min ? 0 : value >= max ? 100 : ((value - min) / (max - min)) * 100;
  return inverse ? 100 - bounded : bounded;
}

function weightedScore(parts) {
  const valid = parts.filter((part) => Number.isFinite(part.score) && Number.isFinite(part.weight));
  if (!valid.length) return null;
  const weightTotal = valid.reduce((sum, part) => sum + part.weight, 0);
  if (!weightTotal) return null;
  return valid.reduce((sum, part) => sum + (part.score * part.weight), 0) / weightTotal;
}

function formatNumber(value, digits = 3) {
  if (value === null || value === undefined || value === '') return '--';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return digits === 0 ? String(Math.round(number)) : number.toFixed(digits);
}

function formatRate(value, digits = 1) {
  if (!Number.isFinite(value)) return '--';
  return `${value.toFixed(digits)}%`;
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const LEAGUE_BASELINES = {
  hitter: {
    obp: 0.315,
    ops: 0.715,
    xwOBA: 0.320,
    wOBA: 0.315,
    bbRate: 8.5,
    kRate: 22.0,
    hardHit: 38.0,
  },
  pitcher: {
    era: 4.10,
    kBb: 2.6,
    whiffPct: 24.0,
    xERA: 4.05,
    opponentOps: 0.710,
    opponentKRate: 22.0,
  },
};

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = typeof value === 'string' ? value.replace(/%/g, '').trim() : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  return values.find((value) => Number.isFinite(value)) ?? null;
}

function blendWithBaseline(actual, baseline, reliability) {
  if (!Number.isFinite(actual)) return baseline;
  return baseline + ((actual - baseline) * Math.max(reliability, 0.12));
}

function availabilityScore(values) {
  const total = values.length || 1;
  const present = values.filter((value) => Number.isFinite(value)).length;
  return present / total;
}

function buildSampleProfile(isPitcher, season, logs) {
  const sampleSize = isPitcher
    ? parseIpToOuts(season.inningsPitched || '0.0') / 3
    : toFiniteNumber(season.plateAppearances);
  const thresholds = isPitcher ? { partial: 20, full: 80 } : { partial: 50, full: 300 };
  let tier = 'projection';
  if (Number.isFinite(sampleSize) && sampleSize >= thresholds.full) tier = 'full_sample';
  else if (Number.isFinite(sampleSize) && sampleSize >= thresholds.partial) tier = 'partial_sample';

  let reliability = 0.08;
  if (tier === 'full_sample') {
    reliability = 1;
  } else if (tier === 'partial_sample') {
    reliability = 0.35 + (((sampleSize - thresholds.partial) / (thresholds.full - thresholds.partial)) * 0.5);
  } else if (Number.isFinite(sampleSize) && sampleSize > 0) {
    reliability = 0.10 + ((sampleSize / thresholds.partial) * 0.20);
  }

  return {
    tier,
    reliability: clamp(reliability, 0.08, 1),
    confidenceLevel: tier === 'full_sample' ? 'HIGH' : tier === 'partial_sample' ? 'MEDIUM' : 'LOW',
    badgeLabel: tier === 'full_sample' ? 'Stable MLB Data' : tier === 'partial_sample' ? 'Limited Data' : 'Projected',
    reason: tier === 'full_sample'
      ? 'Qualified MLB sample with stable major-league data.'
      : tier === 'partial_sample'
        ? 'Partial MLB sample is blended with league baseline to reduce noise.'
        : 'No meaningful MLB sample yet, so the model falls back to projection logic.',
    note: tier === 'full_sample'
      ? 'Advanced metrics carry full weight.'
      : tier === 'partial_sample'
        ? 'Current production is blended with recent form and league averages.'
        : 'Projection mode uses baseline expectations until MLB data stabilizes.',
    mode: tier === 'projection' ? 'Projection-based' : tier === 'partial_sample' ? 'Blended' : 'Observed',
    sampleLabel: isPitcher ? `${formatNumber(sampleSize, 1)} IP` : `${formatNumber(sampleSize, 0)} PA`,
    weights: isPitcher
      ? (tier === 'full_sample'
        ? { recent: 0.22, advanced: 0.38, discipline: 0.18, matchup: 0.10, baseline: 0.12 }
        : tier === 'partial_sample'
          ? { recent: 0.20, advanced: 0.20, discipline: 0.24, matchup: 0.10, baseline: 0.26 }
          : { recent: 0.06, advanced: 0.08, discipline: 0.22, matchup: 0.12, baseline: 0.52 })
      : (tier === 'full_sample'
        ? { recent: 0.20, advanced: 0.38, discipline: 0.18, matchup: 0.10, baseline: 0.14 }
        : tier === 'partial_sample'
          ? { recent: 0.20, advanced: 0.20, discipline: 0.25, matchup: 0.10, baseline: 0.25 }
          : { recent: 0.06, advanced: 0.08, discipline: 0.20, matchup: 0.10, baseline: 0.56 }),
  };
}

function buildAdaptiveEvaluation(playerType, context, sampleProfile) {
  const isPitcher = playerType === 'Pitcher';
  const baseline = isPitcher ? LEAGUE_BASELINES.pitcher : LEAGUE_BASELINES.hitter;
  const recent = isPitcher
    ? weightedScore([
      { weight: 0.40, score: scale(blendWithBaseline(context.recent.kBb, baseline.kBb, sampleProfile.reliability), 1.5, 6.5) },
      { weight: 0.35, score: scale(blendWithBaseline(context.recent.era, baseline.era, sampleProfile.reliability), 2.3, 5.6, true) },
      { weight: 0.25, score: scale(blendWithBaseline(context.recent.pitchesPerOut, 4.4, sampleProfile.reliability), 3.2, 5.5, true) },
    ])
    : weightedScore([
      { weight: 0.45, score: scale(blendWithBaseline(context.recent.obp, baseline.obp, sampleProfile.reliability), 0.270, 0.450) },
      { weight: 0.30, score: scale(blendWithBaseline(context.recent.ops, baseline.ops, sampleProfile.reliability), 0.600, 1.150) },
      { weight: 0.25, score: scale(blendWithBaseline(context.recent.kRate, baseline.kRate, sampleProfile.reliability), 10, 34, true) },
    ]);
  const advanced = isPitcher
    ? weightedScore([
      { weight: 0.45, score: scale(blendWithBaseline(context.season.kBb, baseline.kBb, sampleProfile.reliability), 1.5, 6.5) },
      { weight: 0.30, score: scale(blendWithBaseline(context.whiffPct, baseline.whiffPct, sampleProfile.reliability), 18, 38) },
      { weight: 0.25, score: scale(blendWithBaseline(firstFinite(context.savant.xERA, context.season.era), baseline.xERA, sampleProfile.reliability), 2.3, 5.6, true) },
    ])
    : weightedScore([
      { weight: 0.40, score: scale(blendWithBaseline(context.savant.xwOBA, baseline.xwOBA, sampleProfile.reliability), 0.280, 0.430) },
      { weight: 0.35, score: scale(blendWithBaseline(context.savant.wOBA, baseline.wOBA, sampleProfile.reliability), 0.280, 0.430) },
      { weight: 0.25, score: scale(blendWithBaseline(context.savant.hardHit, baseline.hardHit, sampleProfile.reliability), 28, 55) },
    ]);
  const discipline = isPitcher
    ? weightedScore([
      { weight: 0.55, score: scale(blendWithBaseline(context.season.kBb, baseline.kBb, sampleProfile.reliability), 1.5, 6.5) },
      { weight: 0.45, score: scale(blendWithBaseline(context.whiffPct, baseline.whiffPct, sampleProfile.reliability), 18, 38) },
    ])
    : weightedScore([
      { weight: 0.40, score: scale(blendWithBaseline(context.season.obp, baseline.obp, sampleProfile.reliability), 0.280, 0.430) },
      { weight: 0.30, score: scale(blendWithBaseline(context.season.bbRate, baseline.bbRate, sampleProfile.reliability), 4, 16) },
      { weight: 0.30, score: scale(blendWithBaseline(context.season.kRate, baseline.kRate, sampleProfile.reliability), 10, 34, true) },
    ]);
  const matchup = isPitcher
    ? weightedScore([
      { weight: 0.50, score: scale(blendWithBaseline(context.opponent.kRate, baseline.opponentKRate, sampleProfile.reliability), 17, 29) },
      { weight: 0.50, score: scale(blendWithBaseline(context.opponent.ops, baseline.opponentOps, sampleProfile.reliability), 0.620, 0.820, true) },
    ])
    : weightedScore([
      { weight: 0.55, score: scale(blendWithBaseline(context.opponent.obpAllowed, baseline.obp, sampleProfile.reliability), 0.280, 0.360, true) },
      { weight: 0.45, score: scale(blendWithBaseline(context.opponent.kRateAllowed, 22, sampleProfile.reliability), 30, 17, true) },
    ]);
  const baselineScore = isPitcher
    ? weightedScore([
      { weight: 0.50, score: scale(blendWithBaseline(context.season.era, baseline.era, sampleProfile.reliability), 2.3, 5.6, true) },
      { weight: 0.30, score: scale(sampleProfile.reliability, 0, 1) },
      { weight: 0.20, score: scale(blendWithBaseline(firstFinite(context.savant.xERA, context.season.era), baseline.xERA, sampleProfile.reliability), 2.3, 5.6, true) },
    ])
    : weightedScore([
      { weight: 0.40, score: scale(blendWithBaseline(context.season.obp, baseline.obp, sampleProfile.reliability), 0.280, 0.430) },
      { weight: 0.40, score: scale(blendWithBaseline(context.season.ops, baseline.ops, sampleProfile.reliability), 0.600, 1.050) },
      { weight: 0.20, score: scale(sampleProfile.reliability, 0, 1) },
    ]);

  const score = weightedScore([
    { weight: sampleProfile.weights.recent, score: recent },
    { weight: sampleProfile.weights.advanced, score: advanced },
    { weight: sampleProfile.weights.discipline, score: discipline },
    { weight: sampleProfile.weights.matchup, score: matchup },
    { weight: sampleProfile.weights.baseline, score: baselineScore },
  ]);
  const availability = isPitcher
    ? availabilityScore([context.recent.kBb, context.recent.era, context.season.kBb, context.season.era, context.whiffPct, toFiniteNumber(context.savant.xERA)])
    : availabilityScore([context.recent.obp, context.recent.ops, context.season.obp, context.season.ops, context.savant.xwOBA, context.savant.wOBA, context.savant.hardHit]);
  const overallScore = Math.round(clamp(score ?? 50));
  const comparisonScore = Math.round(clamp(50 + ((overallScore - 50) * (0.30 + (sampleProfile.reliability * 0.70)))));
  return {
    score: overallScore,
    comparisonScore,
    confidence_score: overallScore,
    dataConfidence: sampleProfile.confidenceLevel,
    trend: comparisonScore >= 67 ? 'HOT' : comparisonScore <= 45 ? 'COLD' : 'NEUTRAL',
    tier: sampleProfile.tier,
    reason: sampleProfile.reason,
    note: sampleProfile.note,
    mode: sampleProfile.mode,
    sample: sampleProfile,
    confidenceValue: Math.round(clamp((35 + (sampleProfile.reliability * 45) + (availability * 20)))),
    insight: sampleProfile.tier === 'full_sample'
      ? 'Stable MLB data is carrying the full model weight.'
      : sampleProfile.tier === 'partial_sample'
        ? 'Limited MLB data is blended with baseline context to avoid misleading small-sample spikes.'
        : 'Projection mode is active, so the score is intentionally regressed toward league average.',
    comparisonNote: sampleProfile.tier === 'full_sample'
      ? 'Comparison uses full observed MLB production.'
      : sampleProfile.tier === 'partial_sample'
        ? 'Comparison is normalized to reduce small-sample volatility.'
        : 'Comparison is projection-based and conservative until MLB data arrives.',
  };
}

function headshotUrl(id) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:best/v1/people/${id}/headshot/67/current`;
}

async function fetchJson(url) {
  if (cache.json.has(url)) return cache.json.get(url);
  const promise = fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return response.json();
  });
  cache.json.set(url, promise);
  return promise;
}

async function fetchText(url) {
  if (cache.text.has(url)) return cache.text.get(url);
  const promise = fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return response.text();
  });
  cache.text.set(url, promise);
  return promise;
}

async function searchPlayers(query) {
  const normalized = query.trim().toLowerCase();
  if (cache.search.has(normalized)) return cache.search.get(normalized);
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}`);
  const people = (data.people || []).filter((person) => person.active);
  cache.search.set(normalized, people);
  return people;
}

async function fetchPerson(id) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=currentTeam`);
  return data.people && data.people[0] ? data.people[0] : null;
}

async function fetchSeasonStats(id, group) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season,seasonAdvanced&group=${group}&season=${SEASON}`);
  const season = (data.stats || []).find((entry) => entry.type?.displayName === 'season')?.splits?.[0]?.stat || {};
  const advanced = (data.stats || []).find((entry) => entry.type?.displayName === 'seasonAdvanced')?.splits?.[0]?.stat || {};
  return { season, advanced };
}

async function fetchGameLogs(id, group) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=${group}&season=${SEASON}`);
  return ((data.stats || [])[0] || {}).splits || [];
}

async function fetchTodaySchedule() {
  if (cache.schedule) return cache.schedule;
  const today = new Date().toISOString().slice(0, 10);
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`);
  const games = (data.dates && data.dates[0] && data.dates[0].games) || [];
  const teamMap = new Map();
  games.forEach((game) => {
    const homeId = game.teams?.home?.team?.id;
    const awayId = game.teams?.away?.team?.id;
    if (homeId && awayId) {
      teamMap.set(homeId, { opponentId: awayId, opponentName: game.teams.away.team.name, gamePk: game.gamePk });
      teamMap.set(awayId, { opponentId: homeId, opponentName: game.teams.home.team.name, gamePk: game.gamePk });
    }
  });
  cache.schedule = { games, teamMap };
  return cache.schedule;
}

async function fetchTeamSeasonStats(teamId, group) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=${group}&season=${SEASON}`);
  return (((data.stats || [])[0] || {}).splits || [])[0]?.stat || {};
}

function parseSavantTableMap(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = Array.from(doc.querySelectorAll('table')).find((candidate) => {
    const headers = Array.from(candidate.querySelectorAll('thead th')).map((th) => th.textContent.replace(/\s+/g, ' ').trim());
    return headers.includes('xwOBA') || headers.includes('xERA');
  });
  if (!table) return null;
  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.replace(/\s+/g, ' ').trim());
  const row = Array.from(table.querySelectorAll('tbody tr')).find((tr) => tr.cells && tr.cells[0] && tr.cells[0].textContent.trim() === String(SEASON));
  if (!row) return null;
  const values = {};
  headers.forEach((header, index) => {
    const cell = row.cells[index];
    if (!cell) return;
    values[header] = cell.textContent.replace(/\s+/g, ' ').trim();
  });
  return values;
}

async function fetchSavantSummary(person) {
  if (!person?.nameSlug) return {};
  try {
    const html = await fetchText(`https://baseballsavant.mlb.com/savant-player/${person.nameSlug}`);
    return parseSavantTableMap(html) || {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

async function fetchZonePitches(player, logs) {
  const latest = logs[0];
  if (!latest?.game?.gamePk) return [];
  const feed = await fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${latest.game.gamePk}/feed/live`);
  const allPlays = feed.liveData?.plays?.allPlays || [];
  const isPitcher = player.primaryPosition?.type === 'Pitcher';
  const filtered = [];

  allPlays.forEach((play) => {
    const matches = isPitcher ? play.matchup?.pitcher?.id === player.id : play.matchup?.batter?.id === player.id;
    if (!matches) return;
    (play.playEvents || []).forEach((event) => {
      if (!event.isPitch || !event.pitchData) return;
      const coordinates = event.pitchData.coordinates || {};
      filtered.push({
        x: typeof coordinates.pX === 'number' ? coordinates.pX : null,
        z: typeof coordinates.pZ === 'number' ? coordinates.pZ : null,
        result: event.details?.description || event.details?.call?.description || '',
        pitchType: event.details?.type?.description || event.details?.type?.code || 'Pitch',
        velocity: event.pitchData?.startSpeed || null,
        count: `${event.count?.balls ?? play.count?.balls ?? 0}-${event.count?.strikes ?? play.count?.strikes ?? 0}`,
        batter: play.matchup?.batter?.fullName || '',
      });
    });
  });
  return filtered;
}

function hitterRollingPoints(logs) {
  return logs.slice(0, 12).reverse().map((log) => ({
    label: formatDate(log.date),
    value: Number(log.stat?.ops || 0),
  }));
}

function pitcherRollingPoints(logs) {
  return logs.slice(0, 12).reverse().map((log) => ({
    label: formatDate(log.date),
    value: Number(log.stat?.era || 0),
  }));
}

function summarizeRecentHitter(logs) {
  const sample = logs.length < 5 ? logs.slice(0, logs.length) : logs.slice(0, 7);
  if (!sample.length) {
    return {
      obp: null,
      ops: null,
      kRate: null,
      obpStdDev: null,
      opsStdDev: null,
      samplePA: 0,
      summary: 'No MLB game logs available.',
    };
  }
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
    acc.opsValues.push(Number(stat.ops || 0));
    acc.obpValues.push(Number(stat.obp || 0));
    return acc;
  }, { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, tb: 0, pa: 0, k: 0, opsValues: [], obpValues: [] });

  const obp = totals.pa ? (totals.h + totals.bb + totals.hbp) / (totals.ab + totals.bb + totals.hbp + totals.sf || 1) : null;
  const slg = totals.ab ? totals.tb / totals.ab : null;
  const ops = obp !== null && slg !== null ? obp + slg : null;
  const kRate = totals.pa ? (totals.k / totals.pa) * 100 : null;
  return {
    obp,
    ops,
    kRate,
    obpStdDev: stddev(totals.obpValues),
    opsStdDev: stddev(totals.opsValues),
    samplePA: totals.pa,
    summary: `${totals.h}-${totals.ab}, ${totals.bb} BB, ${totals.k} K across ${sample.length} available MLB games`,
  };
}

function summarizeRecentPitcher(logs) {
  const sample = logs.length < 5 ? logs.slice(0, logs.length) : logs.slice(0, 5);
  if (!sample.length) {
    return {
      kBb: null,
      pitchesPerOut: null,
      era: null,
      eraStdDev: null,
      whipStdDev: null,
      sampleInnings: 0,
      summary: 'No MLB game logs available.',
    };
  }
  const totals = sample.reduce((acc, log) => {
    const stat = log.stat || {};
    acc.outs += parseIpToOuts(stat.inningsPitched || '0.0');
    acc.er += Number(stat.earnedRuns || 0);
    acc.k += Number(stat.strikeOuts || 0);
    acc.bb += Number(stat.baseOnBalls || 0);
    acc.pitches += Number(stat.numberOfPitches || stat.pitchesThrown || 0);
    acc.eraValues.push(Number(stat.era || 0));
    acc.whipValues.push(Number(stat.whip || 0));
    return acc;
  }, { outs: 0, er: 0, k: 0, bb: 0, pitches: 0, eraValues: [], whipValues: [] });
  const innings = totals.outs / 3;
  return {
    kBb: totals.bb ? totals.k / totals.bb : totals.k,
    pitchesPerOut: totals.outs ? totals.pitches / totals.outs : null,
    era: innings ? (totals.er * 9) / innings : null,
    eraStdDev: stddev(totals.eraValues),
    whipStdDev: stddev(totals.whipValues),
    sampleInnings: innings,
    summary: `${formatNumber(innings, 1)} IP, ${totals.k} K, ${totals.bb} BB across ${sample.length} available MLB starts`,
  };
}

function parseIpToOuts(ipString) {
  if (!ipString || typeof ipString !== 'string') return 0;
  const [whole = '0', partial = '0'] = ipString.split('.');
  return Number(whole) * 3 + Number(partial);
}


async function buildPlayerDashboard(id) {
  if (cache.players.has(id)) return cache.players.get(id);
  const promise = (async () => {
    const person = await fetchPerson(id);
    if (!person) throw new Error('Player not found');
    const isPitcher = person.primaryPosition?.type === 'Pitcher';
    const group = isPitcher ? 'pitching' : 'hitting';
    const [{ season, advanced }, logs, savant, today] = await Promise.all([
      fetchSeasonStats(id, group),
      fetchGameLogs(id, group),
      fetchSavantSummary(person),
      fetchTodaySchedule(),
    ]);
    const teamId = person.currentTeam?.id;
    const matchupInfo = teamId ? today.teamMap.get(teamId) : null;
    const opponent = matchupInfo ? await fetchTeamSeasonStats(matchupInfo.opponentId, isPitcher ? 'hitting' : 'pitching') : {};
    const zonePitches = await fetchZonePitches(person, logs);
    const recent = isPitcher ? summarizeRecentPitcher(logs) : summarizeRecentHitter(logs);
    const sampleProfile = buildSampleProfile(isPitcher, season, logs);

    const context = isPitcher ? {
      name: person.fullName,
      season: {
        era: toFiniteNumber(season.era),
        kBb: firstFinite(toFiniteNumber(season.strikeoutWalkRatio), toFiniteNumber(advanced.strikesoutsToWalks)),
      },
      recent,
      whiffPct: toFiniteNumber(advanced.whiffPercentage) !== null ? toFiniteNumber(advanced.whiffPercentage) * 100 : null,
      savant: {
        xERA: toFiniteNumber(savant.xERA),
      },
      opponent: {
        name: matchupInfo?.opponentName || '',
        kRate: toFiniteNumber(opponent.strikeOuts) && toFiniteNumber(opponent.plateAppearances) ? (toFiniteNumber(opponent.strikeOuts) / toFiniteNumber(opponent.plateAppearances)) * 100 : null,
        ops: toFiniteNumber(opponent.ops),
      },
    } : {
      name: person.fullName,
      season: {
        obp: toFiniteNumber(season.obp),
        ops: toFiniteNumber(season.ops),
        bbRate: toFiniteNumber(season.baseOnBalls) && toFiniteNumber(season.plateAppearances) ? (toFiniteNumber(season.baseOnBalls) / toFiniteNumber(season.plateAppearances)) * 100 : null,
        kRate: toFiniteNumber(season.strikeOuts) && toFiniteNumber(season.plateAppearances) ? (toFiniteNumber(season.strikeOuts) / toFiniteNumber(season.plateAppearances)) * 100 : null,
      },
      recent,
      savant: {
        xwOBA: toFiniteNumber(savant.xwOBA),
        wOBA: toFiniteNumber(savant.wOBA),
        hardHit: toFiniteNumber(savant['Hard Hit%']),
      },
      opponent: {
        name: matchupInfo?.opponentName || '',
        obpAllowed: toFiniteNumber(opponent.obp),
        kRateAllowed: toFiniteNumber(opponent.strikeoutsPer9Inn),
      },
    };

    return {
      id,
      person,
      isPitcher,
      season,
      advanced,
      logs,
      savant,
      zonePitches,
      recent,
      sampleProfile,
      confidence: buildAdaptiveEvaluation(person.primaryPosition?.type, context, sampleProfile),
      matchupInfo,
      opponent,
    };
  })();
  cache.players.set(id, promise);
  return promise;
}

function renderSearchResults(results) {
  if (!results.length) {
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = '<div class="empty-state">No active MLB players matched that search.</div>';
    return;
  }
  els.searchResults.hidden = false;
  els.searchResults.innerHTML = results.slice(0, 12).map((person) => `
    <div class="search-result-item">
      <div>
        <div class="search-name">${person.fullName}</div>
        <div class="search-meta">${person.primaryPosition?.abbreviation || ''} · ${person.currentAge ? `Age ${person.currentAge}` : 'MLB Active Player'}</div>
      </div>
      <button class="small-btn" data-open-player="${person.id}">Open</button>
      <button class="small-btn" data-compare-player="${person.id}">Compare</button>
    </div>`).join('');
}

function renderCompareTray() {
  if (!state.compareIds.length) {
    els.compareTray.className = 'side-body compare-tray empty';
    els.compareTray.textContent = 'Add players from search to compare.';
    updateDashboardUrl();
    return;
  }
  els.compareTray.className = 'side-body compare-tray';
  Promise.all(state.compareIds.map((id) => buildPlayerDashboard(id))).then((players) => {
    els.compareTray.innerHTML = players.map((player) => `
      <div class="compare-item">
        <div>
          <div class="compare-name">${player.person.fullName}</div>
          <div class="compare-meta">${player.person.currentTeam?.name || 'MLB'} · ${player.person.primaryPosition?.abbreviation || ''}</div>
        </div>
        <button class="remove-btn" data-remove-compare="${player.id}" aria-label="Remove">×</button>
      </div>`).join('');
    updateDashboardUrl();
  });
}

function renderRollingChart(points, inverse = false) {
  if (!points.length) return '<div class="empty-state">Not enough game log data to render a rolling chart yet.</div>';
  const width = 640;
  const height = 260;
  const padding = 28;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const normalized = inverse ? ((max - point.value) / range) : ((point.value - min) / range);
    const y = height - padding - (normalized * (height - padding * 2));
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${padding},${height - padding} ${line} ${coords[coords.length - 1].x},${height - padding}`;
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
      <line class="chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" />
      <line class="chart-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" />
      <polygon class="chart-fill" points="${area}" />
      <polyline class="chart-line" points="${line}" />
      ${coords.map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"></circle>`).join('')}
      ${coords.map((point) => `<text class="chart-label" x="${point.x}" y="${height - 10}" text-anchor="middle">${point.label}</text>`).join('')}
    </svg>`;
}

function renderZoneChart(pitches) {
  if (!pitches.length || !pitches.some((pitch) => pitch.x !== null && pitch.z !== null)) {
    return '<div class="empty-state">Pitch location data is not available for the selected sample.</div>';
  }
  const points = pitches.filter((pitch) => pitch.x !== null && pitch.z !== null).map((pitch) => {
    const cx = 180 + (pitch.x * 60);
    const cy = 320 - ((pitch.z - 1.0) * 72);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="rgba(59,130,246,0.72)" stroke="rgba(255,255,255,0.7)" stroke-width="1" data-result="${(pitch.result || '').replace(/"/g, '&quot;')}" data-pitch="${(pitch.pitchType || '').replace(/"/g, '&quot;')}" data-velo="${pitch.velocity ? pitch.velocity.toFixed(1) : '--'}"></circle>`;
  }).join('');
  return `
    <svg class="zone-chart" viewBox="0 0 360 380">
      <rect x="97" y="104" width="166" height="162" rx="16" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" stroke-width="2"></rect>
      <line x1="152" y1="104" x2="152" y2="266" stroke="rgba(255,255,255,.14)"></line>
      <line x1="207" y1="104" x2="207" y2="266" stroke="rgba(255,255,255,.14)"></line>
      <line x1="97" y1="158" x2="263" y2="158" stroke="rgba(255,255,255,.14)"></line>
      <line x1="97" y1="212" x2="263" y2="212" stroke="rgba(255,255,255,.14)"></line>
      ${points}
    </svg>`;
}

function displayDashboardValue(value, player, missingLabel = '--') {
  if (value === null || value === undefined || value === '') {
    if (player?.sampleProfile?.tier === 'projection') return 'Projected';
    if (player?.sampleProfile?.tier === 'partial_sample') return missingLabel;
    return '--';
  }
  return value;
}

function buildComparisonSummary(players) {
  const sorted = [...players].sort((a, b) => b.confidence.comparisonScore - a.confidence.comparisonScore);
  const leader = sorted[0];
  const trailer = sorted[sorted.length - 1];
  return `${leader.person.fullName} leads this normalized comparison at ${leader.confidence.comparisonScore}. ${trailer.person.fullName} is being regressed more heavily because ${trailer.confidence.reason.toLowerCase()}`;
}

function renderOverviewTab(data) {
  const points = data.isPitcher ? pitcherRollingPoints(data.logs) : hitterRollingPoints(data.logs);
  const title = data.isPitcher ? 'Rolling ERA' : 'Rolling OPS';
  return `
    <div class="tab-grid">
      <div class="surface-card">
        <h3>${title}</h3>
        <p class="surface-copy">${data.isPitcher ? 'Recent outing trend based on game-log ERA by start.' : 'Recent game-log OPS trend to visualize current form.'}</p>
        <div class="chart-wrap">${renderRollingChart(points, data.isPitcher)}</div>
      </div>
      <div class="surface-card">
        <h3>Recent Form</h3>
        <p class="surface-copy">${data.recent.summary || 'Recent form unavailable.'}</p>
        <div class="metric-list" style="margin-top:16px;">
          ${data.isPitcher ? `
            <div class="metric-item"><span class="metric-label">Recent K/BB</span><span class="metric-value">${formatNumber(data.recent.kBb, 2)}</span></div>
            <div class="metric-item"><span class="metric-label">Pitches / Out</span><span class="metric-value">${formatNumber(data.recent.pitchesPerOut, 2)}</span></div>
            <div class="metric-item"><span class="metric-label">Whiff %</span><span class="metric-value">${formatRate(Number(data.advanced.whiffPercentage || 0) * 100)}</span></div>
            <div class="metric-item"><span class="metric-label">Opponent</span><span class="metric-value">${data.matchupInfo?.opponentName || 'TBD'}</span></div>` : `
            <div class="metric-item"><span class="metric-label">Recent OBP</span><span class="metric-value">${formatNumber(data.recent.obp, 3)}</span></div>
            <div class="metric-item"><span class="metric-label">Recent OPS</span><span class="metric-value">${formatNumber(data.recent.ops, 3)}</span></div>
            <div class="metric-item"><span class="metric-label">Recent K %</span><span class="metric-value">${formatRate(data.recent.kRate)}</span></div>
            <div class="metric-item"><span class="metric-label">Opponent</span><span class="metric-value">${data.matchupInfo?.opponentName || 'TBD'}</span></div>`}
        </div>
      </div>
    </div>`;
}

function renderAdvancedTab(data) {
  const items = data.isPitcher ? [
    ['ERA', data.season.era],
    ['WHIP', data.season.whip],
    ['K/9', data.season.strikeoutsPer9Inn || data.advanced.strikeoutsPer9],
    ['BB/9', data.season.walksPer9Inn || data.advanced.baseOnBallsPer9],
    ['K/BB', data.season.strikeoutWalkRatio || data.advanced.strikesoutsToWalks],
    ['Whiff %', formatRate(Number(data.advanced.whiffPercentage || 0) * 100)],
    ['xERA', data.savant.xERA || 'Unavailable'],
    ['BABIP', data.advanced.babip || '--'],
  ] : [
    ['AVG', data.season.avg],
    ['OBP', data.season.obp],
    ['SLG', data.season.slg],
    ['OPS', data.season.ops],
    ['xwOBA', data.savant.xwOBA || 'Unavailable'],
    ['wOBA', data.savant.wOBA || 'Unavailable'],
    ['xBA', data.savant.xBA || 'Unavailable'],
    ['xSLG', data.savant.xSLG || 'Unavailable'],
    ['K %', data.savant['K%'] ? `${data.savant['K%']}%` : 'Unavailable'],
    ['BB %', data.savant['BB%'] ? `${data.savant['BB%']}%` : 'Unavailable'],
  ];
  return `
    <div class="surface-card">
      <h3>Advanced Metrics</h3>
      <p class="surface-copy">Live season stats pulled from MLB data with Statcast expected metrics layered in when available.</p>
      <div class="metric-list" style="margin-top:16px;">${items.map(([label, value]) => `<div class="metric-item"><span class="metric-label">${label}</span><span class="metric-value">${value ?? '--'}</span></div>`).join('')}</div>
    </div>`;
}

function renderGameLogsTab(data) {
  const headers = data.isPitcher ? ['Date', 'Opp', 'IP', 'ER', 'K', 'BB', 'Pitches'] : ['Date', 'Opp', 'AB', 'H', 'OBP', 'OPS', 'K'];
  const rows = data.logs.slice(0, 15).map((log) => {
    const stat = log.stat || {};
    return data.isPitcher ? `<tr><td>${formatDate(log.date)}</td><td>${log.opponent?.name || ''}</td><td>${stat.inningsPitched || '--'}</td><td>${stat.earnedRuns || 0}</td><td>${stat.strikeOuts || 0}</td><td>${stat.baseOnBalls || 0}</td><td>${stat.numberOfPitches || stat.pitchesThrown || 0}</td></tr>` : `<tr><td>${formatDate(log.date)}</td><td>${log.opponent?.name || ''}</td><td>${stat.atBats || 0}</td><td>${stat.hits || 0}</td><td>${stat.obp || '--'}</td><td>${stat.ops || '--'}</td><td>${stat.strikeOuts || 0}</td></tr>`;
  }).join('');
  return `
    <div class="surface-card">
      <h3>Game Logs</h3>
      <p class="surface-copy">Recent game-level production from the live MLB game log feed.</p>
      <div class="log-table-wrap">
        <table class="log-table">
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderMatchupTab(data) {
  return `
    <div class="tab-grid">
      <div class="surface-card">
        <h3>Matchup Insight</h3>
        <p class="surface-copy">${data.confidence.insight}</p>
        <div class="metric-list" style="margin-top:16px;">
          ${data.isPitcher ? `
            <div class="metric-item"><span class="metric-label">Opp Team</span><span class="metric-value">${data.matchupInfo?.opponentName || 'TBD'}</span></div>
            <div class="metric-item"><span class="metric-label">Opp OPS</span><span class="metric-value">${data.opponent.ops || '--'}</span></div>
            <div class="metric-item"><span class="metric-label">Opp K %</span><span class="metric-value">${formatRate(Number(data.opponent.strikeOuts || 0) && Number(data.opponent.plateAppearances || 0) ? (Number(data.opponent.strikeOuts) / Number(data.opponent.plateAppearances)) * 100 : null)}</span></div>
            <div class="metric-item"><span class="metric-label">Confidence</span><span class="metric-value">${data.confidence.confidence_score}</span></div>` : `
            <div class="metric-item"><span class="metric-label">Opp Team</span><span class="metric-value">${data.matchupInfo?.opponentName || 'TBD'}</span></div>
            <div class="metric-item"><span class="metric-label">Opp OBP Allowed</span><span class="metric-value">${data.opponent.obp || '--'}</span></div>
            <div class="metric-item"><span class="metric-label">Opp K/9</span><span class="metric-value">${data.opponent.strikeoutsPer9Inn || '--'}</span></div>
            <div class="metric-item"><span class="metric-label">Confidence</span><span class="metric-value">${data.confidence.confidence_score}</span></div>`}
        </div>
      </div>
      <div class="surface-card">
        <h3>${data.isPitcher ? 'Latest Pitch Map' : 'Latest Zone View'}</h3>
        <p class="surface-copy">${data.isPitcher ? 'Pitch locations from the most recent tracked outing.' : 'Pitch locations faced in the most recent tracked game.'}</p>
        <div class="chart-wrap">${renderZoneChart(data.zonePitches)}</div>
        <div class="zone-tooltip" id="zone-tooltip">Hover support is available on desktop by reading pitch colors and locations directly in the chart.</div>
      </div>
    </div>`;
}

function renderPlayerPage(data) {
  const statCards = data.isPitcher ? [
    ['ERA', data.season.era],
    ['WHIP', data.season.whip],
    ['K/9', data.season.strikeoutsPer9Inn || data.advanced.strikeoutsPer9],
    ['K/BB', data.season.strikeoutWalkRatio || data.advanced.strikesoutsToWalks],
    ['Whiff %', formatRate(Number(data.advanced.whiffPercentage || 0) * 100)],
    ['xERA', data.savant.xERA || '--'],
  ] : [
    ['AVG', data.season.avg],
    ['OBP', data.season.obp],
    ['SLG', data.season.slg],
    ['OPS', data.season.ops],
    ['xwOBA', data.savant.xwOBA || '--'],
    ['K %', data.savant['K%'] ? `${data.savant['K%']}%` : '--'],
  ];

  els.playerRoot.className = 'content-panel';
  els.playerRoot.innerHTML = `
    <div class="player-header">
      <img class="player-headshot" src="${headshotUrl(data.id)}" alt="${data.person.fullName}">
      <div>
        <div class="player-name">${data.person.fullName}</div>
        <div class="player-meta">
          <span>${data.person.currentTeam?.name || 'MLB'}</span>
          <span>•</span>
          <span>${data.person.primaryPosition?.abbreviation || ''}</span>
          <span>•</span>
          <span>${data.person.batSide?.description || data.person.pitchHand?.description || ''}</span>
          <span>•</span>
          <span>Age ${data.person.currentAge || '--'}</span>
        </div>
        <div class="search-sub" style="margin-top:12px;">${data.sampleProfile.badgeLabel} · ${data.confidence.dataConfidence} confidence · ${data.sampleProfile.sampleLabel}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
          <a class="small-btn" href="./player.html?player=${data.id}" style="display:inline-flex;align-items:center;justify-content:center;">Full Profile</a>
          <a class="small-btn" href="./players.html" style="display:inline-flex;align-items:center;justify-content:center;">Directory</a>
        </div>
      </div>
      <div class="score-block">
        <div class="score-pill ${trendClass[data.confidence.trend]}">${data.confidence.score}</div>
        <div class="search-sub ${trendClass[data.confidence.trend]}" style="margin-top:8px;">${data.confidence.dataConfidence} confidence</div>
        <div class="score-insight">${data.confidence.insight}</div>
      </div>
    </div>

    <div class="stat-card-grid">
      ${statCards.map(([label, value]) => `<div class="stat-card"><div class="stat-key">${label}</div><div class="stat-value">${displayDashboardValue(value, data)}</div></div>`).join('')}
    </div>

    <div class="player-tabs">
      ${['overview', 'advanced', 'logs', 'matchup'].map((key) => `<button class="player-tab ${state.selectedTab === key ? 'active' : ''}" data-tab="${key}">${key === 'logs' ? 'Game Logs' : key === 'matchup' ? 'Matchup Insights' : key.charAt(0).toUpperCase() + key.slice(1)}</button>`).join('')}
    </div>

    <div class="tab-panel" id="tab-panel"></div>`;

  renderTabContent(data);
}

function renderTabContent(data) {
  const panel = document.getElementById('tab-panel');
  if (!panel) return;
  if (state.selectedTab === 'overview') panel.innerHTML = renderOverviewTab(data);
  if (state.selectedTab === 'advanced') panel.innerHTML = renderAdvancedTab(data);
  if (state.selectedTab === 'logs') panel.innerHTML = renderGameLogsTab(data);
  if (state.selectedTab === 'matchup') panel.innerHTML = renderMatchupTab(data);
}

async function loadPlayer(id) {
  state.selectedPlayerId = id;
  state.selectedTab = 'overview';
  els.compareRoot.hidden = true;
  els.playerRoot.hidden = false;
  els.playerRoot.className = 'content-panel loading-state';
  els.playerRoot.textContent = 'Loading player dashboard…';
  try {
    const data = await buildPlayerDashboard(id);
    renderPlayerPage(data);
    updateDashboardUrl();
  } catch (error) {
    console.error(error);
    els.playerRoot.className = 'content-panel';
    els.playerRoot.innerHTML = '<div class="empty-state">Unable to load that player right now.</div>';
  }
}

async function renderCompare() {
  if (state.compareIds.length < 2) {
    els.compareRoot.hidden = false;
    els.compareRoot.innerHTML = '<div class="empty-state">Select at least two players to compare.</div>';
    return;
  }
  els.compareRoot.hidden = false;
  els.playerRoot.hidden = true;
  els.compareRoot.className = 'content-panel compare-root';
  els.compareRoot.innerHTML = '<div class="loading-state">Building player comparison…</div>';
  const players = await Promise.all(state.compareIds.map((id) => buildPlayerDashboard(id)));
  const comparisonSummary = buildComparisonSummary(players);
  els.compareRoot.innerHTML = `
    <div>
      <div class="side-label">Compare</div>
      <div class="compare-title">Player Comparison</div>
      <div class="search-sub" style="margin-top:10px;">${comparisonSummary}</div>
    </div>
    <div class="compare-grid">
      ${players.map((player) => `
        <div class="compare-player-card">
          <div class="compare-title">${player.person.fullName}</div>
          <div class="search-sub" style="margin-top:8px;">${player.person.currentTeam?.name || 'MLB'} · ${player.person.primaryPosition?.abbreviation || ''}</div>
          <div class="search-sub" style="margin-top:8px;">${player.sampleProfile.badgeLabel} · ${player.confidence.dataConfidence} confidence</div>
          <div class="score-pill ${trendClass[player.confidence.trend]}" style="margin-top:14px; display:inline-flex;">${player.confidence.comparisonScore}</div>
          <div class="compare-stats">
            ${player.isPitcher ? `
              <div class="compare-stat-row"><span>ERA</span><strong>${displayDashboardValue(player.season.era, player)}</strong></div>
              <div class="compare-stat-row"><span>WHIP</span><strong>${displayDashboardValue(player.season.whip, player)}</strong></div>
              <div class="compare-stat-row"><span>K/9</span><strong>${displayDashboardValue(player.season.strikeoutsPer9Inn || player.advanced.strikeoutsPer9, player)}</strong></div>
              <div class="compare-stat-row"><span>xERA</span><strong>${displayDashboardValue(player.savant.xERA, player)}</strong></div>` : `
              <div class="compare-stat-row"><span>AVG</span><strong>${displayDashboardValue(player.season.avg, player)}</strong></div>
              <div class="compare-stat-row"><span>OBP</span><strong>${displayDashboardValue(player.season.obp, player)}</strong></div>
              <div class="compare-stat-row"><span>OPS</span><strong>${displayDashboardValue(player.season.ops, player)}</strong></div>
              <div class="compare-stat-row"><span>xwOBA</span><strong>${displayDashboardValue(player.savant.xwOBA, player)}</strong></div>`}
              <div class="compare-stat-row"><span>Tier</span><strong>${player.sampleProfile.tier.replace('_', ' ')}</strong></div>
              <div class="compare-stat-row"><span>Mode</span><strong>${player.confidence.mode}</strong></div>
          </div>
          <div class="search-sub" style="margin-top:12px;">${player.confidence.comparisonNote}</div>
        </div>`).join('')}
    </div>`;
}

async function loadTopPlayersToday() {
  els.topPlayers.innerHTML = 'Loading confidence board…';
  try {
    const schedule = await fetchTodaySchedule();
    const teamIds = [...schedule.teamMap.keys()];
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&playerPool=qualified&sportIds=1&season=${SEASON}&limit=150`);
    const splits = (data.stats && data.stats[0] && data.stats[0].splits) || [];
    const candidates = splits.filter((split) => teamIds.includes(split.team?.id)).sort((a, b) => Number(b.stat?.ops || 0) - Number(a.stat?.ops || 0)).slice(0, 10);
    const scored = await Promise.all(candidates.map(async (candidate) => {
      const player = await buildPlayerDashboard(candidate.player.id);
      return player;
    }));
    scored.sort((a, b) => b.confidence.comparisonScore - a.confidence.comparisonScore);
    els.topPlayers.innerHTML = `<div class="today-list">${scored.slice(0, 6).map((player) => `
      <div class="today-item">
        <div class="today-item-top">
          <div>
            <div class="today-name">${player.person.fullName}</div>
            <div class="search-sub">${player.person.currentTeam?.name || 'MLB'} · ${player.matchupInfo?.opponentName || 'No matchup'}</div>
          </div>
          <div class="score-pill ${trendClass[player.confidence.trend]}">${player.confidence.comparisonScore}</div>
        </div>
        <div class="search-sub ${trendClass[player.confidence.trend]}">${player.confidence.dataConfidence} confidence</div>
        <div class="today-insight">${player.confidence.insight}</div>
        <button class="small-btn" data-open-player="${player.id}">Open Player</button>
      </div>`).join('')}</div>`;
  } catch (error) {
    console.error(error);
    els.topPlayers.innerHTML = '<div class="empty-state">Unable to build the Top Players Today board right now.</div>';
  }
}

function addCompare(id) {
  if (state.compareIds.includes(id)) return;
  if (state.compareIds.length >= 3) state.compareIds.shift();
  state.compareIds.push(id);
  renderCompareTray();
}

function removeCompare(id) {
  state.compareIds = state.compareIds.filter((entry) => entry !== id);
  renderCompareTray();
}

function debounce(fn, wait = 220) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

const handleSearch = debounce(async (query) => {
  if (query.trim().length < 2) {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = '';
    return;
  }
  try {
    const results = await searchPlayers(query.trim());
    renderSearchResults(results);
  } catch (error) {
    console.error(error);
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = '<div class="empty-state">Search is unavailable right now.</div>';
  }
});

els.searchInput.addEventListener('input', (event) => handleSearch(event.target.value));
els.clearSearch.addEventListener('click', () => {
  els.searchInput.value = '';
  els.searchResults.hidden = true;
  els.searchResults.innerHTML = '';
});
els.loadJudge.addEventListener('click', () => loadPlayer(592450));
els.loadYamamoto.addEventListener('click', () => loadPlayer(808967));
els.runCompare.addEventListener('click', () => renderCompare());

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!target.closest('.search-box') && !target.closest('#search-results')) {
    els.searchResults.hidden = true;
  }
  if (target.closest('[data-open-player]')) {
    const id = Number(target.closest('[data-open-player]').dataset.openPlayer);
    loadPlayer(id);
    els.searchResults.hidden = true;
    return;
  }
  if (target.closest('[data-compare-player]')) {
    const id = Number(target.closest('[data-compare-player]').dataset.comparePlayer);
    addCompare(id);
    return;
  }
  if (target.closest('[data-remove-compare]')) {
    removeCompare(Number(target.closest('[data-remove-compare]').dataset.removeCompare));
    return;
  }
  if (target.closest('[data-tab]')) {
    state.selectedTab = target.closest('[data-tab]').dataset.tab;
    document.querySelectorAll('.player-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === state.selectedTab));
    if (state.selectedPlayerId) {
      updateDashboardUrl();
      buildPlayerDashboard(state.selectedPlayerId).then((data) => renderTabContent(data));
    }
  }
});

renderCompareTray();
loadTopPlayersToday();
const params = new URLSearchParams(window.location.search);
const initialCompare = (params.get('compare') || '')
  .split(',')
  .map((value) => Number(value))
  .filter((value) => Number.isFinite(value) && value > 0);
if (initialCompare.length) {
  state.compareIds = [...new Set(initialCompare)].slice(0, 3);
  renderCompareTray();
}

const initialPlayer = Number(params.get('player')) || 592450;
const initialTab = params.get('tab');
loadPlayer(initialPlayer).then(() => {
  if (initialTab && ['overview', 'advanced', 'logs', 'matchup'].includes(initialTab)) {
    state.selectedTab = initialTab;
    buildPlayerDashboard(initialPlayer).then((data) => {
      document.querySelectorAll('.player-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === state.selectedTab));
      renderTabContent(data);
      updateDashboardUrl();
    });
  }
});
