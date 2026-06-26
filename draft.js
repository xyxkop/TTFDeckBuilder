/**
 * TTF Fantasy Draft
 * Draft 30 cards (pick 1 of 3 each round), then build a 20-card deck from the pool.
 * Depends on shared.js being loaded first.
 */
(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================

  let baseCards = [];
  let parallels = [];
  let draftedCards = [];
  let currentPick = 0;
  let buildDeck = [];
  let buildDeckNums = new Set();

  // ============================================================
  // DOM REFS
  // ============================================================

  const progressEl = document.getElementById('draft-progress');
  const instructionEl = document.getElementById('draft-instruction');
  const choicesEl = document.getElementById('draft-choices');
  const draftPhase = document.getElementById('draft-phase');
  const buildPhase = document.getElementById('build-phase');
  const poolCardsEl = document.getElementById('pool-cards');
  const buildDeckListEl = document.getElementById('build-deck-list');
  const buildCountEl = document.getElementById('build-count');
  const poolCountEl = document.getElementById('pool-count');
  const deckSelectedCountEl = document.getElementById('deck-selected-count');
  const finalizeDeckBtn = document.getElementById('finalize-deck-btn');

  // ============================================================
  // INIT
  // ============================================================

  finalizeDeckBtn.addEventListener('click', finalizeDeck);
  document.getElementById('new-draft-btn').addEventListener('click', () => {
    if (currentPick > 0 && !confirm('Start a new draft? Current progress will be lost.')) return;
    buildDeck = [];
    buildDeckNums.clear();
    buildPhase.classList.add('hidden');
    draftPhase.classList.remove('hidden');
    startDraft();
  });
  loadCards();

  // ============================================================
  // DATA LOADING
  // ============================================================

  async function loadCards() {
    instructionEl.textContent = 'Loading cards...';
    try {
      const response = await fetch(SHEET_CSV_URL + '&_t=' + Date.now());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = parseCardsFromCSV(await response.text());
      baseCards = result.baseCards;
      parallels = result.parallels;
      startDraft();
    } catch (err) {
      instructionEl.textContent = 'Failed to load card data: ' + err.message;
    }
  }

  // ============================================================
  // DRAFT LOGIC
  // ============================================================

  function startDraft() {
    currentPick = 0;
    draftedCards = [];
    showChoices();
  }

  function showChoices() {
    if (currentPick >= 30) { endDraft(); return; }

    progressEl.textContent = `Pick ${currentPick + 1} / 30`;
    choicesEl.innerHTML = '';

    let candidates;

    if (currentPick === 0) {
      instructionEl.textContent = 'Choose your Goalkeeper';
      const gks = baseCards.filter(c => c['Position'] === 'Goalkeeper' && c['Parallel'] === 'Base');
      candidates = pickRandom(gks, 3);
    } else if ((currentPick + 1) % 5 === 0) {
      instructionEl.textContent = `Pick ${currentPick + 1} \u2014 Parallel Round!`;
      candidates = pickRandom(parallels, 3);
    } else {
      instructionEl.textContent = `Pick ${currentPick + 1} \u2014 Choose a card`;
      const pool = baseCards.filter(c => c['Parallel'] === 'Base');
      candidates = pickRandom(pool, 3);
    }

    candidates.forEach(card => {
      const el = buildCardElement(card, true);
      el.addEventListener('click', () => pickCard(card));
      choicesEl.appendChild(el);
    });
  }

  function pickCard(card) {
    draftedCards.push(card);
    currentPick++;
    document.getElementById('drafted-count').textContent = `(${draftedCards.length}/30)`;
    renderDraftPanel();
    renderDraftStats();
    showChoices();
  }

  function pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ============================================================
  // DRAFT PANEL (right side)
  // ============================================================

  function renderDraftPanel() {
    const panelList = document.getElementById('draft-panel-list');
    panelList.innerHTML = '';

    const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

    positions.forEach(pos => {
      const cards = draftedCards
        .filter(c => c['Position'] === pos)
        .sort((a, b) => Number(a['Energy'] || 0) - Number(b['Energy'] || 0));
      if (cards.length === 0) return;

      const header = document.createElement('div');
      header.className = 'draft-panel-pos-header';
      header.textContent = `${POSITION_LABELS[pos]} (${cards.length})`;
      panelList.appendChild(header);

      cards.forEach(card => {
        const row = buildSharedDeckRow(card);
        panelList.appendChild(row);
      });
    });
  }

  // ============================================================
  // DRAFT STATS (bottom)
  // ============================================================

  function renderDraftStats() {
    const statsEl = document.getElementById('draft-stats-content');
    if (!statsEl) return;
    statsEl.innerHTML = '';

    statsEl.appendChild(buildBarChartWidget('Position', () => {
      const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      const posMap = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD' };
      draftedCards.forEach(c => { const p = posMap[c['Position']]; if (p) counts[p]++; });
      return counts;
    }, '#555'));

    statsEl.appendChild(buildBarChartWidget('Energy', () => {
      const counts = {}; for (let i = 0; i <= 5; i++) counts[i] = 0;
      draftedCards.forEach(c => { counts[Number(c['Energy'] || 0)]++; });
      return counts;
    }, '#b8860b'));

    statsEl.appendChild(buildBarChartWidget('Skill Types', () => {
      const counts = { Spd: 0, Acc: 0, Ctl: 0, Ldr: 0, Str: 0 };
      const map = { Speed: 'Spd', Accuracy: 'Acc', Control: 'Ctl', Leadership: 'Ldr', Strength: 'Str' };
      draftedCards.forEach(c => {
        if (c['Skill Type #1'] && map[c['Skill Type #1']]) counts[map[c['Skill Type #1']]]++;
        if (c['Skill Type #2'] && map[c['Skill Type #2']]) counts[map[c['Skill Type #2']]]++;
      });
      return counts;
    }, null, { Spd: '#e94560', Acc: '#40916c', Ctl: '#4a90d9', Ldr: '#9b59b6', Str: '#f0c040' }));
  }

  function buildBarChartWidget(title, dataFn, defaultColor, colorMap) {
    const container = document.createElement('div');
    container.className = 'draft-stat-chart';
    const h = document.createElement('h4');
    h.textContent = title;
    container.appendChild(h);

    const chart = document.createElement('div');
    chart.className = 'bar-chart';
    const data = dataFn();
    const entries = Object.entries(data);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);

    entries.forEach(([label, count]) => {
      const bar = document.createElement('div');
      bar.className = 'bar-item';
      const val = document.createElement('span');
      val.className = 'bar-value';
      val.textContent = count || '';
      bar.appendChild(val);
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.height = `${(count / maxVal) * 100}%`;
      fill.style.background = (colorMap && colorMap[label]) || defaultColor || '#4a90d9';
      bar.appendChild(fill);
      const lbl = document.createElement('span');
      lbl.className = 'bar-label';
      lbl.textContent = label;
      bar.appendChild(lbl);
      chart.appendChild(bar);
    });
    container.appendChild(chart);
    return container;
  }

  // ============================================================
  // BUILD PHASE
  // ============================================================

  function endDraft() {
    draftPhase.classList.add('hidden');
    buildPhase.classList.remove('hidden');
    progressEl.textContent = 'Draft Complete!';
    renderBuildPhase();
  }

  function renderBuildPhase() {
    renderPool();
    renderBuildDeckList();
    updateBuildCounts();
    renderBuildStats();
  }

  function renderPool() {
    poolCardsEl.innerHTML = '';
    draftedCards.forEach((card, i) => {
      if (buildDeckNums.has(i)) return;
      const el = buildCardElement(card, true);
      el.addEventListener('click', () => addToBuildDeck(i));
      poolCardsEl.appendChild(el);
    });
  }

  function addToBuildDeck(poolIndex) {
    if (buildDeck.length >= 20) return;
    if (buildDeckNums.has(poolIndex)) return;
    const card = draftedCards[poolIndex];
    const isGK = card['Position'] === 'Goalkeeper';
    const hasGK = buildDeck.some(c => c['Position'] === 'Goalkeeper');
    if (isGK && hasGK) return;
    if (!isGK && !hasGK && buildDeck.length >= 19) return;
    buildDeck.push(card);
    buildDeckNums.add(poolIndex);
    renderBuildPhase();
  }

  function removeFromBuildDeck(deckIndex) {
    const card = buildDeck[deckIndex];
    const poolIndex = [...buildDeckNums].find(i => draftedCards[i] === card);
    buildDeck.splice(deckIndex, 1);
    if (poolIndex != null) buildDeckNums.delete(poolIndex);
    hidePreview();
    renderBuildPhase();
  }

  function renderBuildDeckList() {
    buildDeckListEl.innerHTML = '';
    const gk = buildDeck.find(c => c['Position'] === 'Goalkeeper');
    const outfield = buildDeck.filter(c => c['Position'] !== 'Goalkeeper')
      .sort((a, b) => Number(a['Energy'] || 0) - Number(b['Energy'] || 0));

    if (gk) {
      const row = buildSharedDeckRow(gk);
      row.addEventListener('click', () => removeFromBuildDeck(buildDeck.indexOf(gk)));
      buildDeckListEl.appendChild(row);
    } else {
      buildDeckListEl.appendChild(buildEmptySlot('GK'));
    }

    const sep = document.createElement('div');
    sep.className = 'deck-separator';
    buildDeckListEl.appendChild(sep);

    outfield.forEach(card => {
      const row = buildSharedDeckRow(card);
      row.addEventListener('click', () => removeFromBuildDeck(buildDeck.indexOf(card)));
      buildDeckListEl.appendChild(row);
    });
    for (let i = 0; i < 19 - outfield.length; i++) {
      buildDeckListEl.appendChild(buildEmptySlot());
    }
  }

  function updateBuildCounts() {
    const count = buildDeck.length;
    const remaining = draftedCards.length - buildDeckNums.size;
    buildCountEl.textContent = `${count} / 20 selected`;
    poolCountEl.textContent = `(${remaining} remaining)`;
    deckSelectedCountEl.textContent = `(${count}/20)`;
    const hasGK = buildDeck.some(c => c['Position'] === 'Goalkeeper');
    finalizeDeckBtn.disabled = !(count === 20 && hasGK);
  }

  function renderBuildStats() {
    const statsEl = document.getElementById('draft-stats-content');
    if (!statsEl) return;
    statsEl.innerHTML = '';

    statsEl.appendChild(buildBarChartWidget('Position', () => {
      const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      const posMap = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD' };
      buildDeck.forEach(c => { const p = posMap[c['Position']]; if (p) counts[p]++; });
      return counts;
    }, '#555'));

    statsEl.appendChild(buildBarChartWidget('Energy', () => {
      const counts = {}; for (let i = 0; i <= 5; i++) counts[i] = 0;
      buildDeck.forEach(c => { counts[Number(c['Energy'] || 0)]++; });
      return counts;
    }, '#b8860b'));

    statsEl.appendChild(buildBarChartWidget('Skill Types', () => {
      const counts = { Spd: 0, Acc: 0, Ctl: 0, Ldr: 0, Str: 0 };
      const map = { Speed: 'Spd', Accuracy: 'Acc', Control: 'Ctl', Leadership: 'Ldr', Strength: 'Str' };
      buildDeck.forEach(c => {
        if (c['Skill Type #1'] && map[c['Skill Type #1']]) counts[map[c['Skill Type #1']]]++;
        if (c['Skill Type #2'] && map[c['Skill Type #2']]) counts[map[c['Skill Type #2']]]++;
      });
      return counts;
    }, null, { Spd: '#e94560', Acc: '#40916c', Ctl: '#4a90d9', Ldr: '#9b59b6', Str: '#f0c040' }));
  }

  function finalizeDeck() {
    alert('Deck finalized! You can take a screenshot or note down your picks.');
  }

})();
