const SEASON = new Date().getFullYear();
const POLL_MS = 10000;

const state = {
  playerId: null,
  timer: null,
};

const cache = {
  json: new Map(),
  text: new Map(),
  playerProfiles: new Map(),
  search: new Map(),
  schedule: null,
};

const els = {
  root: document.getElementById('player-profile-root'),
  searchInput: document.getElementById('player-profile-search'),
  clearSearch: document.getElementById('clear-player-search'),
  searchResults: document.getElementById('player-profile-search-results'),
};

const trendClass = {
  HOT: 'trend-hot',
  COLD: 'trend-cold',
  NEUTRAL: 'trend-neutral',
};

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
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return 'Unavailable';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return digits === 0 ? String(Math.round(number)) : number.toFixed(digits);
}

function formatShort(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Unavailable';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toFixed(digits);
}

function formatRate(value, digits = 1) {
  if (!Number.isFinite(value)) return 'Unavailable';
  return `${value.toFixed(digits)}%`;
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function headshotUrl(id) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${id}/headshot/67/current`;
}

function unavailable(value) {
  return value === null || value === undefined || value === '' ? 'Unavailable' : value;
}

function updateProfileUrl(playerId) {
  const params = new URLSearchParams(window.location.search);
  params.set('player', String(playerId));
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

async function fetchJson(url, bust = false) {
  if (!bust && cache.json.has(url)) return cache.json.get(url);
  const promise = fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return response.json();
  });
  if (!bust) cache.json.set(url, promise);
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

async function fetchPerson(id, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=currentTeam`, bust);
  return data.people && data.people[0] ? data.people[0] : null;
}

async function fetchSeasonStats(id, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season,seasonAdvanced&group=${group}&season=${SEASON}`, bust);
  const season = (data.stats || []).find((entry) => entry.type?.displayName === 'season')?.splits?.[0]?.stat || {};
  const advanced = (data.stats || []).find((entry) => entry.type?.displayName === 'seasonAdvanced')?.splits?.[0]?.stat || {};
  return { season, advanced };
}

async function fetchGameLogs(id, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=${group}&season=${SEASON}`, bust);
  return ((data.stats || [])[0] || {}).splits || [];
}

async function fetchSplitStats(id, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=statSplits&group=${group}&season=${SEASON}&sitCodes=vr,vl`, bust);
  const splits = (((data.stats || [])[0] || {}).splits || []);
  const vsR = splits.find((entry) => entry.split?.code === 'vr')?.stat || null;
  const vsL = splits.find((entry) => entry.split?.code === 'vl')?.stat || null;
  return { vsR, vsL };
}

async function fetchTodaySchedule(bust = false) {
  if (!bust && cache.schedule) return cache.schedule;
  const today = new Date().toISOString().slice(0, 10);
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`, bust);
  const games = (data.dates && data.dates[0] && data.dates[0].games) || [];
  const teamMap = new Map();
  games.forEach((game) => {
    const homeId = game.teams?.home?.team?.id;
    const awayId = game.teams?.away?.team?.id;
    if (homeId && awayId) {
      teamMap.set(homeId, { opponentId: awayId, opponentName: game.teams.away.team.name, gamePk: game.gamePk, status: game.status });
      teamMap.set(awayId, { opponentId: homeId, opponentName: game.teams.home.team.name, gamePk: game.gamePk, status: game.status });
    }
  });
  cache.schedule = { games, teamMap };
  return cache.schedule;
}

async function fetchTeamSeasonStats(teamId, group, bust = false) {
  const data = await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=${group}&season=${SEASON}`, bust);
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

async function fetchGameFeed(gamePk, bust = false) {
  if (!gamePk) return null;
  return fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, bust);
}

function parseIpToOuts(ipString) {
  if (!ipString || typeof ipString !== 'string') return 0;
  const [whole = '0', partial = '0'] = ipString.split('.');
  return Number(whole) * 3 + Number(partial);
}

function summarizeRecentHitter(logs) {
  const sample = logs.slice(0, 7);
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
    summary: `${totals.h}-${totals.ab}, ${totals.bb} BB, ${totals.k} K in last ${sample.length} games`,
  };
}

function summarizeRecentPitcher(logs) {
  const sample = logs.slice(0, 5);
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
    summary: `${formatShort(innings, 1)} IP, ${totals.k} K, ${totals.bb} BB in last ${sample.length} starts`,
  };
}

function buildConfidence(playerType, context) {
  if (playerType === 'Pitcher') {
    const recent = weightedScore([
      { weight: 0.4, score: scale(context.recent.kBb, 1.5, 7.5) },
      { weight: 0.35, score: scale(context.whiffPct, 18, 40) },
      { weight: 0.25, score: scale(context.recent.pitchesPerOut, 3.2, 6.5, true) },
    ]);
    const advanced = weightedScore([
      { weight: 0.45, score: scale(context.season.kBb, 1.5, 7.5) },
      { weight: 0.30, score: scale(context.whiffPct, 18, 40) },
      { weight: 0.25, score: scale(Number(context.savant.xERA || context.season.era), 2.3, 5.5, true) },
    ]);
    const matchup = weightedScore([
      { weight: 0.5, score: scale(context.opponent.kRate, 17, 29) },
      { weight: 0.5, score: scale(Number(context.opponent.ops), 0.620, 0.820, true) },
    ]);
    const consistency = weightedScore([
      { weight: 0.6, score: scale(context.recent.eraStdDev, 0.1, 2.2, true) },
      { weight: 0.4, score: scale(context.recent.whipStdDev, 0.05, 0.9, true) },
    ]);
    const variance = weightedScore([
      { weight: 0.5, score: scale(context.recent.sampleInnings, 8, 35) },
      { weight: 0.5, score: scale(context.recent.eraStdDev, 0.1, 2.2, true) },
    ]);
    const score = weightedScore([
      { weight: 0.30, score: recent },
      { weight: 0.25, score: advanced },
      { weight: 0.20, score: matchup },
      { weight: 0.15, score: consistency },
      { weight: 0.10, score: variance },
    ]);
    const rounded = Math.round(clamp(score ?? 50));
    return {
      confidence_score: rounded,
      trend: rounded >= 67 ? 'HOT' : rounded <= 45 ? 'COLD' : 'NEUTRAL',
      insight: `Confidence leans on ${formatShort(context.season.kBb, 2)} K/BB, ${formatRate(context.whiffPct)} whiff, and ${context.opponent.name ? `${context.opponent.name} matchup context` : 'repeatable run-prevention signals'}.`,
    };
  }

  const recent = weightedScore([
    { weight: 0.45, score: scale(context.recent.obp, 0.270, 0.450) },
    { weight: 0.30, score: scale(context.recent.ops, 0.600, 1.150) },
    { weight: 0.25, score: scale(context.recent.kRate, 10, 34, true) },
  ]);
  const advanced = weightedScore([
    { weight: 0.40, score: scale(Number(context.savant.xwOBA), 0.280, 0.430) },
    { weight: 0.35, score: scale(Math.abs(Number(context.savant.wOBA) - Number(context.savant.xwOBA)), 0.00, 0.08, true) },
    { weight: 0.25, score: scale(Number(context.season.obp), 0.280, 0.430) },
  ]);
  const matchup = weightedScore([
    { weight: 0.55, score: scale(Number(context.opponent.obpAllowed), 0.280, 0.360) },
    { weight: 0.45, score: scale(context.opponent.kRateAllowed, 30, 17, true) },
  ]);
  const consistency = weightedScore([
    { weight: 0.60, score: scale(context.recent.obpStdDev, 0.01, 0.16, true) },
    { weight: 0.40, score: scale(context.recent.opsStdDev, 0.05, 0.55, true) },
  ]);
  const variance = weightedScore([
    { weight: 0.50, score: scale(context.recent.samplePA, 18, 60) },
    { weight: 0.50, score: scale(context.recent.kRate, 10, 34, true) },
  ]);
  const score = weightedScore([
    { weight: 0.30, score: recent },
    { weight: 0.25, score: advanced },
    { weight: 0.20, score: matchup },
    { weight: 0.15, score: consistency },
    { weight: 0.10, score: variance },
  ]);
  const rounded = Math.round(clamp(score ?? 50));
  return {
    confidence_score: rounded,
    trend: rounded >= 67 ? 'HOT' : rounded <= 45 ? 'COLD' : 'NEUTRAL',
    insight: `Confidence is built on OBP repeatability, strikeout control, and expected production. ${context.savant.xwOBA ? `xwOBA (${context.savant.xwOBA}) is baked in.` : 'Expected production data is limited, so repeatable on-base skill carries more weight.'}`,
  };
}

function buildTrendPoints(logs, isPitcher) {
  return logs.slice(0, 10).reverse().map((log) => ({
    label: formatDate(log.date),
    value: Number(isPitcher ? (log.stat?.era || 0) : (log.stat?.ops || 0)),
  }));
}

function buildPitchTypePerformance(zonePitches, isPitcher) {
  if (!zonePitches.length) return [];
  const grouped = new Map();
  zonePitches.forEach((pitch) => {
    const key = pitch.pitchType || 'Pitch';
    if (!grouped.has(key)) {
      grouped.set(key, { count: 0, strikes: 0, whiffs: 0, velo: [] });
    }
    const bucket = grouped.get(key);
    bucket.count += 1;
    if (/strike|foul|swinging/i.test(pitch.result || '')) bucket.strikes += 1;
    if (/swinging/i.test(pitch.result || '')) bucket.whiffs += 1;
    if (Number.isFinite(pitch.velocity)) bucket.velo.push(Number(pitch.velocity));
  });
  return Array.from(grouped.entries())
    .map(([pitchType, bucket]) => ({
      pitchType,
      usage: bucket.count,
      strikeRate: bucket.count ? (bucket.strikes / bucket.count) * 100 : null,
      whiffRate: bucket.count ? (bucket.whiffs / bucket.count) * 100 : null,
      avgVelo: bucket.velo.length ? avg(bucket.velo) : null,
      note: isPitcher ? 'Latest tracked outing sample' : 'Latest tracked game sample',
    }))
    .sort((a, b) => b.usage - a.usage);
}

function extractLastPitchResult(feed, player, isPitcher) {
  if (!feed) return 'Unavailable';
  const plays = feed.liveData?.plays?.allPlays || [];
  const reversed = [...plays].reverse();
  for (const play of reversed) {
    const matches = isPitcher ? play.matchup?.pitcher?.id === player.id : play.matchup?.batter?.id === player.id;
    if (!matches) continue;
    const event = [...(play.playEvents || [])].reverse().find((entry) => entry.isPitch);
    if (event) {
      const description = event.details?.description || event.details?.call?.description || 'Unavailable';
      const type = event.details?.type?.description || event.details?.type?.code || 'Pitch';
      return `${type} · ${description}`;
    }
  }
  return 'Unavailable';
}

function extractZonePitches(feed, player, isPitcher) {
  if (!feed) return [];
  const allPlays = feed.liveData?.plays?.allPlays || [];
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
      });
    });
  });
  return filtered;
}

function buildLiveGame(person, matchupInfo, feed, isPitcher) {
  if (!matchupInfo) {
    return {
      isTrackable: false,
      isLive: false,
      status: 'No game scheduled today',
      opponent: 'Unavailable',
      currentLine: [],
      lastPitchResult: 'Unavailable',
      updatedAt: null,
    };
  }

  const status = feed?.gameData?.status?.detailedState || matchupInfo.status?.detailedState || 'Scheduled';
  const abstractState = feed?.gameData?.status?.abstractGameState || matchupInfo.status?.abstractGameState || '';
  const isTrackable = ['Preview', 'Live'].includes(abstractState);
  const boxHome = feed?.liveData?.boxscore?.teams?.home?.players || {};
  const boxAway = feed?.liveData?.boxscore?.teams?.away?.players || {};
  const playerEntry = boxHome[`ID${person.id}`] || boxAway[`ID${person.id}`] || null;
  const statBlock = isPitcher ? playerEntry?.stats?.pitching || {} : playerEntry?.stats?.batting || {};
  const currentLine = isPitcher
    ? [
      ['IP', unavailable(statBlock.inningsPitched)],
      ['ER', unavailable(statBlock.earnedRuns)],
      ['K', unavailable(statBlock.strikeOuts)],
      ['BB', unavailable(statBlock.baseOnBalls)],
    ]
    : [
      ['AB', unavailable(statBlock.atBats)],
      ['H', unavailable(statBlock.hits)],
      ['R', unavailable(statBlock.runs)],
      ['RBI', unavailable(statBlock.rbi)],
    ];

  return {
    isTrackable,
    isLive: abstractState === 'Live',
    status,
    opponent: matchupInfo.opponentName || 'Unavailable',
    currentLine,
    lastPitchResult: extractLastPitchResult(feed, person, isPitcher),
    updatedAt: new Date().toISOString(),
  };
}

async function buildPlayerProfile(playerId, bust = false) {
  const cacheKey = `${playerId}:${bust ? 'bust' : 'base'}`;
  if (!bust && cache.playerProfiles.has(cacheKey)) return cache.playerProfiles.get(cacheKey);

  const promise = (async () => {
    const person = await fetchPerson(playerId, bust);
    if (!person) throw new Error('Player not found');
    const isPitcher = person.primaryPosition?.type === 'Pitcher';
    const group = isPitcher ? 'pitching' : 'hitting';

    const [{ season, advanced }, logs, splits, savant, today] = await Promise.all([
      fetchSeasonStats(playerId, group, bust),
      fetchGameLogs(playerId, group, bust),
      fetchSplitStats(playerId, group, bust),
      fetchSavantSummary(person),
      fetchTodaySchedule(bust),
    ]);

    const teamId = person.currentTeam?.id;
    const matchupInfo = teamId ? today.teamMap.get(teamId) : null;
    const [opponent, feed] = await Promise.all([
      matchupInfo ? fetchTeamSeasonStats(matchupInfo.opponentId, isPitcher ? 'hitting' : 'pitching', bust) : Promise.resolve({}),
      matchupInfo?.gamePk ? fetchGameFeed(matchupInfo.gamePk, bust) : Promise.resolve(null),
    ]);

    const zonePitches = extractZonePitches(feed, person, isPitcher);
    const recent = isPitcher ? summarizeRecentPitcher(logs) : summarizeRecentHitter(logs);
    const context = isPitcher ? {
      season: {
        era: Number(season.era || 0),
        kBb: Number(season.strikeoutWalkRatio || advanced.strikesoutsToWalks || 0),
      },
      recent,
      whiffPct: Number(advanced.whiffPercentage || 0) * 100,
      savant,
      opponent: {
        name: matchupInfo?.opponentName || '',
        kRate: Number(opponent.strikeOuts || 0) && Number(opponent.plateAppearances || 0) ? (Number(opponent.strikeOuts) / Number(opponent.plateAppearances)) * 100 : null,
        ops: Number(opponent.ops || 0),
      },
    } : {
      season: { obp: Number(season.obp || 0) },
      recent,
      savant,
      opponent: {
        name: matchupInfo?.opponentName || '',
        obpAllowed: Number(opponent.obp || 0),
        kRateAllowed: Number(opponent.strikeoutsPer9Inn || 0),
      },
    };

    const confidence = buildConfidence(person.primaryPosition?.type, context);
    return {
      id: playerId,
      person,
      isPitcher,
      season,
      advanced,
      logs,
      splits,
      savant,
      matchupInfo,
      opponent,
      zonePitches,
      trendPoints: buildTrendPoints(logs, isPitcher),
      pitchTypePerformance: buildPitchTypePerformance(zonePitches, isPitcher),
      recent,
      liveGame: buildLiveGame(person, matchupInfo, feed, isPitcher),
      confidence,
      updatedAt: new Date().toISOString(),
    };
  })();

  if (!bust) cache.playerProfiles.set(cacheKey, promise);
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
        <div class="search-meta">${person.currentTeam?.name || 'MLB'} · ${person.primaryPosition?.abbreviation || ''}</div>
      </div>
      <button class="small-btn" data-open-player="${person.id}">Open</button>
    </div>
  `).join('');
}

function renderStatCard(label, value) {
  return `
    <div class="stat-card">
      <div class="mini-label">${label}</div>
      <div class="stat-value">${unavailable(value)}</div>
    </div>
  `;
}

function renderTrendGraph(points, inverse = false) {
  if (!points.length) return '<div class="empty-state">Trend data unavailable.</div>';
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
      <line class="chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
      <line class="chart-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
      <polygon class="chart-fill" points="${area}"></polygon>
      <polyline class="chart-line" points="${line}"></polyline>
      ${coords.map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"></circle>`).join('')}
      ${coords.map((point) => `<text class="chart-label" x="${point.x}" y="${height - 10}" text-anchor="middle">${point.label}</text>`).join('')}
    </svg>
  `;
}

function renderZoneChart(pitches) {
  if (!pitches.length || !pitches.some((pitch) => pitch.x !== null && pitch.z !== null)) {
    return '<div class="empty-state">Pitch location data unavailable.</div>';
  }
  const points = pitches.filter((pitch) => pitch.x !== null && pitch.z !== null).map((pitch) => {
    const cx = 180 + (pitch.x * 60);
    const cy = 320 - ((pitch.z - 1.0) * 72);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="rgba(83,166,255,0.72)" stroke="rgba(255,255,255,0.7)" stroke-width="1"></circle>`;
  }).join('');
  return `
    <svg class="zone-chart" viewBox="0 0 360 380">
      <rect x="97" y="104" width="166" height="162" rx="16" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" stroke-width="2"></rect>
      <line x1="152" y1="104" x2="152" y2="266" stroke="rgba(255,255,255,.14)"></line>
      <line x1="207" y1="104" x2="207" y2="266" stroke="rgba(255,255,255,.14)"></line>
      <line x1="97" y1="158" x2="263" y2="158" stroke="rgba(255,255,255,.14)"></line>
      <line x1="97" y1="212" x2="263" y2="212" stroke="rgba(255,255,255,.14)"></line>
      ${points}
    </svg>
  `;
}

function PlayerHeader(data) {
  const trendTone = trendClass[data.confidence.trend] || '';
  return `
    <section class="profile-header">
      <img class="profile-headshot" src="${headshotUrl(data.id)}" alt="${data.person.fullName}">
      <div>
        <div class="profile-name">${data.person.fullName}</div>
        <div class="profile-meta">
          <span>${data.person.currentTeam?.name || 'MLB'}</span>
          <span>•</span>
          <span>${data.person.primaryPosition?.abbreviation || 'N/A'}</span>
          <span>•</span>
          <span>${data.isPitcher ? (data.person.pitchHand?.description || 'Unavailable') : (data.person.batSide?.description || 'Unavailable')}</span>
          <span>•</span>
          <span>Age ${data.person.currentAge || 'Unavailable'}</span>
        </div>
        <div class="profile-actions">
          <a class="action-btn primary" href="./dashboard.html?player=${data.id}">Open Dashboard</a>
          <a class="action-btn secondary" href="./players.html">Player Directory</a>
        </div>
      </div>
      <div class="score-panel">
        <div class="score-pill ${trendTone}">${data.confidence.confidence_score}</div>
        <div class="profile-meta ${trendTone}" style="justify-content:flex-end;margin-top:8px;">${data.confidence.trend}</div>
        <div class="score-copy">${data.confidence.insight}</div>
      </div>
    </section>
  `;
}

function CoreStatsPanel(data) {
  const cards = data.isPitcher ? [
    ['ERA', formatNumber(data.season.era, 2)],
    ['WHIP', formatNumber(data.season.whip, 2)],
    ['SO', unavailable(data.season.strikeOuts)],
    ['IP', unavailable(data.season.inningsPitched)],
    ['K/9', formatNumber(data.season.strikeoutsPer9Inn || data.advanced.strikeoutsPer9, 1)],
    ['BB/9', formatNumber(data.season.walksPer9Inn || data.advanced.baseOnBallsPer9, 1)],
    ['HR', unavailable(data.season.homeRuns)],
    ['Hits', unavailable(data.season.hits)],
  ] : [
    ['AVG', unavailable(data.season.avg)],
    ['OBP', unavailable(data.season.obp)],
    ['SLG', unavailable(data.season.slg)],
    ['OPS', unavailable(data.season.ops)],
    ['HR', unavailable(data.season.homeRuns)],
    ['RBI', unavailable(data.season.rbi)],
    ['Hits', unavailable(data.season.hits)],
    ['Runs', unavailable(data.season.runs)],
  ];
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Core Stats</div>
          <div class="section-title">Season Snapshot</div>
        </div>
        <div class="section-copy">Live ${SEASON} MLB totals from the global player data system.</div>
      </div>
      <div class="core-grid">${cards.map(([label, value]) => renderStatCard(label, value)).join('')}</div>
    </section>
  `;
}

function AdvancedMetrics(data) {
  const cards = data.isPitcher ? [
    ['WAR', unavailable(data.savant.WAR || data.advanced.winsAboveReplacement)],
    ['xERA', unavailable(data.savant.xERA)],
    ['Whiff %', formatRate(Number(data.advanced.whiffPercentage || 0) * 100)],
    ['K/BB', formatNumber(data.season.strikeoutWalkRatio || data.advanced.strikesoutsToWalks, 2)],
    ['FIP', unavailable(data.advanced.fip || data.savant.FIP)],
    ['Hard Hit %', unavailable(data.savant['Hard Hit%'])],
    ['Barrel %', unavailable(data.savant['Barrel%'])],
    ['xBAA', unavailable(data.savant.xBA)],
  ] : [
    ['WAR', unavailable(data.savant.WAR || data.advanced.winsAboveReplacement)],
    ['wRC+', unavailable(data.savant['wRC+'])],
    ['xwOBA', unavailable(data.savant.xwOBA)],
    ['wOBA', unavailable(data.savant.wOBA)],
    ['Barrel %', unavailable(data.savant['Barrel%'])],
    ['Hard Hit %', unavailable(data.savant['Hard Hit%'])],
    ['xBA', unavailable(data.savant.xBA)],
    ['xSLG', unavailable(data.savant.xSLG)],
  ];
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Advanced Metrics</div>
          <div class="section-title">Expected Performance</div>
        </div>
        <div class="section-copy">Statcast and advanced season indicators. Missing values stay marked as Unavailable.</div>
      </div>
      <div class="advanced-grid">${cards.map(([label, value]) => renderStatCard(label, value)).join('')}</div>
    </section>
  `;
}

function LiveGamePanel(data) {
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Live Game Panel</div>
          <div class="section-title">${data.liveGame.isLive ? 'Game In Progress' : 'Today\'s Game Context'}</div>
        </div>
        <div class="section-copy">Updates automatically every ${POLL_MS / 1000} seconds for live or pregame players.</div>
      </div>
      <div class="metric-list">
        <div class="metric-item">
          <span class="metric-label">Status</span>
          <span class="metric-value">${unavailable(data.liveGame.status)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Opponent</span>
          <span class="metric-value">${unavailable(data.liveGame.opponent)}</span>
        </div>
      </div>
      <div class="live-line">
        ${data.liveGame.currentLine.map(([label, value]) => `
          <div class="live-card">
            <div class="mini-label">${label}</div>
            <div class="stat-value">${unavailable(value)}</div>
          </div>
        `).join('')}
      </div>
      <div class="table-wrap" style="margin-top:16px;">
        <div class="table-copy"><strong>Last pitch result:</strong> ${unavailable(data.liveGame.lastPitchResult)}</div>
      </div>
    </section>
  `;
}

function TrendSection(data) {
  const headers = data.isPitcher ? ['Date', 'Opp', 'IP', 'ER', 'K', 'BB'] : ['Date', 'Opp', 'AB', 'H', 'OBP', 'OPS'];
  const rows = data.logs.slice(0, 10).map((log) => {
    const stat = log.stat || {};
    return data.isPitcher
      ? `<tr><td>${formatDate(log.date)}</td><td>${log.opponent?.name || ''}</td><td>${unavailable(stat.inningsPitched)}</td><td>${unavailable(stat.earnedRuns)}</td><td>${unavailable(stat.strikeOuts)}</td><td>${unavailable(stat.baseOnBalls)}</td></tr>`
      : `<tr><td>${formatDate(log.date)}</td><td>${log.opponent?.name || ''}</td><td>${unavailable(stat.atBats)}</td><td>${unavailable(stat.hits)}</td><td>${unavailable(stat.obp)}</td><td>${unavailable(stat.ops)}</td></tr>`;
  }).join('');
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Trend + Form</div>
          <div class="section-title">Recent Form</div>
        </div>
        <div class="section-copy">${data.recent.summary || 'Unavailable'}</div>
      </div>
      <div class="two-col">
        <div class="chart-wrap">
          <div class="table-label">${data.isPitcher ? 'Rolling ERA' : 'Rolling OPS'}</div>
          ${renderTrendGraph(data.trendPoints, data.isPitcher)}
        </div>
        <div class="table-wrap">
          <table class="log-table">
            <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
            <tbody>${rows || '<tr><td colspan="6">Unavailable</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function MatchupInsights(data) {
  const splits = [
    ['vs RHP', data.splits.vsR],
    ['vs LHP', data.splits.vsL],
  ];
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Matchup Insights</div>
          <div class="section-title">Splits, Pitch Mix, Opponent</div>
        </div>
        <div class="section-copy">${data.matchupInfo?.opponentName ? `Today vs ${data.matchupInfo.opponentName}` : 'Opponent matchup data unavailable.'}</div>
      </div>
      <div class="two-col">
        <div>
          <div class="split-grid">
            ${splits.map(([label, stat]) => `
              <div class="stat-card">
                <div class="mini-label">${label}</div>
                <div class="stat-value">${stat ? unavailable(data.isPitcher ? stat.era : stat.ops) : 'Unavailable'}</div>
                <div class="section-copy" style="margin-top:10px;">${stat ? `${data.isPitcher ? 'WHIP' : 'AVG'} ${unavailable(data.isPitcher ? stat.whip : stat.avg)} · ${data.isPitcher ? 'K' : 'OBP'} ${unavailable(data.isPitcher ? stat.strikeOuts : stat.obp)}` : 'No split sample available.'}</div>
              </div>
            `).join('')}
          </div>
          <div class="metric-list" style="margin-top:16px;">
            <div class="metric-item"><span class="metric-label">Opponent Team</span><span class="metric-value">${data.matchupInfo?.opponentName || 'Unavailable'}</span></div>
            <div class="metric-item"><span class="metric-label">${data.isPitcher ? 'Opp OPS' : 'Opp OBP Allowed'}</span><span class="metric-value">${data.isPitcher ? unavailable(data.opponent.ops) : unavailable(data.opponent.obp)}</span></div>
            <div class="metric-item"><span class="metric-label">${data.isPitcher ? 'Opp K %' : 'Opp K/9'}</span><span class="metric-value">${data.isPitcher ? formatRate(Number(data.opponent.strikeOuts || 0) && Number(data.opponent.plateAppearances || 0) ? (Number(data.opponent.strikeOuts) / Number(data.opponent.plateAppearances)) * 100 : null) : unavailable(data.opponent.strikeoutsPer9Inn)}</span></div>
            <div class="metric-item"><span class="metric-label">Confidence</span><span class="metric-value">${data.confidence.confidence_score}</span></div>
          </div>
        </div>
        <div>
          <div class="zone-wrap">${renderZoneChart(data.zonePitches)}</div>
          <div class="pitch-grid" style="margin-top:16px;">
            ${(data.pitchTypePerformance.length ? data.pitchTypePerformance.slice(0, 4) : [{ pitchType: 'Unavailable', usage: 'Unavailable', strikeRate: null, whiffRate: null, avgVelo: null }]).map((item) => `
              <div class="stat-card">
                <div class="mini-label">${item.pitchType}</div>
                <div class="stat-value">${item.usage === 'Unavailable' ? 'Unavailable' : item.usage}</div>
                <div class="section-copy" style="margin-top:10px;">Strike ${item.strikeRate === null ? 'Unavailable' : formatRate(item.strikeRate)} · Whiff ${item.whiffRate === null ? 'Unavailable' : formatRate(item.whiffRate)} · Velo ${item.avgVelo === null ? 'Unavailable' : formatShort(item.avgVelo, 1)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

function ConfidencePanel(data) {
  return `
    <section class="profile-surface">
      <div class="section-head">
        <div>
          <div class="section-label">Confidence + Analytics</div>
          <div class="section-title">Optimization Engine</div>
        </div>
        <div class="section-copy">Low-variance projection built from recent form, advanced metrics, matchup context, consistency, and variance risk.</div>
      </div>
      <div class="metric-list">
        <div class="metric-item"><span class="metric-label">Confidence Score</span><span class="metric-value">${data.confidence.confidence_score}</span></div>
        <div class="metric-item"><span class="metric-label">Trend</span><span class="metric-value">${data.confidence.trend}</span></div>
      </div>
      <div class="table-wrap" style="margin-top:16px;">
        <div class="table-copy">${data.confidence.insight}</div>
      </div>
    </section>
  `;
}

function renderProfile(data) {
  document.title = `${data.person.fullName} — MoneyBallr Dynamic Profile`;
  els.root.className = 'profile-root';
  els.root.innerHTML = `
    ${PlayerHeader(data)}
    <div class="profile-grid">
      ${CoreStatsPanel(data)}
      ${AdvancedMetrics(data)}
      ${LiveGamePanel(data)}
      ${TrendSection(data)}
      ${MatchupInsights(data)}
      ${ConfidencePanel(data)}
    </div>
  `;
}

function startPolling(profile) {
  if (state.timer) clearInterval(state.timer);
  if (!profile.liveGame.isTrackable) return;
  state.timer = setInterval(async () => {
    try {
      const fresh = await buildPlayerProfile(state.playerId, true);
      renderProfile(fresh);
    } catch (error) {
      console.error(error);
    }
  }, POLL_MS);
}

async function loadPlayerProfile(playerId, bust = false) {
  state.playerId = Number(playerId);
  updateProfileUrl(state.playerId);
  els.root.className = 'profile-root loading-state';
  els.root.textContent = 'Loading live player profile…';
  try {
    const profile = await buildPlayerProfile(state.playerId, bust);
    renderProfile(profile);
    startPolling(profile);
  } catch (error) {
    console.error(error);
    els.root.className = 'profile-root';
    els.root.innerHTML = '<div class="empty-state">Unable to load that player profile right now.</div>';
  }
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

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!target.closest('.profile-search-box') && !target.closest('#player-profile-search-results')) {
    els.searchResults.hidden = true;
  }
  if (target.closest('[data-open-player]')) {
    const id = Number(target.closest('[data-open-player]').dataset.openPlayer);
    els.searchResults.hidden = true;
    loadPlayerProfile(id, true);
  }
});

const initialPlayer = Number(new URLSearchParams(window.location.search).get('player')) || 592450;
loadPlayerProfile(initialPlayer);
