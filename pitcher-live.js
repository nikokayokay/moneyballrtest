(function () {
  const CURRENT_SEASON = new Date().getFullYear();
  const gameFeedCache = new Map();
  let leagueFipConstantPromise = null;

  const PITCHER_CONFIG = {
    yamamoto: {
      key: 'yamamoto',
      id: 808967,
      teamId: 119,
      name: 'Yoshinobu Yamamoto',
      teamName: 'Los Angeles Dodgers',
      teamAbbr: 'LAD',
      link: './#/player/808967',
      accent: '#1d4ed8',
      savantSlug: 'yoshinobu-yamamoto-808967',
      hand: 'RHP',
      descriptionSeed: 'Command-first power starter',
    },
  };

  const HIT_EVENTS = new Set(['single', 'double', 'triple', 'home_run']);
  const PITCH_COLORS = {
    '4-Seam Fastball': '#d22d49',
    'Sinker': '#fe9d00',
    'Cutter': '#933f2c',
    'Splitter': '#3bacac',
    'Split-Finger': '#3bacac',
    'Curveball': '#00d1ed',
    'Slider': '#c3bd0e',
    'Sweeper': '#8b5cf6',
    'Changeup': '#22c55e',
    'Knuckle Curve': '#38bdf8',
  };

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function parseRateString(value) {
    if (value === null || value === undefined || value === '' || value === '-.--' || value === '.---') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function parseIpToOuts(ipString) {
    if (!ipString || typeof ipString !== 'string') return 0;
    const [whole = '0', partial = '0'] = ipString.split('.');
    return safeNumber(whole) * 3 + safeNumber(partial);
  }

  function outsToIpString(outs) {
    const whole = Math.floor(outs / 3);
    const partial = outs % 3;
    return `${whole}.${partial}`;
  }

  function decimalIp(outs) {
    return outs / 3;
  }

  function formatPercent(value, digits = 1) {
    if (!Number.isFinite(value)) return '--';
    return `${value.toFixed(digits)}%`;
  }

  function formatMetric(value, digits = 2) {
    if (!Number.isFinite(value)) return '--';
    return value.toFixed(digits);
  }

  function formatInteger(value) {
    return String(Number.isFinite(value) ? Math.round(value) : 0);
  }

  function normalizePitchName(name) {
    if (!name) return 'Unknown';
    if (name === 'Split Finger') return 'Split-Finger';
    return name;
  }

  function pitchColor(name) {
    return PITCH_COLORS[normalizePitchName(name)] || '#94a3b8';
  }

  function pitchShortLabel(name) {
    const normalized = normalizePitchName(name);
    const map = {
      '4-Seam Fastball': '4S',
      'Sinker': 'SI',
      'Cutter': 'CT',
      'Split-Finger': 'SPL',
      'Curveball': 'CB',
      'Slider': 'SL',
      'Sweeper': 'SWP',
      'Changeup': 'CH',
      'Knuckle Curve': 'KC',
    };
    return map[normalized] || normalized.slice(0, 3).toUpperCase();
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return response.json();
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return response.text();
  }

  async function fetchLeagueFipConstant() {
    if (leagueFipConstantPromise) return leagueFipConstantPromise;

    leagueFipConstantPromise = (async () => {
      const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&playerPool=ALL&sportIds=1&season=${CURRENT_SEASON}`;
      const data = await fetchJson(url);
      const splits = data.stats && data.stats[0] && data.stats[0].splits ? data.stats[0].splits : [];

      const totals = splits.reduce((acc, split) => {
        const stat = split.stat || {};
        acc.outs += parseIpToOuts(stat.inningsPitched || '0.0');
        acc.earnedRuns += safeNumber(stat.earnedRuns);
        acc.homeRuns += safeNumber(stat.homeRuns);
        acc.walks += safeNumber(stat.baseOnBalls);
        acc.hitByPitch += safeNumber(stat.hitByPitch || stat.hitBatsmen);
        acc.strikeOuts += safeNumber(stat.strikeOuts);
        return acc;
      }, { outs: 0, earnedRuns: 0, homeRuns: 0, walks: 0, hitByPitch: 0, strikeOuts: 0 });

      const leagueIp = decimalIp(totals.outs);
      if (!leagueIp) return 3.1;
      const leagueEra = (totals.earnedRuns * 9) / leagueIp;
      return leagueEra - ((13 * totals.homeRuns + 3 * (totals.walks + totals.hitByPitch) - 2 * totals.strikeOuts) / leagueIp);
    })();

    return leagueFipConstantPromise;
  }

  async function fetchCurrentXera(config) {
    try {
      const html = await fetchText(`https://baseballsavant.mlb.com/savant-player/${config.savantSlug}`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const statcastTable = Array.from(doc.querySelectorAll('table')).find((table) => table.querySelector('#statcast_th-18'));
      if (!statcastTable) return null;
      const rows = Array.from(statcastTable.querySelectorAll('tbody tr'));
      const seasonRow = rows.find((row) => row.cells && row.cells[0] && row.cells[0].textContent.trim() === String(CURRENT_SEASON));
      if (!seasonRow) return null;
      const xEraCell = seasonRow.cells[seasonRow.cells.length - 1];
      const xEra = xEraCell ? xEraCell.textContent.trim() : '';
      return xEra || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function fetchPitcherCore(playerKey) {
    const config = PITCHER_CONFIG[playerKey];
    if (!config) throw new Error(`Unknown pitcher key: ${playerKey}`);

    const [seasonData, advancedData, gameLogData, fipConstant, xEra] = await Promise.all([
      fetchJson(`https://statsapi.mlb.com/api/v1/people/${config.id}?hydrate=currentTeam,stats(group=[pitching],type=[season],season=${CURRENT_SEASON})`),
      fetchJson(`https://statsapi.mlb.com/api/v1/people/${config.id}?hydrate=stats(group=[pitching],type=[seasonAdvanced],season=${CURRENT_SEASON})`),
      fetchJson(`https://statsapi.mlb.com/api/v1/people/${config.id}?hydrate=stats(group=[pitching],type=[gameLog],season=${CURRENT_SEASON})`),
      fetchLeagueFipConstant(),
      fetchCurrentXera(config),
    ]);

    const person = seasonData.people && seasonData.people[0] ? seasonData.people[0] : null;
    if (!person) throw new Error(`Missing pitcher data for ${playerKey}`);

    const seasonStat = (((seasonData.people || [])[0] || {}).stats || [])[0]?.splits?.[0]?.stat || {};
    const advancedStat = (((advancedData.people || [])[0] || {}).stats || [])[0]?.splits?.[0]?.stat || {};
    const gameLogSplits = ((((gameLogData.people || [])[0] || {}).stats || [])[0]?.splits || [])
      .filter((split) => safeNumber(split.stat?.gamesStarted) > 0)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const outs = parseIpToOuts(seasonStat.inningsPitched || '0.0');
    const ip = decimalIp(outs);
    const hr = safeNumber(seasonStat.homeRuns);
    const bb = safeNumber(seasonStat.baseOnBalls);
    const hbp = safeNumber(seasonStat.hitByPitch || seasonStat.hitBatsmen);
    const so = safeNumber(seasonStat.strikeOuts);
    const computedFip = ip ? ((13 * hr + 3 * (bb + hbp) - 2 * so) / ip) + fipConstant : null;

    return {
      config,
      person,
      seasonStat,
      advancedStat,
      gameLogs: gameLogSplits,
      metrics: {
        wins: safeNumber(seasonStat.wins),
        losses: safeNumber(seasonStat.losses),
        era: seasonStat.era || '--',
        whip: seasonStat.whip || '--',
        inningsPitched: seasonStat.inningsPitched || '0.0',
        strikeOuts: safeNumber(seasonStat.strikeOuts),
        walks: safeNumber(seasonStat.baseOnBalls),
        hitsAllowed: safeNumber(seasonStat.hits),
        homeRunsAllowed: safeNumber(seasonStat.homeRuns),
        kPer9: seasonStat.strikeoutsPer9Inn || advancedStat.strikeoutsPer9 || '--',
        bbPer9: seasonStat.walksPer9Inn || advancedStat.baseOnBallsPer9 || '--',
        hrPer9: seasonStat.homeRunsPer9 || advancedStat.homeRunsPer9 || '--',
        kToBb: seasonStat.strikeoutWalkRatio || advancedStat.strikesoutsToWalks || '--',
        oppAvg: seasonStat.avg || '--',
        fip: computedFip,
        xEra,
        totalPitches: safeNumber(seasonStat.numberOfPitches || seasonStat.pitchesThrown),
        strikePct: parseRateString(seasonStat.strikePercentage) !== null ? parseRateString(seasonStat.strikePercentage) * 100 : null,
        qualityStarts: safeNumber(advancedStat.qualityStarts),
        pitchesPerPA: parseRateString(advancedStat.pitchesPerPlateAppearance),
        babip: advancedStat.babip || '--',
        whiffPct: parseRateString(advancedStat.whiffPercentage) !== null ? parseRateString(advancedStat.whiffPercentage) * 100 : null,
      },
    };
  }

  async function fetchGameFeed(gamePk) {
    if (gameFeedCache.has(gamePk)) return gameFeedCache.get(gamePk);
    const promise = fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
    gameFeedCache.set(gamePk, promise);
    return promise;
  }

  function eventDescription(event) {
    return (event.details && (event.details.description || event.details.call?.description)) || '';
  }

  function eventCode(event) {
    return (event.details && event.details.code) || '';
  }

  function isSwing(event) {
    const description = eventDescription(event).toLowerCase();
    const code = eventCode(event);
    return description.includes('swing') || description.includes('foul') || description.includes('in play') || ['S', 'T', 'F', 'L', 'X', 'D', 'E'].includes(code);
  }

  function isWhiff(event) {
    return eventDescription(event).toLowerCase().includes('swinging strike');
  }

  function isCalledStrike(event) {
    return eventDescription(event).toLowerCase().includes('called strike');
  }

  function isStrike(event) {
    if (typeof event.details?.isStrike === 'boolean') return event.details.isStrike;
    const description = eventDescription(event).toLowerCase();
    const code = eventCode(event);
    return description.includes('strike') || description.includes('foul') || description.includes('in play') || ['C', 'S', 'T', 'F', 'L', 'X', 'D', 'E'].includes(code);
  }

  function plateCoordinates(event) {
    const coordinates = event.pitchData && event.pitchData.coordinates ? event.pitchData.coordinates : {};
    return {
      x: typeof coordinates.pX === 'number' ? coordinates.pX : null,
      z: typeof coordinates.pZ === 'number' ? coordinates.pZ : null,
      zone: event.pitchData?.zone ?? null,
    };
  }

  function buildPitchSummary(pitches) {
    const byType = new Map();

    pitches.forEach((pitch) => {
      const key = normalizePitchName(pitch.pitchType);
      if (!byType.has(key)) {
        byType.set(key, {
          type: key,
          total: 0,
          strikes: 0,
          swings: 0,
          whiffs: 0,
          calledStrikes: 0,
          velocityTotal: 0,
          velocityCount: 0,
          horizontalBreakTotal: 0,
          horizontalBreakCount: 0,
          verticalBreakTotal: 0,
          verticalBreakCount: 0,
          hitsAllowed: 0,
          homersAllowed: 0,
        });
      }

      const bucket = byType.get(key);
      bucket.total += 1;
      if (pitch.isStrike) bucket.strikes += 1;
      if (pitch.isSwing) bucket.swings += 1;
      if (pitch.isWhiff) bucket.whiffs += 1;
      if (pitch.isCalledStrike) bucket.calledStrikes += 1;
      if (Number.isFinite(pitch.velocity)) {
        bucket.velocityTotal += pitch.velocity;
        bucket.velocityCount += 1;
      }
      if (Number.isFinite(pitch.horizontalBreak)) {
        bucket.horizontalBreakTotal += pitch.horizontalBreak;
        bucket.horizontalBreakCount += 1;
      }
      if (Number.isFinite(pitch.verticalBreak)) {
        bucket.verticalBreakTotal += pitch.verticalBreak;
        bucket.verticalBreakCount += 1;
      }
      if (pitch.creditedHit) bucket.hitsAllowed += 1;
      if (pitch.creditedHomer) bucket.homersAllowed += 1;
    });

    const totalPitches = pitches.length;
    return Array.from(byType.values())
      .map((bucket) => ({
        ...bucket,
        usagePct: totalPitches ? (bucket.total / totalPitches) * 100 : 0,
        strikePct: bucket.total ? (bucket.strikes / bucket.total) * 100 : 0,
        whiffPct: bucket.swings ? (bucket.whiffs / bucket.swings) * 100 : 0,
        swingStrikePct: bucket.total ? (bucket.whiffs / bucket.total) * 100 : 0,
        avgVelo: bucket.velocityCount ? bucket.velocityTotal / bucket.velocityCount : null,
        avgHorizontalBreak: bucket.horizontalBreakCount ? bucket.horizontalBreakTotal / bucket.horizontalBreakCount : null,
        avgVerticalBreak: bucket.verticalBreakCount ? bucket.verticalBreakTotal / bucket.verticalBreakCount : null,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async function fetchPitcherPitchData(playerKey) {
    const core = await fetchPitcherCore(playerKey);
    const starts = core.gameLogs;
    const feeds = await Promise.all(starts.map((start) => fetchGameFeed(start.game.gamePk)));

    const outings = starts.map((start, index) => {
      const gameFeed = feeds[index];
      const allPlays = gameFeed.liveData?.plays?.allPlays || [];
      const pitches = [];

      allPlays.forEach((play) => {
        if (play.matchup?.pitcher?.id !== core.config.id) return;
        const pitchEvents = (play.playEvents || []).filter((event) => event.isPitch && event.pitchData);
        if (!pitchEvents.length) return;

        const lastPitch = pitchEvents[pitchEvents.length - 1];
        const lastPitchType = normalizePitchName(lastPitch.details?.type?.description || lastPitch.details?.type?.code || 'Unknown');
        const finalEventType = play.result?.eventType || '';
        const hitOnPlay = HIT_EVENTS.has(finalEventType);
        const homerOnPlay = finalEventType === 'home_run';

        pitchEvents.forEach((event, pitchIndex) => {
          const coords = plateCoordinates(event);
          const breaks = event.pitchData?.breaks || {};
          pitches.push({
            pitchType: normalizePitchName(event.details?.type?.description || event.details?.type?.code || 'Unknown'),
            result: eventDescription(event),
            isStrike: isStrike(event),
            isSwing: isSwing(event),
            isWhiff: isWhiff(event),
            isCalledStrike: isCalledStrike(event),
            velocity: safeNumber(event.pitchData?.startSpeed),
            horizontalBreak: Number.isFinite(breaks.breakHorizontal) ? breaks.breakHorizontal : null,
            verticalBreak: Number.isFinite(breaks.breakVerticalInduced) ? breaks.breakVerticalInduced : (Number.isFinite(breaks.breakVertical) ? breaks.breakVertical : null),
            plateX: coords.x,
            plateZ: coords.z,
            zone: coords.zone,
            count: `${event.count?.balls ?? play.count?.balls ?? 0}-${event.count?.strikes ?? play.count?.strikes ?? 0}`,
            inning: play.about?.inning,
            batter: play.matchup?.batter?.fullName || '',
            batterSide: play.matchup?.batSide?.description || '',
            date: start.date,
            gamePk: start.game.gamePk,
            opponent: start.opponent?.name || '',
            creditedHit: hitOnPlay && pitchIndex === pitchEvents.length - 1 && lastPitchType === normalizePitchName(event.details?.type?.description || event.details?.type?.code || 'Unknown'),
            creditedHomer: homerOnPlay && pitchIndex === pitchEvents.length - 1 && lastPitchType === normalizePitchName(event.details?.type?.description || event.details?.type?.code || 'Unknown'),
          });
        });
      });

      const whiffs = pitches.filter((pitch) => pitch.isWhiff).length;
      const calledStrikes = pitches.filter((pitch) => pitch.isCalledStrike).length;
      const totalPitches = pitches.length;

      return {
        gamePk: start.game.gamePk,
        date: start.date,
        opponent: start.opponent?.name || '',
        summary: start.stat?.summary || '',
        pitches,
        summaryByType: buildPitchSummary(pitches),
        swingStrikePct: totalPitches ? (whiffs / totalPitches) * 100 : 0,
        cswPct: totalPitches ? ((whiffs + calledStrikes) / totalPitches) * 100 : 0,
      };
    });

    const seasonPitches = outings.flatMap((outing) => outing.pitches);
    const seasonWhiffs = seasonPitches.filter((pitch) => pitch.isWhiff).length;
    const seasonCalledStrikes = seasonPitches.filter((pitch) => pitch.isCalledStrike).length;

    return {
      core,
      outings,
      seasonPitchStats: {
        totalPitches: seasonPitches.length,
        swingStrikePct: seasonPitches.length ? (seasonWhiffs / seasonPitches.length) * 100 : 0,
        cswPct: seasonPitches.length ? ((seasonWhiffs + seasonCalledStrikes) / seasonPitches.length) * 100 : 0,
        summaryByType: buildPitchSummary(seasonPitches),
      },
    };
  }

  function pitcherNarrative(data) {
    const seasonSummary = data.seasonPitchStats.summaryByType;
    const topUsage = seasonSummary[0];
    const topWhiff = seasonSummary.slice().sort((a, b) => b.whiffPct - a.whiffPct)[0];
    const command = data.core.metrics.bbPer9 !== '--' && safeNumber(data.core.metrics.bbPer9) <= 2.0 ? 'elite strike-throwing command' : 'solid strike-throwing ability';
    const mixDepth = seasonSummary.length >= 5 ? 'deep multi-pitch mix' : 'lean, repeatable mix';

    if (!topUsage || !topWhiff) {
      return `${data.core.person.fullName} profiles as a ${data.core.config.descriptionSeed.toLowerCase()} who attacks the zone and keeps hitters uncomfortable with shape and pace changes.`;
    }

    return `${data.core.person.fullName} is operating like a ${data.core.config.descriptionSeed.toLowerCase()} with ${command} and a ${mixDepth}. His most-used offering this season is the ${topUsage.type.toLowerCase()}, while the ${topWhiff.type.toLowerCase()} has been his best bat-misser at ${formatPercent(topWhiff.whiffPct)}. The combination of strike efficiency, pitch separation, and multiple finishing shapes is what makes the profile work.`;
  }

  function renderPitchMixCards(summaryByType) {
    return summaryByType.map((pitch) => {
      const width = Math.max(10, Math.min(100, pitch.usagePct));
      return `
        <div class="pitch-card">
          <div class="pitch-card-top">
            <div class="pitch-name-wrap">
              <span class="pitch-swatch" style="background:${pitchColor(pitch.type)}"></span>
              <span class="pitch-name">${pitch.type}</span>
            </div>
            <span class="pitch-usage">${formatPercent(pitch.usagePct)}</span>
          </div>
          <div class="pitch-usage-bar"><span style="width:${width}%;background:${pitchColor(pitch.type)}"></span></div>
          <div class="pitch-card-grid">
            <div><span class="mini-label">Velo</span><span class="mini-value">${pitch.avgVelo ? `${pitch.avgVelo.toFixed(1)} mph` : '--'}</span></div>
            <div><span class="mini-label">Whiff</span><span class="mini-value">${formatPercent(pitch.whiffPct)}</span></div>
            <div><span class="mini-label">Strike</span><span class="mini-value">${formatPercent(pitch.strikePct)}</span></div>
            <div><span class="mini-label">Hits</span><span class="mini-value">${formatInteger(pitch.hitsAllowed)}</span></div>
          </div>
        </div>`;
    }).join('');
  }

  function pitchPointMarkup(pitch) {
    const cx = 180 + ((pitch.plateX || 0) * 60);
    const cy = 340 - (((pitch.plateZ || 0) - 1.0) * 78);
    const label = `${pitch.type || pitch.pitchType} · ${pitch.velocity ? `${pitch.velocity.toFixed(1)} mph` : '--'} · ${pitch.result}`;
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="${pitchColor(pitch.pitchType)}" fill-opacity="0.82" stroke="rgba(255,255,255,0.7)" stroke-width="1" data-label="${label.replace(/"/g, '&quot;')}" data-count="${pitch.count}" data-batter="${(pitch.batter || '').replace(/"/g, '&quot;')}" data-date="${pitch.date}"></circle>`;
  }

  function renderZoneSvg(pitches) {
    const points = pitches.filter((pitch) => pitch.plateX !== null && pitch.plateZ !== null).map(pitchPointMarkup).join('');
    return `
      <svg viewBox="0 0 360 420" class="pitch-zone-svg" aria-label="Pitch location chart">
        <g opacity=".55">
          <line x1="0" y1="84" x2="360" y2="84" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="0" y1="168" x2="360" y2="168" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="0" y1="252" x2="360" y2="252" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="0" y1="336" x2="360" y2="336" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="72" y1="0" x2="72" y2="420" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="144" y1="0" x2="144" y2="420" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="216" y1="0" x2="216" y2="420" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
          <line x1="288" y1="0" x2="288" y2="420" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 8"/>
        </g>
        <rect x="97" y="113" width="166" height="162" rx="16" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
        <line x1="152" y1="113" x2="152" y2="275" stroke="rgba(255,255,255,.14)"/>
        <line x1="207" y1="113" x2="207" y2="275" stroke="rgba(255,255,255,.14)"/>
        <line x1="97" y1="167" x2="263" y2="167" stroke="rgba(255,255,255,.14)"/>
        <line x1="97" y1="221" x2="263" y2="221" stroke="rgba(255,255,255,.14)"/>
        ${points}
      </svg>`;
  }

  function renderRecentStarts(outings) {
    return outings.map((outing) => `
      <tr>
        <td>${new Date(`${outing.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
        <td>${outing.opponent}</td>
        <td>${outing.summary}</td>
        <td>${formatInteger(outing.pitches.length)}</td>
        <td>${formatPercent(outing.cswPct)}</td>
      </tr>`).join('');
  }

  function renderOverviewMetrics(data) {
    const metrics = data.core.metrics;
    const items = [
      ['W-L', `${metrics.wins}-${metrics.losses}`],
      ['ERA', metrics.era],
      ['WHIP', metrics.whip],
      ['IP', metrics.inningsPitched],
      ['SO', metrics.strikeOuts],
      ['BB', metrics.walks],
      ['H', metrics.hitsAllowed],
      ['HR', metrics.homeRunsAllowed],
      ['Total Pitches', metrics.totalPitches],
      ['Strike %', formatPercent(metrics.strikePct)],
      ['SwStr %', formatPercent(data.seasonPitchStats.swingStrikePct)],
      ['CSW %', formatPercent(data.seasonPitchStats.cswPct)],
    ];

    return items.map(([label, value]) => `
      <div class="stat-card">
        <div class="stat-name">${label}</div>
        <div class="stat-value">${value}</div>
      </div>`).join('');
  }

  function renderAdvancedMetrics(data) {
    const metrics = data.core.metrics;
    const items = [
      ['K/9', metrics.kPer9],
      ['BB/9', metrics.bbPer9],
      ['HR/9', metrics.hrPer9],
      ['K/BB', metrics.kToBb],
      ['Opp AVG', metrics.oppAvg],
      ['FIP', formatMetric(metrics.fip)],
      ['xERA', metrics.xEra || 'Unavailable'],
      ['Quality Starts', metrics.qualityStarts],
      ['Pitches/PA', metrics.pitchesPerPA ? metrics.pitchesPerPA.toFixed(2) : '--'],
      ['BABIP', metrics.babip],
      ['Whiff %', formatPercent(metrics.whiffPct)],
      ['Command Profile', safeNumber(metrics.bbPer9) <= 2 ? 'Plus' : 'Average'],
    ];

    return items.map(([label, value]) => `
      <div class="stat-card">
        <div class="stat-name">${label}</div>
        <div class="stat-value">${value}</div>
      </div>`).join('');
  }

  function updatePitchingPreview(previewEl, data) {
    if (!previewEl) return;
    const topPitch = data.seasonPitchStats.summaryByType[0];
    const topWhiff = data.seasonPitchStats.summaryByType.slice().sort((a, b) => b.whiffPct - a.whiffPct)[0];

    previewEl.innerHTML = `
      <a class="pitcher-preview-link" href="${data.core.config.link}">
        <div class="pitcher-preview-shell">
          <div class="pitcher-preview-main">
            <div>
              <div class="preview-eyebrow">Pitching Status · Live ${CURRENT_SEASON}</div>
              <div class="preview-name">${data.core.person.fullName}</div>
              <div class="preview-team">${data.core.person.currentTeam?.name || data.core.config.teamName} · ${data.core.config.hand}</div>
              <p class="preview-copy">${pitcherNarrative(data)}</p>
            </div>
            <div class="preview-quick-grid">
              <div class="quick-card"><div class="quick-label">W-L</div><div class="quick-value">${data.core.metrics.wins}-${data.core.metrics.losses}</div></div>
              <div class="quick-card"><div class="quick-label">ERA</div><div class="quick-value">${data.core.metrics.era}</div></div>
              <div class="quick-card"><div class="quick-label">WHIP</div><div class="quick-value">${data.core.metrics.whip}</div></div>
              <div class="quick-card"><div class="quick-label">SO</div><div class="quick-value">${data.core.metrics.strikeOuts}</div></div>
            </div>
          </div>
          <div class="preview-bottom">
            <div class="preview-bar"><span style="width:${Math.min(100, topPitch ? topPitch.usagePct : 0)}%;background:${topPitch ? pitchColor(topPitch.type) : '#1d4ed8'}"></span></div>
            <div class="preview-footer">
              <span>Primary pitch: <strong>${topPitch ? topPitch.type : '--'}</strong></span>
              <span>Best whiff pitch: <strong>${topWhiff ? `${topWhiff.type} (${formatPercent(topWhiff.whiffPct)})` : '--'}</strong></span>
            </div>
          </div>
        </div>
      </a>`;
  }

  function renderPitcherPage(pageEl, data) {
    if (!pageEl) return;
    const latestOuting = data.outings[0];
    const selectedSummary = latestOuting ? latestOuting.summaryByType : [];
    const selectedPitches = latestOuting ? latestOuting.pitches : [];

    pageEl.innerHTML = `
      <section class="pitcher-hero">
        <div class="hero-main">
          <div>
            <div class="badges">
              <span class="badge">${data.core.person.currentTeam?.name || data.core.config.teamName}</span>
              <span class="badge accent">Pitching Status</span>
              <span class="badge">Live ${CURRENT_SEASON}</span>
            </div>
            <div class="hero-name">${data.core.person.fullName}</div>
            <div class="hero-meta"><span>#${data.core.person.primaryNumber || ''}</span><span>•</span><span>${data.core.person.pitchHand?.description || data.core.config.hand}</span><span>•</span><span>Age ${data.core.person.currentAge}</span></div>
            <p class="hero-copy">${pitcherNarrative(data)}</p>
          </div>
          <div class="hero-quick-grid">
            <div class="quick-card"><div class="quick-label">W-L</div><div class="quick-value">${data.core.metrics.wins}-${data.core.metrics.losses}</div></div>
            <div class="quick-card"><div class="quick-label">ERA</div><div class="quick-value">${data.core.metrics.era}</div></div>
            <div class="quick-card"><div class="quick-label">WHIP</div><div class="quick-value">${data.core.metrics.whip}</div></div>
            <div class="quick-card"><div class="quick-label">FIP</div><div class="quick-value">${formatMetric(data.core.metrics.fip)}</div></div>
            <div class="quick-card"><div class="quick-label">Strike %</div><div class="quick-value">${formatPercent(data.core.metrics.strikePct)}</div></div>
            <div class="quick-card"><div class="quick-label">CSW %</div><div class="quick-value">${formatPercent(data.seasonPitchStats.cswPct)}</div></div>
          </div>
        </div>
      </section>

      <div class="content-grid">
        <div class="stack">
          <section class="section">
            <div class="section-head"><div><div class="section-title">Current Pitching</div><div class="section-sub">Live ${CURRENT_SEASON} MLB season stats</div></div></div>
            <div class="section-body stat-grid">${renderOverviewMetrics(data)}</div>
          </section>

          <section class="section">
            <div class="section-head"><div><div class="section-title">Advanced Profile</div><div class="section-sub">Official MLB data plus live-derived fielding independent metrics</div></div></div>
            <div class="section-body stat-grid">${renderAdvancedMetrics(data)}</div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <div class="section-title">Pitch Chart</div>
                <div class="section-sub">Location, pitch mix, and effectiveness by outing</div>
              </div>
              <div class="outings-control-wrap">
                <label for="outing-select" class="control-label">View</label>
                <select id="outing-select" class="outing-select">
                  <option value="season">Season to Date</option>
                  ${data.outings.map((outing) => `<option value="${outing.gamePk}">${new Date(`${outing.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })} vs ${outing.opponent}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="section-body chart-layout">
              <div class="zone-card">
                <div id="pitch-zone-wrap">${renderZoneSvg(selectedPitches)}</div>
                <div class="pitch-tooltip" id="pitch-tooltip">Hover a pitch for detail</div>
              </div>
              <div class="chart-side">
                <div class="legend-grid" id="pitch-legend">
                  ${selectedSummary.map((pitch) => `<div class="legend-item"><span class="legend-swatch" style="background:${pitchColor(pitch.type)}"></span><span>${pitch.type}</span></div>`).join('')}
                </div>
                <div id="pitch-mix-cards">${renderPitchMixCards(selectedSummary)}</div>
              </div>
            </div>
          </section>
        </div>

        <div class="stack">
          <section class="section">
            <div class="section-head"><div><div class="section-title">Pitcher Read</div><div class="section-sub">Data-driven scouting summary</div></div></div>
            <div class="section-body">
              <p class="analysis-copy">${pitcherNarrative(data)}</p>
            </div>
          </section>

          <section class="section">
            <div class="section-head"><div><div class="section-title">Recent Starts</div><div class="section-sub">Date-based outing view for chart filtering</div></div></div>
            <div class="section-body">
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Opp</th><th>Line</th><th>Pitches</th><th>CSW%</th></tr></thead>
                  <tbody>${renderRecentStarts(data.outings)}</tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>`;

    wirePitchChartInteractions(pageEl, data);
  }

  function wirePitchChartInteractions(pageEl, data) {
    const select = pageEl.querySelector('#outing-select');
    const zoneWrap = pageEl.querySelector('#pitch-zone-wrap');
    const mixCards = pageEl.querySelector('#pitch-mix-cards');
    const legend = pageEl.querySelector('#pitch-legend');
    const tooltip = pageEl.querySelector('#pitch-tooltip');

    function selectedView() {
      if (!select || select.value === 'season') {
        return {
          pitches: data.outings.flatMap((outing) => outing.pitches),
          summary: data.seasonPitchStats.summaryByType,
        };
      }
      const outing = data.outings.find((item) => String(item.gamePk) === select.value);
      return outing || { pitches: [], summaryByType: [] };
    }

    function repaint() {
      const view = selectedView();
      const summary = view.summary || view.summaryByType || [];
      zoneWrap.innerHTML = renderZoneSvg(view.pitches || []);
      mixCards.innerHTML = renderPitchMixCards(summary);
      legend.innerHTML = summary.map((pitch) => `<div class="legend-item"><span class="legend-swatch" style="background:${pitchColor(pitch.type)}"></span><span>${pitch.type}</span></div>`).join('');

      zoneWrap.querySelectorAll('circle').forEach((circle) => {
        circle.addEventListener('mouseenter', () => {
          tooltip.innerHTML = `<strong>${circle.dataset.label}</strong><span>${circle.dataset.batter || ''}</span><span>${circle.dataset.count || ''}</span>`;
        });
      });
    }

    if (select) {
      select.addEventListener('change', repaint);
    }
    repaint();
  }

  async function hydratePitchingPreview(containerId, playerKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="live-state">Loading live pitching status…</div>';
    try {
      const data = await fetchPitcherPitchData(playerKey);
      updatePitchingPreview(container, data);
    } catch (error) {
      container.innerHTML = '<div class="live-state">Unable to load live pitching status right now.</div>';
      console.error(error);
    }
  }

  async function hydratePitcherPage(containerId, playerKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="live-state">Loading live pitcher profile…</div>';
    try {
      const data = await fetchPitcherPitchData(playerKey);
      renderPitcherPage(container, data);
    } catch (error) {
      container.innerHTML = '<div class="live-state">Unable to load live pitcher profile right now.</div>';
      console.error(error);
    }
  }

  window.MoneyballrPitching = {
    CURRENT_SEASON,
    PITCHER_CONFIG,
    hydratePitchingPreview,
    hydratePitcherPage,
  };
})();
