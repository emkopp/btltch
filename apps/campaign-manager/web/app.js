'use strict';

// Data navigator for the mercenary manager DB. Config-driven: each collection maps
// to an API endpoint, a set of table columns, a search accessor, and optional
// dropdown filters. Selecting a row renders the full document in the detail pane.

function money(n) {
  return (n ?? 0).toLocaleString('en-US') + ' C-Bills';
}
function moveStr(m) {
  return m ? `${m.walk}/${m.run}/${m.jump}` : '';
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const COLLECTIONS = [
  {
    id: 'design', label: 'Designs', endpoint: '/api/design',
    columns: [
      { label: 'Model', get: d => d.model },
      { label: 'Class', get: d => d.class },
      { label: 'Weight', get: d => d.weightClass },
      { label: 'Tons', get: d => d.tonnage, right: true },
      { label: 'Tech', get: d => d.techBase },
      { label: 'Move', get: d => moveStr(d.movement) },
    ],
    search: d => `${d.model} ${d.class}`,
    filters: [
      { label: 'Weight', get: d => d.weightClass },
      { label: 'Tech', get: d => d.techBase },
    ],
    title: d => `${d.class} ${d.model}`,
  },
  {
    id: 'weapon', label: 'Weapons', endpoint: '/api/weapon',
    columns: [
      { label: 'Name', get: w => w.name },
      { label: 'Tech', get: w => w.techBase },
      { label: 'Heat', get: w => w.heat, right: true },
      { label: 'Dmg', get: w => w.damagePerAttack, right: true },
      { label: 'Total', get: w => w.totalDamage, right: true },
      { label: 'Range S/M/L', get: w => w.range ? `${w.range.short}/${w.range.medium}/${w.range.long}` : '' },
      { label: 'Ammo/t', get: w => w.ammoPerTon ?? '', right: true },
    ],
    search: w => `${w.name} ${w.techBase}`,
    filters: [
      { label: 'Tech', get: w => w.techBase },
      { label: 'Type', get: w => (w.missile ? 'Missile' : 'Direct') },
    ],
    title: w => `${w.name} (${w.techBase})`,
  },
  {
    id: 'equipment', label: 'Equipment', endpoint: '/api/equipment',
    columns: [
      { label: 'Name', get: e => e.name },
      { label: 'Description', get: e => e.description },
    ],
    search: e => `${e.name} ${e.description}`,
    filters: [],
    title: e => e.name,
  },
  {
    id: 'mech', label: 'Stable', endpoint: '/api/stable',
    columns: [
      { label: 'Variant', get: m => m.variant },
      { label: 'Chassis', get: m => m.chassis },
      { label: 'Weight', get: m => m.weightClass },
      { label: 'Tons', get: m => m.tons, right: true },
      { label: 'Condition', get: m => m.condition },
      { label: 'Pilot', get: m => (m.pilot ? `${m.pilot.callsign} (${m.pilot.gunnery}/${m.pilot.piloting})` : 'unassigned') },
    ],
    search: m => `${m.variant} ${m.chassis}`,
    filters: [{ label: 'Condition', get: m => m.condition }],
    title: m => `${m.chassis} ${m.variant}`,
  },
  {
    id: 'pilot', label: 'Pilots', endpoint: '/api/pilot',
    columns: [
      { label: 'Callsign', get: p => p.callsign },
      { label: 'Name', get: p => p.name },
      { label: 'Gun', get: p => p.gunnery, right: true },
      { label: 'Pil', get: p => p.piloting, right: true },
      { label: 'Rating', get: p => p.rating },
      { label: 'Salary', get: p => money(p.salary), right: true },
    ],
    search: p => `${p.callsign} ${p.name} ${p.rating}`,
    filters: [{ label: 'Rating', get: p => p.rating }],
    title: p => `${p.callsign} \u2014 ${p.rating}`,
  },
  {
    id: 'staff', label: 'Staff', endpoint: '/api/staff',
    columns: [
      { label: 'Name', get: s => s.name },
      { label: 'Type', get: s => s.staffType },
      { label: 'Tier', get: s => s.tier },
      { label: 'Rating', get: s => s.rating, right: true },
      { label: 'Monthly', get: s => money(s.monthlyCost), right: true },
      { label: 'Skills', get: s => (s.specialSkills || []).join(', ') },
    ],
    search: s => `${s.name} ${s.staffType} ${s.tier} ${(s.specialSkills || []).join(' ')}`,
    filters: [
      { label: 'Type', get: s => s.staffType },
      { label: 'Tier', get: s => s.tier },
    ],
    title: s => `${s.name} \u2014 ${s.tier} ${s.staffType}`,
  },
  {
    id: 'work', label: 'Work', custom: true, render: renderWorkView,
  },
  {
    id: 'ownedWeapons', label: 'Weapons', custom: true, render: container => renderInventory(container, 'weapon'),
  },
  {
    id: 'ownedEquipment', label: 'Equipment', custom: true, render: container => renderInventory(container, 'equipment'),
  },
  {
    id: 'txn', label: 'Finances', custom: true, render: renderLedgerView,
  },
  {
    id: 'company', label: 'Company', endpoint: '/api/company',
    columns: [
      { label: 'Name', get: c => c.name },
      { label: 'Experience', get: c => c.rating && c.rating.experience },
    ],
    search: c => c.name || '',
    filters: [],
    title: c => c.name || 'Company',
  },
];

// Pages set window.NAV_CONFIG to pick which collections this view shows.
const NAV = window.NAV_CONFIG || { collections: COLLECTIONS.map(c => c.id), default: 'design' };
const ACTIVE = NAV.collections.map(id => COLLECTIONS.find(c => c.id === id)).filter(Boolean);

const state = { col: null, data: [], filterValues: {}, selectedId: null };
const cache = new Map();

// Identifies this browser so it can ignore the echo of its own saved changes over SSE.
const CLIENT_ID = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

const els = {
  nav: document.getElementById('nav'),
  search: document.getElementById('search'),
  filters: document.getElementById('filters'),
  count: document.getElementById('count'),
  thead: document.querySelector('#list thead'),
  tbody: document.querySelector('#list tbody'),
  detail: document.getElementById('detail'),
  summary: document.getElementById('summary'),
  toolbar: document.querySelector('.toolbar'),
  split: document.querySelector('.split'),
  custom: document.getElementById('custom-view'),
};

function td(text, right) {
  const cell = document.createElement('td');
  cell.textContent = text === null || text === undefined ? '' : String(text);
  if (right) cell.className = 'right';
  return cell;
}

async function fetchCollection(col) {
  if (cache.has(col.id)) return cache.get(col.id);
  const res = await fetch(col.endpoint);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${col.endpoint}`);
  const data = await res.json();
  cache.set(col.id, data);
  return data;
}

function buildNav() {
  els.nav.replaceChildren();
  for (const col of ACTIVE) {
    const btn = document.createElement('button');
    btn.dataset.id = col.id;
    const label = document.createElement('span');
    label.textContent = col.label;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.dataset.badge = col.id;
    btn.append(label, badge);
    btn.addEventListener('click', () => selectCollection(col.id));
    els.nav.appendChild(btn);
  }
}

function buildFilters(col) {
  els.filters.replaceChildren();
  state.filterValues = {};
  for (const f of col.filters) {
    const values = [...new Set(state.data.map(d => f.get(d)).filter(v => v !== undefined && v !== null && v !== ''))].sort();
    const label = document.createElement('label');
    label.textContent = f.label + ': ';
    const select = document.createElement('select');
    const all = document.createElement('option');
    all.value = ''; all.textContent = 'All';
    select.appendChild(all);
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = String(v); opt.textContent = String(v);
      select.appendChild(opt);
    }
    select.addEventListener('change', () => { state.filterValues[f.label] = select.value; applyView(); });
    label.appendChild(select);
    els.filters.appendChild(label);
  }
}

function buildHead(col) {
  const tr = document.createElement('tr');
  for (const c of col.columns) {
    const th = document.createElement('th');
    th.textContent = c.label;
    if (c.right) th.className = 'right';
    tr.appendChild(th);
  }
  els.thead.replaceChildren(tr);
}

function applyView() {
  const col = state.col;
  const q = els.search.value.trim().toLowerCase();
  const rows = state.data.filter(d => {
    if (q && !col.search(d).toLowerCase().includes(q)) return false;
    for (const f of col.filters) {
      const sel = state.filterValues[f.label];
      if (sel && String(f.get(d)) !== sel) return false;
    }
    return true;
  });

  els.tbody.replaceChildren();
  for (const d of rows) {
    const tr = document.createElement('tr');
    tr.dataset.id = d._id;
    if (d._id === state.selectedId) tr.classList.add('selected');
    for (const c of col.columns) tr.appendChild(td(c.get(d), c.right));
    tr.addEventListener('click', () => selectRow(d));
    els.tbody.appendChild(tr);
  }
  els.count.textContent = `${rows.length} of ${state.data.length}`;
}

async function selectCollection(id) {
  const col = COLLECTIONS.find(c => c.id === id);
  state.col = col;
  state.selectedId = null;
  for (const btn of els.nav.children) btn.classList.toggle('active', btn.dataset.id === id);

  // Custom views (e.g. Work) replace the table/detail area with their own content.
  // Inline display is used because .toolbar/.split set display:flex, which overrides [hidden].
  if (col.custom) {
    if (els.toolbar) els.toolbar.style.display = 'none';
    if (els.split) els.split.style.display = 'none';
    if (els.custom) { els.custom.style.display = 'block'; await col.render(els.custom); }
    return;
  }
  if (els.toolbar) els.toolbar.style.display = '';
  if (els.split) els.split.style.display = '';
  if (els.custom) els.custom.style.display = 'none';

  els.search.value = '';
  // Designs open in the record-sheet modal, so the detail pane is redundant there.
  els.detail.hidden = col.id === 'design';
  els.detail.replaceChildren(hint('Select a row to see details.'));
  try {
    state.data = await fetchCollection(col);
  } catch (err) {
    els.detail.hidden = false;
    els.detail.replaceChildren(hint('Error: ' + err.message));
    return;
  }
  const badge = els.nav.querySelector(`[data-badge="${id}"]`);
  if (badge) badge.textContent = state.data.length;
  buildFilters(col);
  buildHead(col);
  applyView();
}

function selectRow(doc) {
  state.selectedId = doc._id;
  for (const tr of els.tbody.children) tr.classList.toggle('selected', tr.dataset.id === doc._id);
  if (state.col.id === 'design') openDesignSheet(doc);
  else if (state.col.id === 'mech') renderMechDetail(doc);
  else renderDetail(state.col, doc);
}

function hint(text) {
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = text;
  return p;
}

// ---- Detail rendering (generic, recursive) ----
const META = new Set(['_id', '_type', '_rev', '_updatedAt', 'type']);

function renderDetail(col, doc) {
  els.detail.replaceChildren();
  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = typeof col.title === 'function' ? col.title(doc) : (doc._id || '');
  const id = document.createElement('p');
  id.className = 'detail-id';
  id.textContent = doc._id;
  els.detail.append(title, id);

  const body = {};
  for (const [k, v] of Object.entries(doc)) if (!META.has(k)) body[k] = v;
  els.detail.appendChild(renderObject(body));

  const raw = document.createElement('details');
  raw.className = 'raw';
  const summary = document.createElement('summary');
  summary.textContent = 'Raw JSON';
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(doc, null, 2);
  raw.append(summary, pre);
  els.detail.appendChild(raw);
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function renderObject(obj) {
  const dl = document.createElement('dl');
  dl.className = 'kv';
  for (const [k, v] of Object.entries(obj)) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.appendChild(renderValue(v));
    dl.append(dt, dd);
  }
  return dl;
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') return document.createTextNode('\u2014');
  if (Array.isArray(value)) {
    if (value.length === 0) return document.createTextNode('\u2014');
    if (value.every(v => !isPlainObject(v) && !Array.isArray(v))) {
      const items = value.filter(v => v !== '' && v !== null && v !== undefined);
      return document.createTextNode(items.length ? items.join(', ') : '\u2014');
    }
    return renderObjectArray(value);
  }
  if (isPlainObject(value)) {
    const wrap = document.createElement('div');
    wrap.className = 'sub';
    wrap.appendChild(renderObject(value));
    return wrap;
  }
  return document.createTextNode(String(value));
}

function renderObjectArray(arr) {
  const keys = [...new Set(arr.flatMap(o => (isPlainObject(o) ? Object.keys(o) : [])))];
  const table = document.createElement('table');
  table.className = 'mini';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  for (const k of keys) { const th = document.createElement('th'); th.textContent = k; htr.appendChild(th); }
  thead.appendChild(htr);
  const tbody = document.createElement('tbody');
  for (const o of arr) {
    const tr = document.createElement('tr');
    for (const k of keys) {
      const cell = document.createElement('td');
      const v = isPlainObject(o) ? o[k] : o;
      cell.textContent = v === null || v === undefined ? '' : String(v);
      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  }
  table.append(thead, tbody);
  return table;
}

// ---- Owned-'Mech damage & criticals editor (per-unit battle state) ----
// Individual BattleTech locations; armor/structure maxima are read from the linked design.
const MECH_LOCS = [
  { code: 'HD', name: 'Head',         armor: 'head',        struct: 'head',        rear: null },
  { code: 'CT', name: 'Center Torso', armor: 'centerTorso', struct: 'centerTorso', rear: 'rearCenter' },
  { code: 'LT', name: 'Left Torso',   armor: 'sideTorso',   struct: 'sideTorso',   rear: 'rearSide' },
  { code: 'RT', name: 'Right Torso',  armor: 'sideTorso',   struct: 'sideTorso',   rear: 'rearSide' },
  { code: 'LA', name: 'Left Arm',     armor: 'arm',         struct: 'arm',         rear: null },
  { code: 'RA', name: 'Right Arm',    armor: 'arm',         struct: 'arm',         rear: null },
  { code: 'LL', name: 'Left Leg',     armor: 'leg',         struct: 'leg',         rear: null },
  { code: 'RL', name: 'Right Leg',    armor: 'leg',         struct: 'leg',         rear: null },
];

function emptyMechState() {
  return { armorFront: {}, armorRear: {}, structure: {}, crits: {} };
}

// Both the compact editor and the record sheet edit ONE shared mech.state object; a change in
// either view refreshes the other and debounce-persists, so the two stay in sync.
function ensureMechState(mech) {
  if (!mech.state) mech.state = emptyMechState();
  const s = mech.state;
  s.armorFront = s.armorFront || {};
  s.armorRear = s.armorRear || {};
  s.structure = s.structure || {};
  s.crits = s.crits || {};
  if (typeof s.heat !== 'number') s.heat = 0;
  return s;
}

const mechViews = { compact: null, sheet: null }; // each: { mechId, redraw, setStatus }
let mechSaveTimer = null;

function broadcastMechStatus(mech, s) {
  for (const v of Object.values(mechViews)) if (v && v.mechId === mech._id && v.setStatus) v.setStatus(s);
}

function mechStateChanged(mech, source) {
  for (const key of Object.keys(mechViews)) {
    const v = mechViews[key];
    if (v && key !== source && v.mechId === mech._id && v.redraw) v.redraw();
  }
  clearTimeout(mechSaveTimer);
  broadcastMechStatus(mech, 'Saving\u2026');
  mechSaveTimer = setTimeout(async () => {
    try {
      const uuid = mech._id.split(':')[1];
      const res = await fetch(`/api/mech/${uuid}/state`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Client-Id': CLIENT_ID },
        body: JSON.stringify({ state: mech.state }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      cache.delete('mech');
      const i = state.data.findIndex(d => d._id === mech._id);
      if (i >= 0) { state.data[i].state = mech.state; state.data[i]._rev = updated._rev; }
      broadcastMechStatus(mech, 'Saved');
    } catch (e) {
      broadcastMechStatus(mech, 'Error: ' + e.message);
    }
  }, 400);
}

// Subscribe to server-pushed mech-state changes so other browsers stay in sync live.
function startEventStream() {
  if (typeof EventSource === 'undefined') return;
  let es;
  try { es = new EventSource('/api/events'); } catch { return; }
  es.addEventListener('mech-state', e => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    if (msg.origin === CLIENT_ID) return; // ignore the echo of our own save
    applyRemoteMechState(msg.id, msg.state, msg.rev);
  });
}

// Apply a mech's state pushed from the server into the shared object and refresh any open views.
function applyRemoteMechState(id, incoming, rev) {
  const candidates = [];
  if (Array.isArray(state.data)) { const m = state.data.find(d => d && d._id === id); if (m) candidates.push(m); }
  const cached = cache.get('mech');
  if (Array.isArray(cached)) { const m = cached.find(d => d && d._id === id); if (m && !candidates.includes(m)) candidates.push(m); }
  if (!candidates.length) return;
  for (const mech of candidates) {
    const s = ensureMechState(mech);
    s.armorFront = (incoming && incoming.armorFront) || {};
    s.armorRear = (incoming && incoming.armorRear) || {};
    s.structure = (incoming && incoming.structure) || {};
    s.crits = (incoming && incoming.crits) || {};
    s.heat = incoming && typeof incoming.heat === 'number' ? incoming.heat : 0;
    mech._rev = rev;
  }
  for (const key of Object.keys(mechViews)) {
    const v = mechViews[key];
    if (v && v.mechId === id && v.redraw) v.redraw();
  }
}

function renderMechDetail(mech) {
  els.detail.replaceChildren();
  const design = mech.design || null;

  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = `${mech.chassis || (design && design.class) || ''} ${mech.variant || (design && design.model) || ''}`.trim();
  const sub = document.createElement('p');
  sub.className = 'detail-id';
  const pilot = mech.pilot ? `${mech.pilot.callsign} (${mech.pilot.gunnery}/${mech.pilot.piloting})` : 'unassigned';
  sub.textContent = `${mech.tons || (design && design.tonnage) || '?'} tons \u00b7 ${mech.weightClass || (design && design.weightClass) || ''} \u00b7 ${pilot}`;
  els.detail.append(title, sub);

  if (!design) {
    els.detail.appendChild(hint('This \u2019Mech has no linked design, so its armor/structure/crit layout is unknown. Damage tracking needs a design link.'));
    return;
  }

  const st = ensureMechState(mech);

  const A = design.armor || {}, S = design.structure || {};
  const maxFront = loc => Number(A[loc.armor]) || 0;
  const maxRear = loc => (loc.rear ? Number(A[loc.rear]) || 0 : 0);
  const maxStruct = loc => Number(S[loc.struct]) || 0;

  function pipTrack(max, dmg, cls, onSet) {
    const track = document.createElement('div');
    track.className = 'dmg-track ' + (cls || '');
    for (let i = 0; i < max; i++) {
      const p = document.createElement('span');
      p.className = 'dmg-pip' + (i < dmg ? ' gone' : '');
      // Click an intact pip to damage up to it; click a damaged pip to repair from it.
      p.addEventListener('click', () => onSet(i < dmg ? i : i + 1));
      track.appendChild(p);
    }
    return track;
  }

  function critList(code) {
    const slots = (design.criticalSlots && design.criticalSlots[code]) || [];
    const list = document.createElement('div');
    list.className = 'crit-list';
    const destroyed = st.crits[code] || (st.crits[code] = []);
    slots.forEach((label, idx) => {
      const empty = !label || !String(label).trim();
      const row = document.createElement('div');
      row.className = 'crit-slot' + (empty ? ' empty' : '') + (destroyed.includes(idx) ? ' destroyed' : '');
      row.textContent = empty ? '\u2014' : stripTag(label);
      if (!empty) row.addEventListener('click', () => {
        const at = destroyed.indexOf(idx);
        if (at >= 0) destroyed.splice(at, 1); else destroyed.push(idx);
        change();
      });
      list.appendChild(row);
    });
    return list;
  }

  const grid = document.createElement('div');
  grid.className = 'loc-grid';
  const status = document.createElement('p');
  status.className = 'hint dmg-status';
  const bar = document.createElement('div');
  bar.className = 'dmg-actions';
  const sheetBtn = document.createElement('button');
  sheetBtn.className = 'btn'; sheetBtn.textContent = 'Battle record sheet';
  sheetBtn.addEventListener('click', () => openBattleSheet(mech));
  const repairBtn = document.createElement('button');
  repairBtn.className = 'btn ghost'; repairBtn.textContent = 'Full repair';
  const msg = document.createElement('span');
  msg.className = 'dmg-msg';
  bar.append(sheetBtn, repairBtn, msg);
  els.detail.append(status, grid, bar);

  // User edits write through the shared state, refresh the sheet, and auto-save.
  function change() { draw(); mechStateChanged(mech, 'compact'); }
  mechViews.compact = { mechId: mech._id, redraw: draw, setStatus: s => { msg.textContent = s; } };

  function draw() {
    grid.replaceChildren();
    let armorRem = 0, armorMax = 0, structRem = 0, structMax = 0, critsGone = 0;
    for (const loc of MECH_LOCS) {
      const card = document.createElement('div');
      card.className = 'loc-card';
      const h = document.createElement('h4'); h.textContent = loc.name; card.appendChild(h);

      const af = maxFront(loc), afd = Math.min(Number(st.armorFront[loc.code]) || 0, af);
      armorMax += af; armorRem += af - afd;
      const l1 = document.createElement('div'); l1.className = 'row-label'; l1.textContent = `Armor ${af - afd}/${af}`;
      card.append(l1, pipTrack(af, afd, '', v => { st.armorFront[loc.code] = v; change(); }));

      if (loc.rear) {
        const ar = maxRear(loc), ard = Math.min(Number(st.armorRear[loc.code]) || 0, ar);
        armorMax += ar; armorRem += ar - ard;
        const l2 = document.createElement('div'); l2.className = 'row-label'; l2.textContent = `Rear ${ar - ard}/${ar}`;
        card.append(l2, pipTrack(ar, ard, 'rear', v => { st.armorRear[loc.code] = v; change(); }));
      }

      const sm = maxStruct(loc), smd = Math.min(Number(st.structure[loc.code]) || 0, sm);
      structMax += sm; structRem += sm - smd;
      const l3 = document.createElement('div'); l3.className = 'row-label'; l3.textContent = `Structure ${sm - smd}/${sm}`;
      card.append(l3, pipTrack(sm, smd, 'struct', v => { st.structure[loc.code] = v; change(); }));

      const slots = (design.criticalSlots && design.criticalSlots[loc.code]) || [];
      if (slots.some(s => s && String(s).trim())) {
        const lc = document.createElement('div'); lc.className = 'row-label'; lc.textContent = 'Criticals';
        card.append(lc, critList(loc.code));
      }
      critsGone += (st.crits[loc.code] || []).length;
      grid.appendChild(card);
    }
    status.textContent = `Armor ${armorRem}/${armorMax} \u00b7 Structure ${structRem}/${structMax} \u00b7 ${critsGone} critical${critsGone === 1 ? '' : 's'} destroyed`;
  }

  repairBtn.addEventListener('click', () => {
    st.armorFront = {}; st.armorRear = {}; st.structure = {}; st.crits = {}; st.heat = 0;
    change();
  });

  draw();
}

async function loadSummary() {
  try {
    const [f, company] = await Promise.all([
      fetch('/api/finances/summary').then(r => r.ok ? r.json() : null),
      fetch('/api/company').then(r => r.ok ? r.json() : []),
    ]);
    const co = (company && company[0]) || {};
    const parts = [];
    if (f) parts.push(`Balance: ${money(f.balance)}`, `Monthly payroll: ${money(f.monthlyPayroll)}`);
    els.summary.textContent = parts.join('  \u00b7  ');
    if (NAV.titleFromCompany && co.name) {
      const h1 = document.querySelector('.topbar h1');
      if (h1) h1.textContent = co.name;
      document.title = co.name + ' \u2014 Mercenary Manager';
    }
    const badge = document.getElementById('company-badge');
    if (badge) {
      const show = !!(co.insignia || co.color);
      badge.hidden = !show;
      if (show) {
        badge.textContent = co.insignia || '';
        if (co.color) badge.style.background = co.color;
      }
    }
  } catch { /* summary is best-effort */ }
}

let searchTimer = null;
els.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyView, 150);
});

// ---- Record sheet (design detail), modeled on the workspace's *_RecordSheet.html ----
const sheetModal = document.getElementById('sheet-modal');
const sheetBody = document.getElementById('sheet-body');
document.getElementById('sheet-close').addEventListener('click', closeSheet);
sheetModal.querySelector('.modal-backdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheetModal.hidden) closeSheet(); });

function closeSheet() {
  sheetModal.hidden = true;
  sheetBody.replaceChildren();
  mechViews.sheet = null;
}

async function openDesignSheet(design) {
  const weapons = await fetchCollection(COLLECTIONS.find(c => c.id === 'weapon'));
  const map = new Map();
  for (const w of weapons) map.set(`${w.techBase}|${w.name.toLowerCase()}`, w);
  sheetBody.replaceChildren(renderRecordSheet(design, map));
  sheetModal.hidden = false;
}

// Open the Lexicon-style record sheet for an owned 'Mech, wired for live battle damage tracking.
async function openBattleSheet(mech) {
  let design = mech.design || null;
  if (!design && mech.designId) {
    design = await fetch(`/api/${mech.designId.replace(':', '/')}`).then(r => r.ok ? r.json() : null).catch(() => null);
  }
  if (!design) { window.alert('This \u2019Mech has no linked design to build a record sheet from.'); return; }
  const weapons = await fetchCollection(COLLECTIONS.find(c => c.id === 'weapon'));
  const map = new Map();
  for (const w of weapons) map.set(`${w.techBase}|${w.name.toLowerCase()}`, w);

  const sheet = renderRecordSheet(design, map);
  const battle = bindBattleSheet(sheet, mech);

  const bar = document.createElement('div');
  bar.className = 'battle-bar';
  const label = document.createElement('strong');
  label.textContent = `Battle tracking \u2014 ${mech.chassis || design.class} ${mech.variant || design.model}`;
  const repair = document.createElement('button');
  repair.className = 'btn ghost small';
  repair.textContent = 'Full repair';
  repair.addEventListener('click', () => battle.fullRepair());
  const saveStatus = document.createElement('span');
  saveStatus.className = 'battle-save';
  battle.onStatus = s => { saveStatus.textContent = s; };
  bar.append(label, repair, saveStatus);

  sheetBody.replaceChildren(bar, sheet);
  sheetModal.hidden = false;
}

// Overlay the mech's stored damage onto a rendered record sheet and make it clickable.
function bindBattleSheet(sheetEl, mech) {
  const st = ensureMechState(mech);
  const BUCKET = { front: 'armorFront', rear: 'armorRear', struct: 'structure' };
  const api = { st, onStatus: () => {} };

  const pipEls = [...sheetEl.querySelectorAll('.silhouette .pip[data-loc]')];
  const groups = new Map();
  for (const pip of pipEls) {
    const key = `${pip.dataset.loc}|${pip.dataset.kind}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pip);
    pip.style.cursor = 'pointer';
  }
  for (const list of groups.values()) list.sort((a, b) => Number(a.dataset.idx) - Number(b.dataset.idx));

  function applyPips() {
    for (const [key, list] of groups) {
      const [loc, kind] = key.split('|');
      const dmg = Number(st[BUCKET[kind]][loc]) || 0;
      list.forEach((pip, i) => pip.classList.toggle('gone', i < dmg));
    }
  }
  function applyCrits() {
    for (const li of sheetEl.querySelectorAll('.crit li[data-loc]')) {
      const arr = st.crits[li.dataset.loc] || [];
      li.classList.toggle('destroyed', arr.includes(Number(li.dataset.idx)));
    }
    applyWeaponHits();
  }
  // A weapon whose critical slot is destroyed is struck out in the inventory table.
  function applyWeaponHits() {
    const hit = new Set();
    for (const li of sheetEl.querySelectorAll('.crit li.weapon.destroyed')) hit.add(li.textContent.trim().toLowerCase());
    for (const tr of sheetEl.querySelectorAll('.weapons tbody tr[data-weapon]')) {
      tr.classList.toggle('hit', hit.has(tr.dataset.weapon.trim().toLowerCase()));
    }
  }
  function applyHeat() {
    for (const cell of sheetEl.querySelectorAll('.heatscale [data-h]')) {
      const h = Number(cell.dataset.h);
      cell.classList.toggle('filled', h > 0 && h <= st.heat);
      cell.classList.toggle('cur', h === st.heat && h > 0);
    }
  }

  function redraw() { applyPips(); applyCrits(); applyHeat(); }
  function change() { mechStateChanged(mech, 'sheet'); }
  mechViews.sheet = { mechId: mech._id, redraw, setStatus: s => api.onStatus(s) };

  for (const pip of pipEls) {
    pip.addEventListener('click', () => {
      const loc = pip.dataset.loc, bucket = BUCKET[pip.dataset.kind], idx = Number(pip.dataset.idx);
      const cur = Number(st[bucket][loc]) || 0;
      st[bucket][loc] = idx < cur ? idx : idx + 1;
      applyPips(); change();
    });
  }
  for (const li of sheetEl.querySelectorAll('.crit li[data-loc]:not(.empty)')) {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      const loc = li.dataset.loc, idx = Number(li.dataset.idx);
      const arr = st.crits[loc] || (st.crits[loc] = []);
      const at = arr.indexOf(idx);
      if (at >= 0) arr.splice(at, 1); else arr.push(idx);
      applyCrits(); change();
    });
  }
  for (const cell of sheetEl.querySelectorAll('.heatscale [data-h]')) {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      const h = Number(cell.dataset.h);
      st.heat = st.heat === h ? 0 : h;
      applyHeat(); change();
    });
  }

  api.fullRepair = () => {
    st.armorFront = {}; st.armorRear = {}; st.structure = {}; st.crits = {}; st.heat = 0;
    redraw(); change();
  };

  redraw();
  return api;
}

function pips(n, cls, loc, kind) {
  let s = '';
  for (let i = 0; i < (n || 0); i++) {
    const data = loc ? ` data-loc="${loc}" data-kind="${kind}" data-idx="${i}"` : '';
    s += `<i class="pip ${cls}"${data}></i>`;
  }
  return s;
}
function locBox(code, name, front, rear, struct) {
  const up = code.toUpperCase();
  let html = `<div class="loc ${code}"><div class="lname">${esc(name)}</div>`;
  html += `<div class="pips">${pips(front, '', up, 'front')}</div>`;
  if (rear > 0) html += `<div class="sub">Rear</div><div class="pips">${pips(rear, 'rear', up, 'rear')}</div>`;
  html += `<div class="sub">Structure ${struct}</div><div class="pips">${pips(struct, 'struct', up, 'struct')}</div></div>`;
  return html;
}
function stripTag(s) {
  return String(s).replace(/\s*\([WE][A-Z0-9]+\)$/, '').trim();
}

function renderRecordSheet(d, weaponMap) {
  const A = d.armor || {}, S = d.structure || {}, M = d.movement || {}, HS = d.heatSinks || {};
  const tech = /^cl/i.test(d.techBase) ? 'Clan' : 'IS';
  const techLabel = tech === 'Clan' ? 'Clan' : 'Inner Sphere';
  const slotsFlat = Object.values(d.criticalSlots || {}).flat();
  const structureType = slotsFlat.some(s => /endo steel/i.test(s)) ? 'Endo Steel' : 'Standard';
  const armorType = slotsFlat.some(s => /ferro/i.test(s)) ? 'Ferro-Fibrous' : 'Standard';
  const totalHS = (HS.internal || 0) + (HS.external || 0);
  const dissipation = totalHS * (/double/i.test(HS.type || '') ? 2 : 1);

  const locList = [
    ['hd', 'Head', A.head, 0, S.head],
    ['la', 'Left Arm', A.arm, 0, S.arm],
    ['lt', 'Left Torso', A.sideTorso, A.rearSide, S.sideTorso],
    ['ct', 'Center Torso', A.centerTorso, A.rearCenter, S.centerTorso],
    ['rt', 'Right Torso', A.sideTorso, A.rearSide, S.sideTorso],
    ['ra', 'Right Arm', A.arm, 0, S.arm],
    ['ll', 'Left Leg', A.leg, 0, S.leg],
    ['rl', 'Right Leg', A.leg, 0, S.leg],
  ];
  const silHtml = locList.map(l => locBox(...l)).join('') + '<div class="ct2"></div>';

  const locByName = new Map();
  for (const [code, slots] of Object.entries(d.criticalSlots || {})) {
    for (const raw of slots) {
      if (!raw) continue;
      const name = stripTag(raw);
      if (!locByName.has(name)) locByName.set(name, new Set());
      locByName.get(name).add(code);
    }
  }
  let weaponRows = '';
  for (const item of (d.loadout || [])) {
    if (/^heat sink$/i.test(item.name)) continue;
    const w = weaponMap.get(`${tech}|${item.name.toLowerCase()}`);
    const loc = locByName.has(item.name) ? [...locByName.get(item.name)].join(', ') : '';
    const r = w && w.range ? w.range : null;
    const dmg = w ? (w.missile ? `${w.attacks}\u00d7${w.damagePerAttack}` : w.damagePerAttack) : '\u2014';
    weaponRows += `<tr data-weapon="${esc(item.name)}"><td>${item.count}</td><td class="name">${esc(item.name)}</td><td>${esc(loc)}</td>` +
      `<td>${w ? w.heat : '\u2014'}</td><td>${dmg}</td>` +
      `<td>${r ? (r.min || '\u2014') : '\u2014'}</td><td>${r ? r.short : '\u2014'}</td>` +
      `<td>${r ? r.medium : '\u2014'}</td><td>${r ? r.long : '\u2014'}</td></tr>`;
  }
  if (!weaponRows) weaponRows = '<tr><td colspan="9">No weapons mounted.</td></tr>';

  const LOC_NAMES = { HD: 'Head', CT: 'Center Torso', RT: 'Right Torso', LT: 'Left Torso', RA: 'Right Arm', LA: 'Left Arm', RL: 'Right Leg', LL: 'Left Leg' };
  let critsHtml = '';
  for (const code of ['HD', 'CT', 'RT', 'LT', 'RA', 'LA', 'RL', 'LL']) {
    const slots = (d.criticalSlots || {})[code] || [];
    let items = '';
    slots.forEach((raw, idx) => {
      if (!raw) { items += `<li class="empty" data-loc="${code}" data-idx="${idx}">Roll Again</li>`; return; }
      const tagged = /\([WE][A-Z0-9]+\)$/.test(raw);
      const name = stripTag(raw);
      const cls = /endo steel|ferro/i.test(name) ? 'struct' : (tagged ? 'weapon' : 'fixed');
      items += `<li class="${cls}" data-loc="${code}" data-idx="${idx}">${esc(name)}</li>`;
    });
    critsHtml += `<div class="crit"><h3><span>${esc(LOC_NAMES[code])}</span><span>${slots.length} slots</span></h3><ol>${items}</ol></div>`;
  }

  let heatHtml = '';
  for (let h = 0; h <= 30; h++) {
    const cls = h >= 28 ? 'crit' : h >= 22 ? 'bad' : h >= 14 ? 'warn' : '';
    heatHtml += `<div class="${cls}" data-h="${h}">${h}</div>`;
  }

  const el = document.createElement('div');
  el.className = 'sheet';
  el.innerHTML = `
    <h1>${esc(d.class)} <small>${esc(d.model)} &bull; ${esc(d.tonnage)} Tons &bull; ${techLabel} &bull; ${esc(d.weightClass)} 'Mech</small></h1>
    <div class="topgrid">
      <div class="box">
        <h2>'Mech Data</h2>
        <div class="kv"><span>Tonnage</span><span>${esc(d.tonnage)}</span></div>
        <div class="kv"><span>Engine</span><span>${esc(d.engine ? d.engine.rating : '')} Fusion (${esc(d.engine ? d.engine.type : '')})</span></div>
        <div class="kv"><span>Walking / Running</span><span>${esc(M.walk)} / ${esc(M.run)}</span></div>
        <div class="kv"><span>Jump</span><span>${esc(M.jump)}</span></div>
        <div class="kv"><span>Structure</span><span>${structureType}</span></div>
        <div class="kv"><span>Armor</span><span>${armorType}</span></div>
        <div class="kv"><span>Heat Sinks</span><span>${totalHS} (${esc(HS.type || '')})</span></div>
        <div class="kv"><span>Tech Base</span><span>${techLabel}</span></div>
      </div>
      <div class="box movement">
        <h2>Movement</h2>
        <div class="mv">
          <div><b>${esc(M.walk)}</b><small>Walk</small></div>
          <div><b>${esc(M.run)}</b><small>Run</small></div>
          <div><b>${esc(M.jump)}</b><small>Jump</small></div>
        </div>
        <div class="kv" style="margin-top:8px"><span>Heat Dissipation</span><span>${dissipation} / turn</span></div>
      </div>
      <div class="box">
        <h2>Warrior</h2>
        <div class="kv"><span>Name</span><span>________</span></div>
        <div class="kv"><span>Gunnery</span><span>____</span></div>
        <div class="kv"><span>Piloting</span><span>____</span></div>
        <div class="kv"><span>Hits Taken</span><span>&#9634;&#9634;&#9634;&#9634;&#9634;&#9634;</span></div>
      </div>
    </div>

    <div class="section-title">Weapons &amp; Equipment Inventory</div>
    <table class="weapons">
      <thead><tr><th>Qty</th><th>Weapon</th><th>Loc</th><th>Ht</th><th>Dmg</th><th>Min</th><th>Sht</th><th>Med</th><th>Lng</th></tr></thead>
      <tbody>${weaponRows}</tbody>
    </table>

    <div class="midgrid">
      <div>
        <div class="section-title">Armor &amp; Structure Diagram</div>
        <div class="silhouette">${silHtml}</div>
        <div class="legend">
          <span><i class="pip"></i> Armor (front)</span>
          <span><i class="pip rear"></i> Armor (rear)</span>
          <span><i class="pip struct"></i> Internal Structure</span>
        </div>
      </div>
      <div>
        <div class="section-title">Critical Hit Table</div>
        <div class="crits">${critsHtml}</div>
      </div>
    </div>

    <div class="heat">
      <div class="section-title">Heat Scale</div>
      <div class="heatscale">${heatHtml}</div>
    </div>

    <div class="foot">Generated from data/catalog/source/mechsheet.xls &middot; BiMechClasses row ${esc(d.model)}${(d.ammo && d.ammo.length) ? ' &middot; Ammo: ' + esc(d.ammo.join(', ')) : ''}</div>
  `;
  return el;
}

// ---- Work view (contracts + infrastructure advancements) ----
async function renderWorkView(container) {
  container.replaceChildren(hint('Loading\u2026'));
  const [contracts, advancements] = await Promise.all([
    fetch('/api/missions/available').then(r => r.json()).catch(() => []),
    fetch('/api/advancement').then(r => r.json()).catch(() => []),
  ]);
  container.replaceChildren(workContractsPanel(contracts), workAdvancementsPanel(advancements));
  const badge = els.nav.querySelector('[data-badge="work"]');
  if (badge) badge.textContent = contracts.length + advancements.length;
}

function travelLabel(t) {
  if (!t || !t.known) return 'Unknown';
  if (t.local) return 'Local (in-system)';
  return `${t.jumps} jump${t.jumps === 1 ? '' : 's'} \u00b7 ${t.distanceLy} LY`;
}

function mapHref(system, withRoute) {
  return `/map/?focus=${encodeURIComponent(system)}${withRoute ? '&route=1' : ''}`;
}
function mapLinkCell(system) {
  const cell = document.createElement('td');
  if (system) {
    const a = document.createElement('a');
    a.href = mapHref(system, true);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = system;
    a.addEventListener('click', e => e.stopPropagation()); // don't toggle the row
    cell.appendChild(a);
  }
  return cell;
}
function rewardsSummary(rewards) {
  if (!rewards || !rewards.length) return '';
  const parts = [];
  for (const r of rewards) {
    if (r.kind === 'bonus') { parts.push('+' + money(r.amount) + ' bonus'); continue; }
    const names = Array.isArray(r.items) ? r.items : (r.description ? [r.description] : []);
    if (!names.length) continue;
    parts.push((r.kind === 'mech' ? "'Mech: " : 'Item: ') + names.join(', '));
  }
  return parts.join('; ');
}
function buildContractDetail(c) {
  const wrap = document.createElement('div');
  wrap.className = 'contract-detail';
  const dl = document.createElement('dl');
  dl.className = 'kv';
  function add(term, value) {
    if (value === undefined || value === null || value === '') return;
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    if (value instanceof Node) dd.appendChild(value); else dd.textContent = value;
    dl.append(dt, dd);
  }
  add('Command rights', c.commandRights);
  add('Support', c.support);
  add('Transport', c.transport);
  add('Travel', c.travel && c.travel.known ? travelLabel(c.travel) : '');
  add('Objectives', c.objectives);
  if (c.rewards && c.rewards.length) {
    const ul = document.createElement('ul');
    ul.className = 'reward-summary-list';
    for (const r of c.rewards) {
      if (r.kind === 'bonus') {
        const li = document.createElement('li');
        li.textContent = `Bonus: ${money(r.amount)}`;
        ul.appendChild(li);
        continue;
      }
      const names = Array.isArray(r.items) ? r.items : (r.description ? [r.description] : []);
      const label = r.kind === 'mech' ? "'Mech" : 'Item';
      for (const n of names) {
        const li = document.createElement('li');
        li.textContent = `${label}: ${n}`;
        ul.appendChild(li);
      }
    }
    if (ul.childNodes.length) add('Rewards', ul);
  }
  add('Condition notes', c.conditionNotes);
  wrap.appendChild(dl);
  return wrap;
}

function workContractsPanel(contracts) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  const h = document.createElement('h2');
  h.textContent = 'Contracts';
  panel.appendChild(h);
  const home = (contracts.find(c => c.homeSystem) || {}).homeSystem;
  const loc = document.createElement('div');
  loc.className = 'summary-line';
  loc.append('Current location: ');
  if (home) {
    const a = document.createElement('a');
    a.href = mapHref(home, false);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = home;
    loc.append(a);
  } else {
    loc.append('unknown');
  }
  panel.appendChild(loc);
  if (!contracts.length) {
    panel.appendChild(hint('No missions available \u2014 the Game Master assigns these.'));
    return panel;
  }
  const table = document.createElement('table');
  table.className = 'data';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Employer</th><th>Type</th><th>Location</th><th>Travel</th><th>Length</th><th>Base pay</th><th>Salvage</th><th>Rewards</th><th>Status</th></tr>';
  const tbody = document.createElement('tbody');
  for (const c of contracts) {
    const tr = document.createElement('tr');
    tr.className = 'expandable';
    tr.append(td(c.employer), td(c.missionType), mapLinkCell(c.location));
    const travelCell = td(travelLabel(c.travel));
    travelCell.className = c.travel && c.travel.known ? (c.travel.local ? 'add' : 'jump') : '';
    tr.appendChild(travelCell);
    tr.append(
      td(c.lengthMonths ? `${c.lengthMonths} mo` : ''),
      td(money(c.basePay)), td((c.salvagePct ?? '') + '%'),
      td(rewardsSummary(c.rewards)),
    );
    const st = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status';
    badge.textContent = c.status || '\u2014';
    st.appendChild(badge);
    tr.appendChild(st);

    const detailTr = document.createElement('tr');
    detailTr.className = 'row-detail';
    detailTr.style.display = 'none';
    const dc = document.createElement('td');
    dc.colSpan = 9;
    dc.appendChild(buildContractDetail(c));
    detailTr.appendChild(dc);

    tr.addEventListener('click', () => {
      const hidden = detailTr.style.display === 'none';
      detailTr.style.display = hidden ? 'table-row' : 'none';
      tr.classList.toggle('expanded', hidden);
    });
    tbody.append(tr, detailTr);
  }
  table.append(thead, tbody);
  panel.appendChild(table);
  return panel;
}

function workAdvancementsPanel(advancements) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  const h = document.createElement('h2');
  h.textContent = 'Infrastructure & Advancements';
  panel.appendChild(h);
  if (!advancements.length) {
    panel.appendChild(hint('No advancements defined.'));
    return panel;
  }
  const groups = new Map();
  for (const a of advancements) {
    if (!groups.has(a.category)) groups.set(a.category, []);
    groups.get(a.category).push(a);
  }
  for (const [category, items] of groups) {
    const gt = document.createElement('h3');
    gt.className = 'group-title';
    gt.textContent = category;
    panel.appendChild(gt);
    const grid = document.createElement('div');
    grid.className = 'adv-grid';
    for (const a of items) grid.appendChild(advCard(a));
    panel.appendChild(grid);
  }
  return panel;
}

function advCard(a) {
  const card = document.createElement('div');
  card.className = 'adv-card status-' + String(a.status || '').replace(/\s+/g, '-');
  const head = document.createElement('div');
  head.className = 'adv-head';
  const title = document.createElement('span');
  title.className = 'adv-title';
  title.textContent = a.name;
  const status = document.createElement('span');
  status.className = 'status';
  status.textContent = a.status || '\u2014';
  head.append(title, status);
  const desc = document.createElement('p');
  desc.className = 'adv-desc';
  desc.textContent = a.description || '';
  const cost = document.createElement('div');
  cost.className = 'adv-cost';
  cost.textContent = a.cost != null ? money(a.cost) : '';
  card.append(head, desc, cost);
  if (a.status === 'in-progress' && typeof a.progress === 'number') {
    const bar = document.createElement('div');
    bar.className = 'progress';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = a.progress + '%';
    bar.appendChild(fill);
    const label = document.createElement('div');
    label.className = 'progress-label';
    label.textContent = a.progress + '% complete';
    card.append(bar, label);
  }
  return card;
}

// ---- Owned inventory (weapons / equipment), grouped by name; each unit has a UUID ----
async function renderInventory(container, itemType) {
  container.replaceChildren(hint('Loading\u2026'));
  const all = await fetch('/api/item').then(r => r.json()).catch(() => []);
  const items = all.filter(i => i.itemType === itemType);
  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.name)) groups.set(it.name, []);
    groups.get(it.name).push(it);
  }
  const badge = els.nav.querySelector(`[data-badge="owned${itemType === 'weapon' ? 'Weapons' : 'Equipment'}"]`);
  if (badge) badge.textContent = items.length;

  container.replaceChildren();
  const panel = document.createElement('div');
  panel.className = 'panel';
  const h = document.createElement('h2');
  h.textContent = itemType === 'weapon' ? 'Owned Weapons' : 'Owned Equipment';
  panel.appendChild(h);
  if (!groups.size) {
    panel.appendChild(hint('None owned.'));
    container.appendChild(panel);
    return;
  }
  const table = document.createElement('table');
  table.className = 'data';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Item</th><th>Count</th><th>Item numbers</th></tr>';
  const tbody = document.createElement('tbody');
  for (const name of [...groups.keys()].sort()) {
    const list = groups.get(name);
    const tr = document.createElement('tr');
    tr.append(td(name), td(list.length));
    const idsCell = document.createElement('td');
    const toggle = document.createElement('button');
    toggle.className = 'btn ghost small';
    toggle.textContent = 'show';
    idsCell.appendChild(toggle);
    tr.appendChild(idsCell);

    const detailTr = document.createElement('tr');
    detailTr.className = 'group-detail';
    detailTr.style.display = 'none';
    const dc = document.createElement('td');
    dc.colSpan = 3;
    const ul = document.createElement('ul');
    ul.className = 'uuid-list';
    for (const it of list) {
      const li = document.createElement('li');
      li.textContent = it._id.replace(/^item:/, '');
      ul.appendChild(li);
    }
    dc.appendChild(ul);
    detailTr.appendChild(dc);
    toggle.addEventListener('click', () => {
      const hidden = detailTr.style.display === 'none';
      detailTr.style.display = hidden ? 'table-row' : 'none';
      toggle.textContent = hidden ? 'hide' : 'show';
    });
    tbody.append(tr, detailTr);
  }
  table.append(thead, tbody);
  panel.appendChild(table);
  container.appendChild(panel);
}

// ---- Finances ledger with running balance and coloured adds / subtracts ----
async function renderLedgerView(container) {
  container.replaceChildren(hint('Loading\u2026'));
  const [txns, summary] = await Promise.all([
    fetch('/api/txn').then(r => r.json()).catch(() => []),
    fetch('/api/finances/summary').then(r => r.json()).catch(() => ({})),
  ]);
  txns.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a._id || '').localeCompare(b._id || ''));
  const badge = els.nav.querySelector('[data-badge="txn"]');
  if (badge) badge.textContent = txns.length;

  container.replaceChildren();
  const panel = document.createElement('div');
  panel.className = 'panel';
  const h = document.createElement('h2');
  h.textContent = 'Finances Ledger';
  panel.appendChild(h);
  const bal = document.createElement('div');
  bal.className = 'summary-line';
  bal.textContent = `Balance: ${money(summary.balance)}  \u00b7  Income: ${money(summary.income)}  \u00b7  Expenses: ${money(summary.expenses)}  \u00b7  Monthly payroll: ${money(summary.monthlyPayroll)}`;
  panel.appendChild(bal);

  const table = document.createElement('table');
  table.className = 'data';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Category</th><th>Description</th><th class="right">Change</th><th class="right">Balance</th></tr>';
  const tbody = document.createElement('tbody');
  let running = 0;
  for (const t of txns) {
    const amount = t.amount || 0;
    running += amount;
    const tr = document.createElement('tr');
    tr.append(td(t.date), td(t.category), td(t.description));
    const amt = document.createElement('td');
    amt.className = 'right ' + (amount >= 0 ? 'add' : 'sub');
    amt.textContent = (amount >= 0 ? '+' : '') + money(amount);
    tr.appendChild(amt);
    const run = document.createElement('td');
    run.className = 'right';
    run.textContent = money(running);
    tr.appendChild(run);
    tbody.appendChild(tr);
  }
  table.append(thead, tbody);
  panel.appendChild(table);
  container.appendChild(panel);
}

buildNav();
loadSummary();
selectCollection(NAV.default || (ACTIVE[0] && ACTIVE[0].id) || 'design');
startEventStream();
