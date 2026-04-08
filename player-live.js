(function () {
  const CURRENT_SEASON = new Date().getFullYear();

  const PLAYER_CONFIG = {
    griffin: {
      key: 'griffin',
      id: 804606,
      slug: './konnor-griffin.html',
      statusLabel: 'MLB Debut Today',
      statusClass: 'debut',
      metaDetail: 'Top Prospect',
      teamAbbr: 'PIT',
      badgeColor: '#00e676',
      pageSummary: 'Pre-debut premium shell with a clean empty-state strike zone, zeroed MLB stat modules, and a launch-ready profile for his first official major-league data.',
      homeSummaryLabel: '2026 MLB Debut Snapshot',
      homeVisible: true,
      tags: [
        { label: 'MLB Debut', className: 'tag-debut' },
        { label: 'Live', className: 'tag-hot' },
        { label: 'PIT', className: 'tag-org' },
      ],
    },
    stewart: {
      key: 'stewart',
      id: 701398,
      slug: './sal-stewart.html',
      statusLabel: 'Active MLB Roster',
      statusClass: 'mlb',
      metaDetail: 'Starting 3B',
      teamAbbr: 'CIN',
      badgeColor: '#ff6b35',
      pageSummary: 'Full player-lab page with overview, advanced batting, interactive strike-zone treatment, recent form, and splits built in the DataBallr style.',
      homeSummaryLabel: '2026 MLB Totals To Date',
      homeVisible: true,
      tags: [
        { label: 'Hot Start', className: 'tag-hot' },
        { label: 'MLB Starter', className: 'tag-trend' },
        { label: 'CIN', className: 'tag-org' },
      ],
    },
    judge: {
      key: 'judge',
      id: 592450,
      slug: './aaron-judge.html',
      statusLabel: 'MLB Superstar',
      statusClass: 'star',
      metaDetail: 'Right Field',
      teamAbbr: 'NYY',
      badgeColor: '#8bc4ff',
      pageSummary: 'Star-level player lab translated into the same design system, with verified current-season totals, a Judge-specific strike-zone view, recent form, and context cards.',
      homeSummaryLabel: '2026 MLB Totals To Date',
      homeVisible: false,
      tags: [
        { label: 'Star Profile', className: 'tag-star' },
        { label: 'Power', className: 'tag-top' },
        { label: 'NYY', className: 'tag-org' },
      ],
    },
  };

  const FEATURED_BY_ID = Object.values(PLAYER_CONFIG).reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});

  let teamsCachePromise = null;
  let rosterDirectoryPromise = null;

  const statAliases = {
    Games: 'gamesPlayed',
    AB: 'atBats',
    Hits: 'hits',
    Runs: 'runs',
    RBI: 'rbi',
    HR: 'homeRuns',
    Walks: 'baseOnBalls',
    BB: 'baseOnBalls',
    Strikeouts: 'strikeOuts',
    SO: 'strikeOuts',
    '2B': 'doubles',
    AVG: 'avg',
    OBP: 'obp',
    SLG: 'slg',
    OPS: 'ops',
    'BB%': 'bbRate',
    'K%': 'kRate',
    ISO: 'iso',
    BABIP: 'babip',
    'P/PA': 'pitchesPerPA',
  };

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatRate(count, total) {
    if (!total) return '0.0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  }

  function formatThreeDecimal(value) {
    if (!Number.isFinite(value)) return '.000';
    const fixed = value.toFixed(3);
    return fixed.startsWith('0') ? fixed.slice(1) : fixed;
  }

  function formatTwoDecimal(value) {
    if (!Number.isFinite(value)) return '0.00';
    return value.toFixed(2);
  }

  function formatInteger(value) {
    return String(Number.isFinite(value) ? value : 0);
  }

  function statValue(player, label) {
    const key = statAliases[label];
    if (!key) return null;
    return player.stats[key] ?? null;
  }

  function headshotUrl(id) {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/${id}/headshot/67/current`;
  }

  function fallbackInitials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  async function fetchPlayer(playerKey) {
    const config = PLAYER_CONFIG[playerKey];
    if (!config) throw new Error(`Unknown player key: ${playerKey}`);

    const url = new URL(`https://statsapi.mlb.com/api/v1/people/${config.id}`);
    url.searchParams.set('hydrate', `currentTeam,stats(group=[hitting],type=[season],season=${CURRENT_SEASON})`);

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Stats API request failed for ${config.id}`);

    const json = await response.json();
    const person = json.people && json.people[0];
    if (!person) throw new Error(`Missing player payload for ${config.id}`);

    const split = person.stats && person.stats[0] && person.stats[0].splits && person.stats[0].splits[0];
    const stat = (split && split.stat) || {};
    const plateAppearances = toNumber(stat.plateAppearances);
    const avg = parseFloat(stat.avg || 0);
    const slg = parseFloat(stat.slg || 0);

    return {
      ...config,
      name: person.fullName,
      age: person.currentAge,
      teamName: (person.currentTeam && person.currentTeam.name) || 'MLB',
      position: (person.primaryPosition && person.primaryPosition.abbreviation) || '',
      stats: {
        gamesPlayed: formatInteger(toNumber(stat.gamesPlayed)),
        atBats: formatInteger(toNumber(stat.atBats)),
        hits: formatInteger(toNumber(stat.hits)),
        runs: formatInteger(toNumber(stat.runs)),
        doubles: formatInteger(toNumber(stat.doubles)),
        homeRuns: formatInteger(toNumber(stat.homeRuns)),
        baseOnBalls: formatInteger(toNumber(stat.baseOnBalls)),
        strikeOuts: formatInteger(toNumber(stat.strikeOuts)),
        rbi: formatInteger(toNumber(stat.rbi)),
        avg: stat.avg || '.000',
        obp: stat.obp || '.000',
        slg: stat.slg || '.000',
        ops: stat.ops || '.000',
        babip: stat.babip || '.000',
        bbRate: formatRate(toNumber(stat.baseOnBalls), plateAppearances),
        kRate: formatRate(toNumber(stat.strikeOuts), plateAppearances),
        iso: formatThreeDecimal(Math.max(0, slg - avg)),
        pitchesPerPA: formatTwoDecimal(plateAppearances ? toNumber(stat.numberOfPitches) / plateAppearances : 0),
      },
      lineSummary: `${formatInteger(toNumber(stat.gamesPlayed))} G · ${formatInteger(toNumber(stat.atBats))} AB · ${formatInteger(toNumber(stat.hits))} H · ${formatInteger(toNumber(stat.doubles))} 2B · ${formatInteger(toNumber(stat.homeRuns))} HR · ${formatInteger(toNumber(stat.rbi))} RBI · ${formatInteger(toNumber(stat.baseOnBalls))} BB`,
      sourceLabel: `MLB Stats API · ${CURRENT_SEASON} season`,
    };
  }

  async function fetchTeams() {
    if (teamsCachePromise) return teamsCachePromise;
    teamsCachePromise = fetch(`https://statsapi.mlb.com/api/v1/teams?sportId=1`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to fetch MLB teams');
        return response.json();
      })
      .then((json) => (json.teams || []).filter((team) => !team.name.includes('All-Stars')));
    return teamsCachePromise;
  }

  async function fetchRosterDirectory() {
    if (rosterDirectoryPromise) return rosterDirectoryPromise;
    rosterDirectoryPromise = (async () => {
      const teams = await fetchTeams();
      const rosterResponses = await Promise.all(teams.map(async (team) => {
        const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${team.id}/roster?rosterType=active`, { cache: 'no-store' });
        if (!response.ok) return [];
        const json = await response.json();
        return (json.roster || []).map((entry) => ({
          id: entry.person?.id,
          name: entry.person?.fullName || 'Unknown Player',
          teamId: team.id,
          teamName: team.name,
          teamAbbr: team.abbreviation || team.teamCode?.toUpperCase() || '',
          position: entry.position?.abbreviation || '',
          positionType: entry.position?.type || '',
          jerseyNumber: entry.jerseyNumber || '--',
          status: entry.status?.description || 'Active',
        })).filter((entry) => entry.id);
      }));

      const directoryMap = new Map();
      rosterResponses.flat().forEach((entry) => {
        if (!directoryMap.has(entry.id)) {
          const featured = FEATURED_BY_ID[entry.id] || null;
          directoryMap.set(entry.id, {
            ...entry,
            featuredKey: featured?.key || null,
            featuredSlug: featured?.slug || null,
          });
        }
      });

      return Array.from(directoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    })();
    return rosterDirectoryPromise;
  }

  function renderTags(tags) {
    return tags.map((tag) => `<span class="tag ${tag.className}">${tag.label}</span>`).join('');
  }

  function renderDirectoryCard(player) {
    const initials = fallbackInitials(player.name);
    return `
      <a class="player-card-link" href="${player.slug}">
        <article class="player-card">
          <div class="player-meta-strip">
            <span class="meta-org">${player.teamName}</span>
            <span class="meta-sep">·</span>
            <span class="meta-status ${player.statusClass}">${player.statusLabel}</span>
            <span class="meta-sep">·</span>
            <span class="meta-org">${player.metaDetail}</span>
            <span class="meta-season">${CURRENT_SEASON} Season</span>
          </div>
          <div class="player-card-header">
            <div class="player-headshot-wrap">
              <img src="${headshotUrl(player.id)}" alt="${player.name}" class="headshot-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
              <div class="headshot-fallback" style="display:none;">${initials}</div>
              <div class="player-pos-badge" style="background:${player.badgeColor};color:${player.badgeColor === '#8bc4ff' ? '#07101f' : '#000'};">${player.position}</div>
            </div>
            <div class="player-info">
              <div class="player-name">${player.name}</div>
              <div class="player-team">${player.teamName} · MLB Active Roster</div>
              <div class="player-tags">${renderTags(player.tags)}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Age</div>
              <div style="font-family:var(--font-display);font-size:22px;color:var(--text);line-height:1;">${player.age}</div>
            </div>
          </div>
          <div class="player-card-stats">
            <div class="stat-cell"><div class="stat-key">AVG</div><div class="stat-val ${player.stats.avg >= '.300' ? 'good' : 'bad'}">${player.stats.avg}</div></div>
            <div class="stat-cell"><div class="stat-key">OBP</div><div class="stat-val ${player.stats.obp >= '.370' ? 'good' : 'ok'}">${player.stats.obp}</div></div>
            <div class="stat-cell"><div class="stat-key">SLG</div><div class="stat-val ${player.stats.slg >= '.500' ? 'good' : 'ok'}">${player.stats.slg}</div></div>
            <div class="stat-cell"><div class="stat-key">OPS</div><div class="stat-val ${player.stats.ops >= '.850' ? 'good' : 'ok'}">${player.stats.ops}</div></div>
            <div class="stat-cell"><div class="stat-key">HR</div><div class="stat-val ${toNumber(player.stats.homeRuns) > 0 ? 'good' : 'bad'}">${player.stats.homeRuns}</div></div>
          </div>
          <div class="player-card-footer">
            <div class="last10-label">Page Status</div>
            <p class="card-copy">${player.pageSummary}</p>
          </div>
        </article>
      </a>`;
  }

  function renderRosterCard(player) {
    const initials = fallbackInitials(player.name);
    const detailHref = `./player.html?player=${player.id}`;
    const secondaryAction = player.featuredSlug
      ? `<a class="roster-action secondary" href="${player.featuredSlug}">Featured Page</a>`
      : `<a class="roster-action secondary" href="./dashboard.html?player=${player.id}">Dashboard</a>`;
    return `
      <article class="roster-card">
        <div class="roster-card-head">
          <div class="player-headshot-wrap">
            <img src="${headshotUrl(player.id)}" alt="${player.name}" class="headshot-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="headshot-fallback" style="display:none;">${initials}</div>
            <div class="player-pos-badge">${player.position || 'MLB'}</div>
          </div>
          <div class="roster-player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-team">${player.teamName} · ${player.positionType || 'Active Roster'}</div>
            <div class="player-tags">
              <span class="tag tag-org">${player.teamAbbr || 'MLB'}</span>
              <span class="tag tag-trend">${player.status}</span>
              ${player.featuredSlug ? '<span class="tag tag-star">Featured Page</span>' : '<span class="tag tag-top">Dashboard Ready</span>'}
            </div>
          </div>
        </div>
        <div class="roster-meta-row">
          <div class="roster-meta-item"><span class="roster-meta-label">Jersey</span><strong>${player.jerseyNumber}</strong></div>
          <div class="roster-meta-item"><span class="roster-meta-label">Team</span><strong>${player.teamAbbr || '--'}</strong></div>
          <div class="roster-meta-item"><span class="roster-meta-label">Type</span><strong>${player.position || '--'}</strong></div>
        </div>
        <div class="roster-actions">
          <a class="roster-action primary" href="${detailHref}">Open Profile</a>
          ${secondaryAction}
        </div>
      </article>`;
  }

  async function renderPlayersPage(containerId, keys) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="live-state" style="grid-column:1/-1;">Loading live player stats…</div>';
    try {
      const players = await Promise.all(keys.map(fetchPlayer));
      container.innerHTML = players.map(renderDirectoryCard).join('');
    } catch (error) {
      container.innerHTML = '<div class="live-state" style="grid-column:1/-1;">Unable to load live player stats right now.</div>';
      console.error(error);
    }
  }

  function renderRosterDirectory(container, players, countEl, query) {
    if (countEl) {
      countEl.textContent = `${players.length} active players${query ? ` matching "${query}"` : ''}`;
    }
    if (!players.length) {
      container.innerHTML = '<div class="live-state" style="grid-column:1/-1;">No active MLB players matched that filter.</div>';
      return;
    }
    container.innerHTML = players.map(renderRosterCard).join('');
  }

  async function renderActiveRosterDirectory(containerId, inputId, countId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    const countEl = document.getElementById(countId);
    if (!container) return;

    container.innerHTML = '<div class="live-state" style="grid-column:1/-1;">Loading all active MLB rosters…</div>';
    try {
      const roster = await fetchRosterDirectory();
      const applyFilter = () => {
        const query = (input?.value || '').trim().toLowerCase();
        const filtered = query
          ? roster.filter((player) => {
            const haystack = [player.name, player.teamName, player.teamAbbr, player.position, player.positionType]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return haystack.includes(query);
          })
          : roster;
        renderRosterDirectory(container, filtered, countEl, input?.value.trim() || '');
      };

      applyFilter();
      if (input && !input.dataset.boundRosterSearch) {
        input.addEventListener('input', applyFilter);
        input.dataset.boundRosterSearch = 'true';
      }
    } catch (error) {
      container.innerHTML = '<div class="live-state" style="grid-column:1/-1;">Unable to load active MLB rosters right now.</div>';
      if (countEl) countEl.textContent = 'Live roster feed unavailable';
      console.error(error);
    }
  }

  function updateHomeCard(cardEl, player) {
    if (!cardEl) return;

    const metaOrg = cardEl.querySelector('.meta-org');
    if (metaOrg) metaOrg.textContent = player.teamName;

    const metaStatus = cardEl.querySelector('.meta-status');
    if (metaStatus) metaStatus.textContent = player.statusLabel;

    const posBadge = cardEl.querySelector('.player-pos-badge');
    if (posBadge) {
      posBadge.textContent = player.position;
      posBadge.style.background = player.badgeColor;
      posBadge.style.color = player.badgeColor === '#8bc4ff' ? '#07101f' : '#000';
    }

    const nameEl = cardEl.querySelector('.player-name');
    if (nameEl) nameEl.textContent = player.name;

    const teamEl = cardEl.querySelector('.player-team');
    if (teamEl) teamEl.textContent = `${player.teamName} · MLB Active Roster`;

    const ageValue = cardEl.querySelector('div[style*="font-size:22px;color:var(--text);line-height:1;"]');
    if (ageValue) ageValue.textContent = player.age;

    cardEl.querySelectorAll('.stat-cell').forEach((cell) => {
      const keyEl = cell.querySelector('.stat-key');
      const valEl = cell.querySelector('.stat-val');
      if (!keyEl || !valEl) return;
      const nextValue = statValue(player, keyEl.textContent.trim());
      if (nextValue !== null) valEl.textContent = nextValue;
    });

    const footer = cardEl.querySelector('.player-card-footer');
    if (footer) {
      footer.innerHTML = `
        <div class="last10-label">${player.homeSummaryLabel}</div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);gap:12px;flex-wrap:wrap;">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);">Line: <span style="color:var(--green);font-weight:500;">${player.lineSummary}</span></div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);">Source: <span style="color:var(--gold);">${player.sourceLabel}</span></div>
        </div>`;
    }
  }

  async function hydrateHomeCards(keys) {
    try {
      const players = await Promise.all(keys.map(fetchPlayer));
      players.forEach((player) => updateHomeCard(document.getElementById(`card-${player.key}`), player));
    } catch (error) {
      console.error(error);
    }
  }

  function hydrateStatCards(player) {
    document.querySelectorAll('.quick-card, .stat-card').forEach((card) => {
      const labelEl = card.querySelector('.quick-label, .stat-name');
      const valueEl = card.querySelector('.quick-value, .stat-value');
      if (!labelEl || !valueEl) return;
      const nextValue = statValue(player, labelEl.textContent.trim());
      if (nextValue !== null) valueEl.textContent = nextValue;
    });
  }

  async function hydratePlayerLabPage(playerKey) {
    try {
      const player = await fetchPlayer(playerKey);
      hydrateStatCards(player);

      const overviewSub = document.querySelector('.section .section-sub');
      if (overviewSub) overviewSub.textContent = `Live ${CURRENT_SEASON} MLB line from MLB Stats API`;

      const badges = document.querySelectorAll('.badge');
      if (badges[0]) badges[0].textContent = player.teamName;
      const heroName = document.querySelector('.hero-name');
      if (heroName) heroName.textContent = player.name;
      const title = document.querySelector('title');
      if (title) title.textContent = `${player.name} — DataBallr Player Lab`;
    } catch (error) {
      console.error(error);
    }
  }

  window.MoneyballrLive = {
    CURRENT_SEASON,
    PLAYER_CONFIG,
    fetchPlayer,
    fetchRosterDirectory,
    renderPlayersPage,
    renderActiveRosterDirectory,
    hydrateHomeCards,
    hydratePlayerLabPage,
  };
})();
