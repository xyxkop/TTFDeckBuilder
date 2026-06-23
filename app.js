/**
 * TTF Deck Builder
 * A lightweight card browser for the TTF mobile game.
 * Loads card data from a public Google Sheet and provides filtering/sorting.
 */
(function () {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================

  const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnVPbikUcch1oZ7IFsKqH4K0kDHy6cHQuET5lHZrGrCTCXfWKiWSq-F5l4YXpXf2dNrqVZSjxFnWSr/pub?gid=0&single=true&output=csv';

  /** Special cards that are pre-made parallels in the spreadsheet */
  const SPECIAL_PARALLELS = {
    '651-PA': { parallel: '\u03B1/\u03B1', set: 'Shatterpoint', cardNum: '651' },
    '651-PO': { parallel: '\u03A9/\u03A9', set: 'Shatterpoint', cardNum: '651' },
    '686-PA': { parallel: '\u03B1/\u03B1', set: 'Storm', cardNum: '686' },
    '686-PO': { parallel: '\u03A9/\u03A9', set: 'Storm', cardNum: '686' },
  };

  const SKILL_TYPE_ICONS = {
    Speed: 'icons/speed.png',
    Accuracy: 'icons/accuracy.png',
    Control: 'icons/control.png',
    Strength: 'icons/strength.png',
    Leadership: 'icons/leadership.png',
  };

  const SET_COLORS = {
    'Base': { bg: '#ffffff', text: '#000000' },
    'Fusion': { bg: '#cc0000', text: '#ffffff' },
    'Pro Pass': { bg: '#444444', text: '#ffffff' },
    'Season Kick-off': { bg: '#2255cc', text: '#ffffff' },
    'Vibrant Velocity': { bg: '#111111', text: '#33cc33' },
    'One to Watch': { bg: '#00cccc', text: '#7700aa' },
    'Shatterpoint': { bg: '#999999', text: '#000000' },
    'Total Performers': { bg: '#aaccee', text: '#000000' },
    'Legends': { bg: '#ffffff', text: '#996600' },
    "Collector's Reserve": { bg: '#1a1a4e', text: '#ffffff' },
    'Greatest Show': { bg: '#cc0000', text: '#ffdd00' },
    'Storm': { bg: '#999999', text: '#996600' },
    'Halloween': { bg: '#ee7700', text: '#000000' },
    'Master Magicians': { bg: '#1a1a4e', text: '#ffffaa' },
    '30th Anniversary': { bg: '#1a1a4e', text: '#ff99bb' },
    'Team of the Season': { bg: '#ff77aa', text: '#ffffff' },
    'Birthday': { bg: '#ff99cc', text: '#1a1a4e' },
    'Terraces': { bg: '#228833', text: '#ffffff' },
    'White Ice': { bg: '#e8f0ff', text: '#1a3366' },
    'Limited': { bg: '#fffde6', text: '#996600' },
    'Iconic Numbers': { bg: '#ffffff', text: '#000000' },
    'Standout': { bg: '#ffffff', text: '#226622' },
    'Festive': { bg: '#aaffaa', text: '#cc0000' },
    'New Year': { bg: '#1a1a4e', text: '#ffdd00' },
    'Shockwave': { bg: '#2255cc', text: '#ffffff' },
    'Classic': { bg: '#eeffee', text: '#cc0000' },
    'Reign Supreme': { bg: '#ffffff', text: '#000000' },
    'Titanium': { bg: '#444444', text: '#ffffff' },
    'First Class': { bg: '#444444', text: '#ffffff' },
    'Legacy': { bg: '#aaddee', text: '#2244aa' },
    'Clarity': { bg: '#ffffff', text: '#999999' },
    'Inferno': { bg: '#cc0000', text: '#ffdd00' },
    'Next Goal Wins': { bg: '#33ccaa', text: '#7700aa' },
    'Gallery': { bg: '#ffffff', text: '#ee7700' },
    'Pitch to Dugout': { bg: '#f5eedc', text: '#000000' },
    'Encrypted': { bg: '#cc00cc', text: '#ccddee' },
    'Neon Noir': { bg: '#1a1a4e', text: '#ffdd00' },
    "He's Him": { bg: '#ffffff', text: '#cc0000' },
    'Chromium Base': { bg: '#e0d8ee', text: '#000000' },
    'Record Breakers': { bg: '#22aa88', text: '#ffffff' },
    'Limited Edition': { bg: '#fffde6', text: '#996600' },
    'Baroque': { bg: '#553322', text: '#ffffff' },
    'Box Office': { bg: '#444444', text: '#ffffff' },
    'Glow': { bg: '#111111', text: '#88ccff' },
    'Aeternus': { bg: '#ccdde8', text: '#aa8800' },
    'Eternal Gold': { bg: '#cc9900', text: '#ffffff' },
  };

  const POSITION_LABELS = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD' };

  // ============================================================
  // FILTER DEFINITIONS
  // Each entry describes one filter control in the sidebar.
  // ============================================================

  const FILTERS = [
    { column: 'License', type: 'pills', group: 'Set', options: ['UCC', 'PL', 'MLS'] },
    { column: 'Set', type: 'multiselect', searchable: true, group: 'Set',
      options: ["30th Anniversary","Aeternus","Baroque","Base","Birthday","Box Office","Chromium Base","Clarity","Classic","Collector's Reserve","Encrypted","Eternal Gold","Festive","First Class","Fusion","Gallery","Glow","Greatest Show","Halloween","He's Him","Iconic Numbers","Inferno","Legacy","Legends","Limited","Limited Edition","Master Magicians","Neon Noir","New Year","Next Goal Wins","One to Watch","Pitch to Dugout","Pro Pass","Record Breakers","Reign Supreme","Season Kick-off","Shatterpoint","Shockwave","Standout","Storm","Team of the Season","Terraces","Titanium","Total Performers","Vibrant Velocity","White Ice"] },
    { column: 'First Name', type: 'text', label: 'Player Name', group: 'Player Info',
      multi: ['First Name', 'Second Name'] },
    { column: 'Club', type: 'multiselect', searchable: true, group: 'Player Info',
      options: ["AC Milan","ACF Fiorentina","AFC Ajax","AFC Bournemouth","AS Monaco FC","AS Roma","Arsenal FC","Aston Villa","Atalanta B.C.","Athletic Club","Atlanta United","Atl\u00e9tico de Madrid","Austin FC","Bayer 04 Leverkusen","Borussia Dortmund","Brentford","Brighton & Hove Albion","Burnley","CF Montr\u00e9al","Celtic FC","Charlotte FC","Chelsea FC","Chicago Fire","Colorado Rapids","Columbus Crew","Crystal Palace","D.C. United","Eintracht Frankfurt","Everton","F.C. Copenhagen","FC Barcelona","FC Bayern M\u00fcnchen","FC Cincinnati","FC Dallas","FC Internazionale Milano","FC Porto","FC Salzburg","Feyenoord","Fulham","Galatasaray A\u015e","Houston Dynamo","Inter Miami CF","Juventus","LA Galaxy","LAFC","Leeds United","Liverpool FC","Manchester City","Manchester United","Minnesota United","Nashville SC","New England Revolution","New York City FC","New York Red Bulls","Newcastle United","Nottingham Forest","Olympiacos","Olympique de Marseille","Orlando City","PSV Eindhoven","Paris Saint-Germain","Philadelphia Union","Portland Timbers","Racing Club Strasbourg","Rangers FC","Real Betis Balompi\u00e9","Real Madrid C.F.","Real Salt Lake","Royale Union Saint-Gilloise","SK Sturm Graz","SL Benfica","SS Lazio","SSC Napoli","San Diego FC","San Jose Earthquakes","Seattle Sounders FC","Sporting Clube de Portugal","Sporting Kansas City","St. Louis CITY","Sunderland","Toronto FC","Tottenham Hotspur","Vancouver Whitecaps FC","VfB Stuttgart","West Ham United","Wolverhampton Wanderers"] },
    { column: 'Position', type: 'pills', group: 'Player Info',
      options: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
      labels: ['GK', 'DEF', 'MID', 'FWD'] },
    { column: 'Skill Type #1', type: 'tristate', label: 'Skill Type', group: 'Player Info',
      multi: ['Skill Type #1', 'Skill Type #2'],
      options: ['Speed', 'Accuracy', 'Control', 'Leadership', 'Strength'] },
    { column: 'Energy', type: 'compare', group: 'Stats', min: 0, max: 5 },
    { column: 'Defence', type: 'compare', group: 'Stats', min: 0, max: 10 },
    { column: 'Skill', type: 'compare', group: 'Stats', min: 0, max: 7 },
    { column: 'Attack', type: 'compare', group: 'Stats', min: 0, max: 10 },
    { column: 'Ability 1 Title', type: 'select', label: 'Ability', group: 'Abilities',
      multi: ['Ability 1 Title', 'Ability 2 Title'],
      options: ["Captain","Champion","Deploy","Fast","First Touch","Long Ball","Man-Marking","Playmaker","Resilience","Revitaliser","Shotblocking","Support","Teamwork","Tiki-Taka","Use Energy","Zonal Marking"] },
    { column: 'Ability 1 Text', type: 'text', label: 'Ability Text', group: 'Abilities',
      multi: ['Ability 1 Text', 'Ability 2 Text'] },
    { column: 'Parallel', type: 'parallels-toggle', group: 'Advanced Options',
      options: ['Base', '\u03B1/\u03B1', '#/77', '#/66', '#/44', '#/11', '\u03A9/\u03A9'] },
  ];

  // ============================================================
  // STATE
  // ============================================================

  let allCards = [];
  let filteredCards = [];
  let activeFilters = {};
  let savedFilters = JSON.parse(localStorage.getItem('ttf_saved_filters') || '[]');
  let sortField = 'Card #';
  let sortAsc = true;
  let includeParallels = false;
  let clickThroughFilter = null; // { type: 'player'|'club'|'set', value: string }

  // ============================================================
  // DOM REFERENCES
  // ============================================================

  const $ = (id) => document.getElementById(id);

  const cardCountEl       = $('card-count');
  const refreshBtn        = $('refresh-btn');
  const backBtn           = $('back-btn');
  const themeToggleBtn    = $('theme-toggle-btn');
  const sortFieldSelect   = $('sort-field');
  const sortDirBtn        = $('sort-dir-btn');
  const filtersContainer  = $('filters-container');
  const cardListEl        = $('card-list');
  const clearFiltersBtn   = $('clear-filters-btn');
  const saveFilterBtn     = $('save-filter-btn');
  const savedFiltersDD    = $('saved-filters-dropdown');
  const exportFiltersBtn  = $('export-filters-btn');
  const importFiltersBtn  = $('import-filters-btn');
  const importFileInput   = $('import-file');

  // ============================================================
  // INITIALIZATION
  // ============================================================

  // Theme
  let darkMode = localStorage.getItem('ttf_dark_mode') === 'true';
  applyTheme();

  // Event listeners
  themeToggleBtn.addEventListener('click', toggleTheme);
  refreshBtn.addEventListener('click', loadSheet);
  backBtn.addEventListener('click', exitClickThrough);
  sortFieldSelect.addEventListener('change', () => { sortField = sortFieldSelect.value; applyFilters(); });
  sortDirBtn.addEventListener('click', toggleSortDir);
  clearFiltersBtn.addEventListener('click', clearAllFilters);
  saveFilterBtn.addEventListener('click', saveCurrentFilter);
  savedFiltersDD.addEventListener('change', onSavedFilterSelect);
  exportFiltersBtn.addEventListener('click', exportFilters);
  importFiltersBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importFilters);

  // Close open multiselect dropdowns on outside click
  document.addEventListener('click', (e) => {
    filtersContainer.querySelectorAll('.multiselect-wrapper.open').forEach(w => {
      if (!w.contains(e.target)) w.classList.remove('open');
    });
  });

  // Build UI and load data
  buildFilterUI();
  renderSavedFilters();
  loadSheet();

  // ============================================================
  // THEME
  // ============================================================

  function toggleTheme() {
    darkMode = !darkMode;
    localStorage.setItem('ttf_dark_mode', darkMode);
    applyTheme();
  }

  function applyTheme() {
    document.body.classList.toggle('dark', darkMode);
    themeToggleBtn.textContent = darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  async function loadSheet() {
    cardListEl.innerHTML = '<p class="placeholder">Loading cards...</p>';
    refreshBtn.disabled = true;

    try {
      const response = await fetch(SHEET_CSV_URL + '&_t=' + Date.now());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      parseCSV(await response.text());
      applyFilters();
    } catch (err) {
      console.error('Failed to load sheet:', err);
      cardListEl.innerHTML = `<p class="placeholder">Failed to load card data: ${err.message}</p>`;
    } finally {
      refreshBtn.disabled = false;
    }
  }

  // ============================================================
  // CSV PARSING
  // ============================================================

  function parseCSV(text) {
    const lines = parseCSVLines(text);
    if (lines.length < 2) { allCards = []; return; }

    const header = lines[0].map(col => col.trim());
    allCards = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

      const card = {};
      for (let j = 0; j < header.length; j++) {
        card[header[j]] = (row[j] || '').trim();
      }
      card['Parallel'] = 'Base';
      allCards.push(card);
    }

    reclassifySpecialParallels();
    generateParallels();
  }

  /** Reclassify cards 651-PA, 651-PO, 686-PA, 686-PO as parallels of their base cards */
  function reclassifySpecialParallels() {
    allCards.forEach(card => {
      const sp = SPECIAL_PARALLELS[card['Card #']];
      if (sp) {
        card['Parallel'] = sp.parallel;
        card['Set'] = sp.set;
        card['Card #'] = sp.cardNum;
      }
    });
  }

  // ============================================================
  // PARALLEL GENERATION
  // ============================================================

  /**
   * Parallel rules:
   * - Outfield: alpha +2 DEF, /77 +2 ATK, /66 -1 NRG, /44 swap ATK/DEF, /11 +2 SKL
   * - Goalkeeper: alpha & /77 +1 shotblocking, /66 -1 NRG, /44 & /11 +2 shotblocking
   * - Omega: +2 ATK, +2 DEF, +2 SKL, -1 NRG
   */
  function generateParallels() {
    const parallels = [];

    allCards.forEach(card => {
      if (card['Parallels?'] !== 'Y') return;
      const isGK = card['Position'] === 'Goalkeeper';

      parallels.push(makeParallel(card, '\u03B1/\u03B1', isGK ? { shotblocking: 1 } : { Defence: 2 }));
      parallels.push(makeParallel(card, '#/77', isGK ? { shotblocking: 1 } : { Attack: 2 }));
      parallels.push(makeParallel(card, '#/66', { Energy: -1 }));
      parallels.push(makeParallel(card, '#/44', isGK ? { shotblocking: 2 } : { swap: true }));
      parallels.push(makeParallel(card, '#/11', isGK ? { shotblocking: 2 } : { Skill: 2 }));
    });

    allCards = allCards.concat(parallels);

    // Omega parallels (only from Base cards)
    const omegas = [];
    allCards.forEach(card => {
      if (card['Omega?'] !== 'Y' || card['Parallel'] !== 'Base') return;
      omegas.push(makeParallel(card, '\u03A9/\u03A9', { Attack: 2, Defence: 2, Skill: 2, Energy: -1 }));
    });

    allCards = allCards.concat(omegas);
  }

  /** Create a parallel variant of a card with the given stat modifications */
  function makeParallel(card, parallelName, mods) {
    const p = Object.assign({}, card);
    p['Parallel'] = parallelName;

    if (mods.swap) {
      p['Attack'] = card['Defence'];
      p['Defence'] = card['Attack'];
    } else if (mods.shotblocking) {
      p['Ability 1 Text'] = boostShotblocking(card['Ability 1 Text'], mods.shotblocking);
    } else {
      for (const stat of ['Energy', 'Defence', 'Skill', 'Attack']) {
        if (mods[stat] != null) {
          const base = Number(card[stat] || 0);
          p[stat] = String(Math.max(0, Math.min(base + mods[stat], 99)));
        }
      }
    }
    return p;
  }

  /** Boost "Defence +N" in shotblocking ability text */
  function boostShotblocking(text, amount) {
    if (!text) return text;
    return text.replace(/Defence \+(\d+)/i, (_, n) => `Defence +${Number(n) + amount}`);
  }

  // ============================================================
  // CSV LINE PARSER (handles quoted fields, CRLF, etc.)
  // ============================================================

  function parseCSVLines(text) {
    const lines = [];
    let current = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { current.push(field); field = ''; }
        else if (ch === '\r' && next === '\n') { current.push(field); field = ''; lines.push(current); current = []; i++; }
        else if (ch === '\n') { current.push(field); field = ''; lines.push(current); current = []; }
        else { field += ch; }
      }
    }

    if (field || current.length > 0) { current.push(field); lines.push(current); }
    return lines;
  }

  // ============================================================
  // FILTER UI BUILDER
  // ============================================================

  function buildFilterUI() {
    filtersContainer.innerHTML = '';

    // Group filters by section
    const groups = {};
    const groupOrder = [];
    FILTERS.forEach(def => {
      const g = def.group || 'Other';
      if (!groups[g]) { groups[g] = []; groupOrder.push(g); }
      groups[g].push(def);
    });

    groupOrder.forEach(groupName => {
      const section = document.createElement('div');
      section.className = 'filter-section';

      // Collapsible header
      const header = document.createElement('div');
      header.className = 'filter-section-header';
      header.innerHTML = `<span class="filter-section-arrow">&#9662;</span> <span class="filter-section-title">${groupName}</span><span class="filter-section-badge"></span><button class="filter-section-reset" title="Clear group filters">&times;</button>`;
      header.querySelector('.filter-section-title').addEventListener('click', () => section.classList.toggle('collapsed'));
      header.querySelector('.filter-section-arrow').addEventListener('click', () => section.classList.toggle('collapsed'));
      header.querySelector('.filter-section-reset').addEventListener('click', (e) => {
        e.stopPropagation();
        clearGroupFilters(groupName, section);
      });
      section.appendChild(header);

      // Content
      const content = document.createElement('div');
      content.className = 'filter-section-content';

      groups[groupName].forEach(def => {
        content.appendChild(buildFilterControl(def));
      });

      section.appendChild(content);
      if (groupName === 'Abilities' || groupName === 'Advanced Options') section.classList.add('collapsed');
      filtersContainer.appendChild(section);
    });
  }

  /** Build a single filter control element based on its definition */
  function buildFilterControl(def) {
    const group = document.createElement('div');
    group.className = 'filter-group';

    // Skip label for parallels-toggle (the checkbox has its own label)
    if (def.type !== 'parallels-toggle') {
      const label = document.createElement('label');
      label.textContent = def.label || def.column;
      group.appendChild(label);
    }

    switch (def.type) {
      case 'select':     group.appendChild(buildSelect(def)); break;
      case 'multiselect': group.appendChild(buildMultiselect(def)); break;
      case 'tristate':   group.appendChild(buildTristate(def)); break;
      case 'pills':      group.appendChild(buildPills(def)); break;
      case 'parallels-toggle': group.appendChild(buildParallelsToggle(def)); break;
      case 'text':       group.appendChild(buildTextInput(def)); break;
      case 'range':      group.appendChild(buildRangeInput(def)); break;
      case 'compare':    group.appendChild(buildCompareInput(def)); break;
    }

    return group;
  }

  function buildSelect(def) {
    const select = document.createElement('select');
    select.dataset.column = def.column;
    select.dataset.filterType = 'select';
    select.addEventListener('change', onFilterChange);

    select.appendChild(new Option('All', ''));
    def.options.forEach(val => select.appendChild(new Option(val, val)));
    return select;
  }

  function buildMultiselect(def) {
    const wrapper = document.createElement('div');
    wrapper.className = 'multiselect-wrapper';
    wrapper.dataset.column = def.column;

    const toggle = document.createElement('button');
    toggle.className = 'multiselect-toggle';
    toggle.textContent = 'All';
    toggle.type = 'button';
    toggle.addEventListener('click', () => {
      wrapper.classList.toggle('open');
      if (wrapper.classList.contains('open') && def.searchable) {
        wrapper.querySelector('.multiselect-search').focus();
      }
    });
    wrapper.appendChild(toggle);

    const dropdown = document.createElement('div');
    dropdown.className = 'multiselect-dropdown';

    if (def.searchable) {
      const search = document.createElement('input');
      search.type = 'text';
      search.className = 'multiselect-search';
      search.placeholder = 'Type to filter...';
      search.addEventListener('input', () => {
        const q = normalize(search.value);
        dropdown.querySelectorAll('.multiselect-option').forEach(opt => {
          opt.style.display = normalize(opt.textContent).includes(q) ? '' : 'none';
        });
      });
      search.addEventListener('click', e => e.stopPropagation());
      dropdown.appendChild(search);
    }

    def.options.forEach(val => {
      const labelEl = document.createElement('label');
      labelEl.className = 'multiselect-option';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = val;
      cb.dataset.column = def.column;
      cb.addEventListener('change', () => onMultiselectChange(def.column, wrapper));
      labelEl.appendChild(cb);
      const span = document.createElement('span');
      span.textContent = val;
      labelEl.appendChild(span);
      dropdown.appendChild(labelEl);
    });

    wrapper.appendChild(dropdown);
    return wrapper;
  }

  function buildTristate(def) {
    const div = document.createElement('div');
    div.className = 'tristate-wrapper';
    div.dataset.column = def.column;

    def.options.forEach(val => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tristate-item';
      item.dataset.value = val;
      item.dataset.state = 'none';
      item.textContent = val;
      item.addEventListener('click', () => {
        const s = item.dataset.state;
        item.dataset.state = s === 'none' ? 'include' : s === 'include' ? 'exclude' : 'none';
        onTristateChange(def.column, div);
      });
      div.appendChild(item);
    });
    return div;
  }

  function buildPills(def) {
    const div = document.createElement('div');
    div.className = 'tristate-wrapper';
    div.dataset.column = def.column;

    def.options.forEach((val, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tristate-item';
      item.dataset.value = val;
      item.dataset.state = 'none';
      item.textContent = (def.labels && def.labels[idx]) || val;
      item.addEventListener('click', () => {
        item.dataset.state = item.dataset.state === 'none' ? 'include' : 'none';
        onPillsChange(def.column, div);
      });
      div.appendChild(item);
    });
    return div;
  }

  function buildParallelsToggle(def) {
    const wrapper = document.createElement('div');
    wrapper.className = 'parallels-toggle-wrapper';

    const checkLabel = document.createElement('label');
    checkLabel.className = 'parallels-checkbox-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = includeParallels;

    const pillsDiv = document.createElement('div');
    pillsDiv.className = 'tristate-wrapper';
    pillsDiv.dataset.column = def.column;
    pillsDiv.style.display = includeParallels ? 'flex' : 'none';

    checkbox.addEventListener('change', () => {
      includeParallels = checkbox.checked;
      pillsDiv.style.display = includeParallels ? 'flex' : 'none';
      if (!includeParallels) {
        delete activeFilters[def.column];
        pillsDiv.querySelectorAll('.tristate-item').forEach(i => { i.dataset.state = 'none'; });
      } else {
        // Select all parallel types by default
        pillsDiv.querySelectorAll('.tristate-item').forEach(i => { i.dataset.state = 'include'; });
        activeFilters[def.column] = { type: 'multiselect', values: [...def.options] };
      }
      applyFilters();
    });

    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(document.createTextNode(' Include parallels'));
    wrapper.appendChild(checkLabel);

    def.options.forEach(val => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tristate-item';
      item.dataset.value = val;
      item.dataset.state = 'none';
      item.textContent = val;
      item.addEventListener('click', () => {
        item.dataset.state = item.dataset.state === 'none' ? 'include' : 'none';
        onPillsChange(def.column, pillsDiv);
      });
      pillsDiv.appendChild(item);
    });

    wrapper.appendChild(pillsDiv);
    return wrapper;
  }

  function buildTextInput(def) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Search ${def.label || def.column}...`;
    input.dataset.column = def.column;
    input.dataset.filterType = 'text';
    input.addEventListener('input', onFilterChange);
    return input;
  }

  function buildRangeInput(def) {
    const div = document.createElement('div');
    div.className = 'range-inputs';

    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.placeholder = 'Min';
    if (def.min != null) minInput.min = def.min;
    if (def.max != null) minInput.max = def.max;
    minInput.dataset.column = def.column;
    minInput.dataset.filterType = 'range-min';
    minInput.addEventListener('input', onFilterChange);

    const sep = document.createElement('span');
    sep.textContent = '\u2013';

    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.placeholder = 'Max';
    if (def.min != null) maxInput.min = def.min;
    if (def.max != null) maxInput.max = def.max;
    maxInput.dataset.column = def.column;
    maxInput.dataset.filterType = 'range-max';
    maxInput.addEventListener('input', onFilterChange);

    div.appendChild(minInput);
    div.appendChild(sep);
    div.appendChild(maxInput);
    return div;
  }

  function buildCompareInput(def) {
    const div = document.createElement('div');
    div.className = 'compare-inputs';

    const opSelect = document.createElement('select');
    opSelect.dataset.column = def.column;
    opSelect.dataset.filterType = 'compare-op';
    ['', '=', '>=', '<='].forEach(op => opSelect.appendChild(new Option(op || 'Any', op)));
    opSelect.addEventListener('change', onCompareChange);

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.placeholder = '#';
    if (def.min != null) numInput.min = def.min;
    if (def.max != null) numInput.max = def.max;
    numInput.dataset.column = def.column;
    numInput.dataset.filterType = 'compare-val';
    numInput.addEventListener('input', onCompareChange);

    div.appendChild(opSelect);
    div.appendChild(numInput);
    return div;
  }

  // ============================================================
  // FILTER EVENT HANDLERS
  // ============================================================

  function onFilterChange(e) {
    const col = e.target.dataset.column;
    const type = e.target.dataset.filterType;
    const val = e.target.value.trim();

    if (type === 'select') {
      val ? (activeFilters[col] = { type: 'exact', value: val }) : delete activeFilters[col];
    } else if (type === 'text') {
      val ? (activeFilters[col] = { type: 'text', value: normalize(val) }) : delete activeFilters[col];
    } else if (type === 'range-min' || type === 'range-max') {
      if (!activeFilters[col] || activeFilters[col].type !== 'range') {
        activeFilters[col] = { type: 'range', min: null, max: null };
      }
      activeFilters[col][type === 'range-min' ? 'min' : 'max'] = val !== '' ? Number(val) : null;
      if (activeFilters[col].min == null && activeFilters[col].max == null) delete activeFilters[col];
    }
    applyFilters();
  }

  function onCompareChange(e) {
    const col = e.target.dataset.column;
    const wrapper = e.target.parentElement;
    const op = wrapper.querySelector('[data-filter-type="compare-op"]').value;
    const val = wrapper.querySelector('[data-filter-type="compare-val"]').value.trim();

    if (op && val !== '') {
      activeFilters[col] = { type: 'compare', op, value: Number(val) };
    } else {
      delete activeFilters[col];
    }
    applyFilters();
  }

  function onTristateChange(col, wrapper) {
    const include = [], exclude = [];
    wrapper.querySelectorAll('.tristate-item').forEach(item => {
      if (item.dataset.state === 'include') include.push(item.dataset.value);
      else if (item.dataset.state === 'exclude') exclude.push(item.dataset.value);
    });

    if (include.length === 0 && exclude.length === 0) delete activeFilters[col];
    else activeFilters[col] = { type: 'tristate', include, exclude };
    applyFilters();
  }

  function onPillsChange(col, wrapper) {
    const selected = [];
    wrapper.querySelectorAll('.tristate-item').forEach(item => {
      if (item.dataset.state === 'include') selected.push(item.dataset.value);
    });

    selected.length === 0 ? delete activeFilters[col] : (activeFilters[col] = { type: 'multiselect', values: selected });
    applyFilters();
  }

  function onMultiselectChange(col, wrapper) {
    const selected = [];
    wrapper.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) selected.push(cb.value);
    });

    const toggle = wrapper.querySelector('.multiselect-toggle');
    if (selected.length === 0) {
      toggle.textContent = 'All';
      delete activeFilters[col];
    } else {
      toggle.textContent = selected.length <= 2 ? selected.join(', ') : `${selected.length} selected`;
      activeFilters[col] = { type: 'multiselect', values: selected };
    }
    applyFilters();
  }

  // ============================================================
  // FILTER ENGINE
  // ============================================================

  function applyFilters() {
    if (clickThroughFilter) {
      // Click-through mode: bypass sidebar filters, only respect parallels toggle
      filteredCards = allCards.filter(card => {
        if (!includeParallels && card['Parallel'] !== 'Base') return false;
        // Also respect parallel type filter if set
        if (activeFilters['Parallel']) {
          if (!activeFilters['Parallel'].values.includes(card['Parallel'])) return false;
        }
        return matchesClickThrough(card);
      });
    } else {
      // Normal mode: apply all sidebar filters
      filteredCards = allCards.filter(card => {
        if (!includeParallels && card['Parallel'] !== 'Base') return false;

        for (const col of Object.keys(activeFilters)) {
          const filter = activeFilters[col];
          if (!filter) continue;

          const def = FILTERS.find(f => f.column === col);
          const cols = (def && def.multi) ? def.multi : [col];

          if (!matchesFilter(card, filter, cols, def)) return false;
        }
        return true;
      });
    }

    sortCards();
    renderCards();
    updateFilterBadges();
    backBtn.classList.toggle('hidden', !clickThroughFilter);
  }

  /** Match a card against the active click-through filter */
  function matchesClickThrough(card) {
    const ct = clickThroughFilter;
    if (ct.type === 'player') {
      const name = `${card['First Name'] || ''} ${card['Second Name'] || ''}`.trim();
      return name === ct.value;
    } else if (ct.type === 'club') {
      return (card['Club'] || '') === ct.value;
    } else if (ct.type === 'set') {
      return (card['License'] || '') === ct.value.license && (card['Set'] || '') === ct.value.set;
    }
    return true;
  }

  /** Activate click-through mode */
  function activateClickThrough(type, value) {
    clickThroughFilter = { type, value };
    applyFilters();
  }

  /** Exit click-through mode, return to normal filtered view */
  function exitClickThrough() {
    clickThroughFilter = null;
    applyFilters();
  }

  /** Check if a card matches a single filter */
  function matchesFilter(card, filter, cols, def) {
    switch (filter.type) {
      case 'exact':
        return cols.some(c => (card[c] || '') === filter.value);

      case 'multiselect':
        if (def && def.filterMode === 'exclude') {
          return !cols.some(c => filter.values.includes(card[c] || ''));
        }
        return cols.some(c => filter.values.includes(card[c] || ''));

      case 'tristate':
        if (filter.include.length > 0 && !cols.some(c => filter.include.includes(card[c] || ''))) return false;
        if (filter.exclude.length > 0 && cols.some(c => filter.exclude.includes(card[c] || ''))) return false;
        return true;

      case 'compare': {
        const num = Number(card[cols[0]] || '');
        if (isNaN(num)) return false;
        if (filter.op === '=' && num !== filter.value) return false;
        if (filter.op === '>=' && num < filter.value) return false;
        if (filter.op === '<=' && num > filter.value) return false;
        return true;
      }

      case 'text': {
        if (def && def.multi && filter.value.includes(' ')) {
          const words = filter.value.split(/\s+/).filter(w => w);
          return words.every(word => cols.some(c => normalize(card[c] || '').includes(word)));
        }
        return cols.some(c => normalize(card[c] || '').includes(filter.value));
      }

      case 'range': {
        const num = Number(card[cols[0]] || '');
        if (isNaN(num)) return false;
        if (filter.min != null && num < filter.min) return false;
        if (filter.max != null && num > filter.max) return false;
        return true;
      }

      default:
        return true;
    }
  }

  // ============================================================
  // SORTING
  // ============================================================

  function toggleSortDir() {
    sortAsc = !sortAsc;
    sortDirBtn.textContent = sortAsc ? '\u2191' : '\u2193';
    sortDirBtn.title = sortAsc ? 'Ascending' : 'Descending';
    applyFilters();
  }

  function sortCards() {
    if (!sortField) return;

    filteredCards.sort((a, b) => {
      let valA, valB;

      if (sortField === 'Name') {
        valA = `${a['First Name'] || ''} ${a['Second Name'] || ''}`.trim().toLowerCase();
        valB = `${b['First Name'] || ''} ${b['Second Name'] || ''}`.trim().toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'Card #') {
        valA = parseInt(a['Card #']) || 0;
        valB = parseInt(b['Card #']) || 0;
      } else {
        valA = Number(a[sortField] || 0);
        valB = Number(b[sortField] || 0);
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }

  // ============================================================
  // FILTER UTILITIES
  // ============================================================

  function clearAllFilters() {
    activeFilters = {};
    filtersContainer.querySelectorAll('select').forEach(el => el.value = '');
    filtersContainer.querySelectorAll('input').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    filtersContainer.querySelectorAll('.multiselect-toggle').forEach(el => el.textContent = 'All');
    filtersContainer.querySelectorAll('.multiselect-wrapper').forEach(el => el.classList.remove('open'));
    filtersContainer.querySelectorAll('.tristate-item').forEach(el => el.dataset.state = 'none');
    applyFilters();
  }

  function clearGroupFilters(groupName, section) {
    // Remove active filters for all columns in this group
    FILTERS.forEach(def => {
      if ((def.group || 'Other') === groupName) {
        delete activeFilters[def.column];
      }
    });

    // Reset UI elements within this section
    section.querySelectorAll('select').forEach(el => el.value = '');
    section.querySelectorAll('input').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    section.querySelectorAll('.multiselect-toggle').forEach(el => el.textContent = 'All');
    section.querySelectorAll('.multiselect-wrapper').forEach(el => el.classList.remove('open'));
    section.querySelectorAll('.tristate-item').forEach(el => el.dataset.state = 'none');

    applyFilters();
  }

  function updateFilterBadges() {
    const groupCounts = {};
    FILTERS.forEach(def => {
      const g = def.group || 'Other';
      if (activeFilters[def.column]) groupCounts[g] = (groupCounts[g] || 0) + 1;
    });

    filtersContainer.querySelectorAll('.filter-section').forEach(section => {
      const title = section.querySelector('.filter-section-title').textContent;
      const badge = section.querySelector('.filter-section-badge');
      const count = groupCounts[title] || 0;
      badge.textContent = count > 0 ? `(${count} set)` : '';
    });
  }

  // ============================================================
  // CARD RENDERING
  // ============================================================

  function renderCards() {
    cardCountEl.textContent = `${filteredCards.length} / ${allCards.length} cards`;

    if (filteredCards.length === 0) {
      cardListEl.innerHTML = '<p class="placeholder">No cards match the current filters.</p>';
      return;
    }

    cardListEl.innerHTML = '';
    filteredCards.forEach(card => cardListEl.appendChild(buildCardElement(card)));
  }

  function buildCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';

    // Parallel badge (top-right)
    const parallel = card['Parallel'] || 'Base';
    if (parallel !== 'Base') {
      const badge = document.createElement('div');
      badge.className = 'card-parallel-badge';
      badge.textContent = parallel;
      div.appendChild(badge);
    }

    // Set + License header (colored, text clickable)
    const setEl = document.createElement('div');
    setEl.className = 'card-set';
    const setName = card['Set'] || '';
    const license = card['License'] || '';
    const setColor = SET_COLORS[setName];
    if (setColor) { setEl.style.background = setColor.bg; setEl.style.color = setColor.text; }

    const setTextSpan = document.createElement('span');
    setTextSpan.className = 'clickable';
    setTextSpan.textContent = [license, setName].filter(Boolean).join(' | ');
    setTextSpan.addEventListener('click', () => activateClickThrough('set', { license, set: setName }));
    setEl.appendChild(setTextSpan);
    div.appendChild(setEl);

    // Player name (text clickable)
    const nameEl = document.createElement('div');
    nameEl.className = 'card-name';
    const fullName = `${card['First Name'] || ''} ${card['Second Name'] || ''}`.trim() || '(unnamed)';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'clickable';
    nameSpan.textContent = fullName;
    nameSpan.addEventListener('click', () => activateClickThrough('player', fullName));
    nameEl.appendChild(nameSpan);
    div.appendChild(nameEl);

    // Club (text clickable)
    if (card['Club']) {
      const clubEl = document.createElement('div');
      clubEl.className = 'card-club';
      const clubSpan = document.createElement('span');
      clubSpan.className = 'clickable';
      clubSpan.textContent = card['Club'];
      clubSpan.addEventListener('click', () => activateClickThrough('club', card['Club']));
      clubEl.appendChild(clubSpan);
      div.appendChild(clubEl);
    }

    // Bottom section: 3-column layout (stats | info | abilities)
    const bottomEl = document.createElement('div');
    bottomEl.className = 'card-bottom';

    // Left column: Defence, Skill, Attack (stacked vertically)
    const statsCol = document.createElement('div');
    statsCol.className = 'card-stats-col';
    statsCol.appendChild(buildStat('defence', card['Defence'] || '0'));
    statsCol.appendChild(buildStat('skill', card['Skill'] || '0'));
    statsCol.appendChild(buildStat('attack', card['Attack'] || '0'));
    bottomEl.appendChild(statsCol);

    // Middle column: Position, Energy, Skill Types (stacked vertically)
    const infoCol = document.createElement('div');
    infoCol.className = 'card-info-col';

    const posEl = document.createElement('div');
    posEl.className = 'card-position';
    posEl.textContent = POSITION_LABELS[card['Position']] || card['Position'];
    infoCol.appendChild(posEl);

    const energyEl = buildStat('energy', `\u26A1 ${card['Energy'] || '0'}`);
    infoCol.appendChild(energyEl);

    const skillTypesEl = document.createElement('div');
    skillTypesEl.className = 'card-skill-types';
    [card['Skill Type #1'], card['Skill Type #2']].forEach(st => {
      if (st) {
        const icon = document.createElement('img');
        icon.className = 'skill-type-icon';
        icon.src = SKILL_TYPE_ICONS[st] || '';
        icon.alt = st;
        skillTypesEl.appendChild(icon);
      }
    });
    infoCol.appendChild(skillTypesEl);
    bottomEl.appendChild(infoCol);

    // Right column: Abilities
    const abilitiesEl = document.createElement('div');
    abilitiesEl.className = 'card-abilities';
    appendAbility(abilitiesEl, card['Ability 1 Title'], card['Ability 1 Text']);
    appendAbility(abilitiesEl, card['Ability 2 Title'], card['Ability 2 Text']);
    bottomEl.appendChild(abilitiesEl);

    div.appendChild(bottomEl);

    // Card number (footer)
    const cardNumEl = document.createElement('div');
    cardNumEl.className = 'card-number';
    cardNumEl.textContent = card['Card #'] || '';
    div.appendChild(cardNumEl);

    return div;
  }

  function buildStat(type, text) {
    const el = document.createElement('span');
    el.className = `stat stat-${type}`;
    el.innerHTML = text;
    return el;
  }

  function appendAbility(container, title, text) {
    if (!title || title === 'N/A') return;
    const el = document.createElement('div');
    el.className = 'card-ability';
    el.innerHTML = `<strong>${escapeHtml(title)}</strong>${text && text !== 'N/A' ? ' <span>' + escapeHtml(text) + '</span>' : ''}`;
    container.appendChild(el);
  }

  // ============================================================
  // SAVED FILTERS
  // ============================================================

  function saveCurrentFilter() {
    if (Object.keys(activeFilters).length === 0) {
      alert('No active filters to save.');
      return;
    }
    const name = prompt('Name this filter:');
    if (!name) return;

    savedFilters.push({ name, filters: JSON.parse(JSON.stringify(activeFilters)) });
    persistSavedFilters();
    renderSavedFilters();
  }

  function loadSavedFilter(index) {
    const saved = savedFilters[index];
    if (!saved) return;
    activeFilters = JSON.parse(JSON.stringify(saved.filters));
    restoreFilterUI();
    applyFilters();
  }

  function onSavedFilterSelect() {
    const val = savedFiltersDD.value;
    if (val === '__delete__') {
      const name = prompt('Enter the name of the filter to delete:');
      if (name) {
        const idx = savedFilters.findIndex(f => f.name === name);
        if (idx !== -1) { savedFilters.splice(idx, 1); persistSavedFilters(); renderSavedFilters(); }
        else alert('Filter not found.');
      }
      savedFiltersDD.value = '';
      return;
    }
    if (val === '') return;
    loadSavedFilter(parseInt(val));
    savedFiltersDD.value = '';
  }

  function renderSavedFilters() {
    savedFiltersDD.innerHTML = '<option value="">Saved Filters</option>';
    savedFilters.forEach((sf, i) => savedFiltersDD.appendChild(new Option(sf.name, i)));

    if (savedFilters.length > 0) {
      const sep = new Option('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', '');
      sep.disabled = true;
      savedFiltersDD.appendChild(sep);
      savedFiltersDD.appendChild(new Option('Delete a filter...', '__delete__'));
    }
  }

  function persistSavedFilters() {
    localStorage.setItem('ttf_saved_filters', JSON.stringify(savedFilters));
  }

  function restoreFilterUI() {
    filtersContainer.querySelectorAll('select').forEach(el => el.value = '');
    filtersContainer.querySelectorAll('input').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    filtersContainer.querySelectorAll('.multiselect-toggle').forEach(el => el.textContent = 'All');

    for (const col of Object.keys(activeFilters)) {
      const filter = activeFilters[col];
      if (!filter) continue;

      if (filter.type === 'exact') {
        const sel = filtersContainer.querySelector(`select[data-column="${col}"]`);
        if (sel) sel.value = filter.value;
      } else if (filter.type === 'multiselect') {
        const wrapper = filtersContainer.querySelector(`.multiselect-wrapper[data-column="${col}"]`);
        if (wrapper) {
          wrapper.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = filter.values.includes(cb.value));
          const toggle = wrapper.querySelector('.multiselect-toggle');
          toggle.textContent = filter.values.length <= 2 ? filter.values.join(', ') : `${filter.values.length} selected`;
        }
        const pills = filtersContainer.querySelector(`.tristate-wrapper[data-column="${col}"]`);
        if (pills) pills.querySelectorAll('.tristate-item').forEach(i => { i.dataset.state = filter.values.includes(i.dataset.value) ? 'include' : 'none'; });
      } else if (filter.type === 'text') {
        const inp = filtersContainer.querySelector(`input[data-filter-type="text"][data-column="${col}"]`);
        if (inp) inp.value = filter.value;
      } else if (filter.type === 'compare') {
        const op = filtersContainer.querySelector(`select[data-filter-type="compare-op"][data-column="${col}"]`);
        const v = filtersContainer.querySelector(`input[data-filter-type="compare-val"][data-column="${col}"]`);
        if (op) op.value = filter.op;
        if (v) v.value = filter.value;
      } else if (filter.type === 'tristate') {
        const w = filtersContainer.querySelector(`.tristate-wrapper[data-column="${col}"]`);
        if (w) w.querySelectorAll('.tristate-item').forEach(i => {
          i.dataset.state = filter.include.includes(i.dataset.value) ? 'include' : filter.exclude.includes(i.dataset.value) ? 'exclude' : 'none';
        });
      } else if (filter.type === 'range') {
        const mi = filtersContainer.querySelector(`input[data-filter-type="range-min"][data-column="${col}"]`);
        const ma = filtersContainer.querySelector(`input[data-filter-type="range-max"][data-column="${col}"]`);
        if (mi && filter.min != null) mi.value = filter.min;
        if (ma && filter.max != null) ma.value = filter.max;
      }
    }
  }

  // ============================================================
  // EXPORT / IMPORT
  // ============================================================

  function exportFilters() {
    if (savedFilters.length === 0) { alert('No saved filters to export.'); return; }

    const blob = new Blob([JSON.stringify(savedFilters, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ttf-deck-filters.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFilters(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        savedFilters = savedFilters.concat(imported);
        persistSavedFilters();
        renderSavedFilters();
        alert(`Imported ${imported.length} filter(s).`);
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Strip diacritics and lowercase for accent-insensitive matching */
  function normalize(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00f8/g, 'o')  // ø → o
      .replace(/\u00d8/g, 'o')  // Ø → o
      .replace(/\u00e6/g, 'ae') // æ → ae
      .replace(/\u00c6/g, 'ae') // Æ → ae
      .replace(/\u00f0/g, 'd')  // ð → d
      .replace(/\u00d0/g, 'd')  // Ð → d
      .replace(/\u00df/g, 'ss') // ß → ss
      .toLowerCase();
  }

})();
