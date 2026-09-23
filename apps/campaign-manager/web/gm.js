'use strict';

// Game Master page: manage the mercenary company (finances, pilot assignment) and
// author missions/contracts. Uses the same generic document API as the navigator.

const money = n => (n ?? 0).toLocaleString('en-US') + ' C-Bills';

async function api(method, url, body) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const res = await fetch(url, opt);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.status === 204 ? null : res.json();
}
const get = url => api('GET', url);

function td(text) {
  const cell = document.createElement('td');
  cell.textContent = text === null || text === undefined ? '' : String(text);
  return cell;
}

// ---- Panel switching ----
const gmNav = document.getElementById('gm-nav');
gmNav.addEventListener('click', e => {
  const btn = e.target.closest('button[data-panel]');
  if (!btn) return;
  for (const b of gmNav.children) b.classList.toggle('active', b === btn);
  for (const s of document.querySelectorAll('.gm-section')) {
    s.classList.toggle('active', s.id === `panel-${btn.dataset.panel}`);
  }
});

// ---- Team panel ----
let pilots = [];
let designList = [];
let itemCatalog = [];

async function loadTeam() {
  const [fin, mechs, ps, company] = await Promise.all([
    get('/api/finances/summary'), get('/api/mech'), get('/api/pilot'), get('/api/company'),
  ]);
  pilots = ps;
  const co = company[0];
  document.getElementById('gm-status').textContent =
    (co ? `${co.name}  \u00b7  ` : '') + `Balance ${money(fin.balance)}`;
  document.getElementById('finances-summary').textContent =
    `Balance: ${money(fin.balance)}  \u00b7  Income: ${money(fin.income)}  \u00b7  ` +
    `Expenses: ${money(fin.expenses)}  \u00b7  Monthly payroll: ${money(fin.monthlyPayroll)}  \u00b7  ${fin.entries} entries`;

  const stbody = document.querySelector('#stable-table tbody');
  stbody.replaceChildren();
  for (const m of mechs) {
    const tr = document.createElement('tr');
    tr.append(td(m.variant), td(m.chassis), td(m.tons), td(m.condition));
    const pcell = document.createElement('td');
    const sel = document.createElement('select');
    const none = document.createElement('option');
    none.value = ''; none.textContent = '\u2014 unassigned \u2014';
    sel.appendChild(none);
    for (const p of pilots) {
      const o = document.createElement('option');
      o.value = p._id;
      o.textContent = `${p.callsign} (${p.gunnery}/${p.piloting})`;
      if (m.pilotId === p._id) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', async () => {
      const slug = m._id.replace(/^mech:/, '');
      const clean = { ...m };
      delete clean.pilot; // strip the /api/stable join field
      clean.pilotId = sel.value || null;
      await api('PUT', `/api/mech/${slug}`, clean);
      await loadTeam();
    });
    pcell.appendChild(sel);
    tr.appendChild(pcell);
    stbody.appendChild(tr);
  }

  const mechByPilot = new Map();
  for (const m of mechs) if (m.pilotId) mechByPilot.set(m.pilotId, m.variant);
  const pbody = document.querySelector('#pilots-table tbody');
  pbody.replaceChildren();
  for (const p of pilots) {
    const tr = document.createElement('tr');
    tr.append(
      td(p.callsign), td(`${p.gunnery}/${p.piloting}`), td(p.rating),
      td(mechByPilot.get(p._id) || '\u2014'), td(money(p.salary)),
    );
    pbody.appendChild(tr);
  }
}

document.getElementById('txn-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  await api('POST', '/api/txn', {
    date: f.date.value,
    category: f.category.value || 'misc',
    description: f.description.value,
    amount: Number(f.amount.value) || 0,
  });
  f.reset();
  await loadTeam();
});

// ---- Missions panel ----
async function loadMissions() {
  const list = await get('/api/contract');
  const tbody = document.querySelector('#missions-table tbody');
  tbody.replaceChildren();
  for (const c of list) {
    const tr = document.createElement('tr');
    tr.append(
      td(c.employer), td(c.missionType), td(c.location),
      td(c.lengthMonths ? `${c.lengthMonths} mo` : ''),
      td(money(c.basePay)), td((c.salvagePct ?? '') + '%'),
    );
    const stCell = document.createElement('td');
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'status status-btn';
    badge.textContent = c.status || 'Negotiating';
    badge.title = 'Click to negotiate / edit this contract';
    badge.addEventListener('click', () => openMissionEditor(c));
    stCell.appendChild(badge);
    tr.appendChild(stCell);

    const visCell = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = !!c.visibleToMerc;
    chk.title = 'Visible to the mercenary team';
    chk.addEventListener('change', async () => {
      await api('PUT', `/api/contract/${c._id.replace(/^contract:/, '')}`, { ...c, visibleToMerc: chk.checked });
    });
    visCell.appendChild(chk);
    tr.appendChild(visCell);

    const actCell = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      await api('DELETE', `/api/contract/${c._id.replace(/^contract:/, '')}`);
      await loadMissions();
    });
    actCell.appendChild(del);
    tr.appendChild(actCell);
    tbody.appendChild(tr);
  }
  if (!list.length) {
    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.className = 'hint';
    cell.textContent = 'No missions yet. Create one above.';
    tr.appendChild(cell);
    tbody.appendChild(tr);
  }
}

// Near-system options carry a " (N jumps)" suffix for display; strip it before saving.
const stripJumps = v => String(v || '').replace(/\s*\((?:here|\d+\s*jumps?)\)\s*$/i, '').trim();

document.getElementById('mission-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  await api('POST', '/api/contract', {
    employer: f.employer.value,
    missionType: f.missionType.value,
    location: stripJumps(f.location.value),
    lengthMonths: Number(f.lengthMonths.value) || null,
    basePay: Number(f.basePay.value) || 0,
    salvagePct: Number(f.salvagePct.value) || 0,
    commandRights: f.commandRights.value,
    support: f.support.value,
    transport: f.transport.value,
    objectives: f.objectives.value,
    visibleToMerc: f.visibleToMerc.checked,
    status: 'Negotiating',
  });
  f.reset();
  await loadMissions();
});

async function loadRefData() {
  const [types, employers, transports, designs, items] = await Promise.all([
    get('/api/missionType'), get('/api/employer'), get('/api/transportOption'),
    get('/api/designs/list'), get('/api/items/catalog'),
  ]);
  designList = designs;
  itemCatalog = items;
  fillSelect(document.getElementById('missiontype-select'), types.map(t => t.name));
  fillSelect(document.getElementById('employer-select'), employers.map(e => e.name));
  fillSelect(document.getElementById('transport-select'), transports.map(t => t.name));
}
function fillSelect(sel, values) {
  if (!sel) return;
  sel.replaceChildren();
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  }
}

async function loadTime() {
  const clock = await get('/api/time');
  document.getElementById('time-current').textContent =
    `Current date: ${clock.year}-${String(clock.month).padStart(2, '0')}  \u00b7  Turn ${clock.turn ?? 0}`;
}
document.getElementById('advance-time').addEventListener('click', async () => {
  const result = await api('POST', '/api/time/advance');
  const log = document.getElementById('time-log');
  log.replaceChildren();
  const head = document.createElement('div');
  head.className = 'summary-line';
  head.textContent = `Advanced to ${result.date} (turn ${result.turn}). New balance: ${money(result.balance)}.`;
  log.appendChild(head);
  const ul = document.createElement('ul');
  for (const t of result.posted) {
    const li = document.createElement('li');
    li.className = t.amount >= 0 ? 'add' : 'sub';
    li.textContent = `${t.amount >= 0 ? '+' : ''}${money(t.amount)} \u2014 ${t.description}`;
    ul.appendChild(li);
  }
  if (!result.posted.length) {
    const li = document.createElement('li');
    li.textContent = 'No adjustments this month.';
    ul.appendChild(li);
  }
  log.appendChild(ul);
  await loadTime();
  await loadTeam();
});

async function loadLocation() {
  const [loc, picker] = await Promise.all([get('/api/location'), get('/api/systems/picker')]);
  const sys = loc.system;
  document.getElementById('location-current').textContent = loc.currentSystem
    ? `${loc.currentSystem}${sys ? `  \u00b7  ${sys.affiliation}  \u00b7  (${sys.x}, ${sys.y})` : '  \u00b7  unknown system'}`
    : 'No location set.';
  const dl = document.getElementById('systems-datalist');
  dl.replaceChildren();
  const addOption = n => { const o = document.createElement('option'); o.value = n; dl.appendChild(o); };
  const fmtJumps = j => (j === 0 ? 'here' : `${j} jump${j === 1 ? '' : 's'}`);
  for (const s of (picker.near || [])) addOption(`${s.name} (${fmtJumps(s.jumps)})`);
  if ((picker.near || []).length && (picker.rest || []).length) addOption('##############################');
  for (const n of (picker.rest || [])) addOption(n);
}
document.getElementById('location-form').addEventListener('submit', async e => {
  e.preventDefault();
  await api('POST', '/api/location', { system: stripJumps(e.target.system.value) });
  await loadLocation();
});

// Fill the mission location when a system is picked on the map (set via localStorage there).
window.addEventListener('storage', function (e) {
  if (e.key === 'missionPickSystem' && e.newValue) {
    const loc = document.querySelector('#mission-form [name="location"]');
    if (loc) loc.value = e.newValue.split('|')[0];
  }
});

// ---- Contract negotiation modal ----
let editingContract = null;

function openMissionEditor(c) {
  editingContract = c;
  const f = document.getElementById('mission-edit-form');
  document.getElementById('mission-modal-title').textContent = `Negotiate \u2014 ${c.missionType} (${c.employer})`;
  f.status.value = c.status || 'Negotiating';
  f.basePay.value = c.basePay != null ? c.basePay : 0;
  f.salvagePct.value = c.salvagePct != null ? c.salvagePct : 0;
  f.conditionNotes.value = c.conditionNotes || '';
  const list = document.getElementById('rewards-list');
  list.replaceChildren();
  (c.rewards || []).forEach(addRewardRow);
  document.getElementById('mission-modal').hidden = false;
}

function closeMissionEditor() {
  document.getElementById('mission-modal').hidden = true;
  editingContract = null;
}

function addRewardRow(reward) {
  reward = reward || { kind: 'bonus' };
  const row = document.createElement('div');
  row.className = 'reward-row';
  const kind = document.createElement('select');
  kind.className = 'reward-kind';
  [['mech', "'Mech"], ['equipment', 'Item'], ['bonus', 'Bonus']].forEach(function (k) {
    const o = document.createElement('option');
    o.value = k[0];
    o.textContent = k[1];
    kind.appendChild(o);
  });
  kind.value = reward.kind || 'bonus';

  const control = document.createElement('div');
  control.className = 'reward-control';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'btn danger small';
  remove.textContent = '\u00d7';
  remove.addEventListener('click', () => row.remove());

  function buildControl() {
    control.replaceChildren();
    if (kind.value === 'bonus') {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'reward-amount';
      inp.placeholder = 'C-Bills';
      inp.value = reward.amount != null ? reward.amount : '';
      control.appendChild(inp);
      return;
    }
    const catalog = kind.value === 'mech'
      ? designList.map(function (d) { return { value: d.model, label: d.model + ' \u2014 ' + d.class + (d.tons ? ' (' + d.tons + 't)' : '') }; })
      : itemCatalog.map(function (i) { return { value: i.name, label: i.name + ' (' + i.itemType + ')' }; });
    const byValue = new Map(catalog.map(function (o) { return [o.value, o.label]; }));
    const selected = new Set(Array.isArray(reward.items) ? reward.items : (reward.description ? [reward.description] : []));

    const picker = document.createElement('div');
    picker.className = 'reward-picker';
    const chips = document.createElement('div');
    chips.className = 'reward-chips';
    const filter = document.createElement('input');
    filter.type = 'search';
    filter.className = 'reward-filter';
    filter.placeholder = kind.value === 'mech' ? 'Filter designs\u2026' : 'Filter weapons & equipment\u2026';
    filter.autocomplete = 'off';
    const options = document.createElement('div');
    options.className = 'reward-options';
    picker.append(chips, filter, options);

    function renderChips() {
      chips.replaceChildren();
      selected.forEach(function (v) {
        const chip = document.createElement('span');
        chip.className = 'reward-chip';
        chip.dataset.value = v;
        const text = document.createElement('span');
        text.textContent = byValue.get(v) || v;
        const x = document.createElement('button');
        x.type = 'button';
        x.textContent = '\u00d7';
        x.addEventListener('click', function () { selected.delete(v); renderChips(); renderOptions(); });
        chip.append(text, x);
        chips.appendChild(chip);
      });
    }
    function renderOptions() {
      const q = filter.value.trim().toLowerCase();
      options.replaceChildren();
      let count = 0;
      for (const o of catalog) {
        if (selected.has(o.value)) continue;
        if (q && o.label.toLowerCase().indexOf(q) === -1) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'reward-option';
        btn.textContent = o.label;
        btn.addEventListener('click', function () { selected.add(o.value); renderChips(); renderOptions(); });
        options.appendChild(btn);
        if (++count >= 200) break;
      }
      if (!count) {
        const empty = document.createElement('div');
        empty.className = 'reward-option empty';
        empty.textContent = q ? 'No matches' : 'All selected';
        options.appendChild(empty);
      }
    }
    filter.addEventListener('input', renderOptions);
    renderChips();
    renderOptions();
    control.appendChild(picker);
  }
  kind.addEventListener('change', buildControl);
  buildControl();

  row.append(kind, control, remove);
  document.getElementById('rewards-list').appendChild(row);
}

document.getElementById('add-reward').addEventListener('click', () => addRewardRow());
document.getElementById('mission-close').addEventListener('click', closeMissionEditor);
document.querySelector('#mission-modal .modal-backdrop').addEventListener('click', closeMissionEditor);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('mission-modal').hidden) closeMissionEditor();
});
document.getElementById('mission-edit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const slug = editingContract._id.replace(/^contract:/, '');
  const wasAwarded = !!editingContract.awarded;
  const newStatus = f.status.value;
  const rewards = Array.prototype.map.call(document.querySelectorAll('#rewards-list .reward-row'), function (row) {
    const kind = row.querySelector('.reward-kind').value;
    if (kind === 'bonus') {
      const amt = row.querySelector('.reward-amount');
      return { kind: 'bonus', amount: Number(amt ? amt.value : 0) || 0 };
    }
    const items = Array.prototype.map.call(row.querySelectorAll('.reward-chip'), function (ch) { return ch.dataset.value; });
    return { kind: kind, items: items };
  }).filter(r => (r.kind === 'bonus' ? r.amount : (r.items && r.items.length)));
  await api('PUT', `/api/contract/${slug}`, Object.assign({}, editingContract, {
    basePay: Number(f.basePay.value) || 0,
    salvagePct: Number(f.salvagePct.value) || 0,
    status: newStatus,
    rewards: rewards,
    conditionNotes: f.conditionNotes.value,
  }));
  if (newStatus === 'Awarded' && !wasAwarded) {
    const result = await api('POST', `/api/contract/${slug}/award`);
    if (result && result.granted && result.granted.length) {
      const lines = result.granted.map(function (g) {
        return g.kind === 'bonus' ? `+${money(g.amount)} cash` : (g.kind === 'mech' ? `'Mech: ${g.name}` : `Equipment: ${g.name}`);
      });
      window.alert('Awarded to the team:\n' + lines.join('\n'));
    }
  }
  closeMissionEditor();
  await Promise.all([loadMissions(), loadTeam()]);
});

async function loadCompany() {
  const company = await get('/api/company');
  const co = company[0] || {};
  const f = document.getElementById('company-form');
  f.name.value = co.name || '';
  f.founded.value = co.founded || '';
  f.experience.value = (co.rating && co.rating.experience) || 'Regular';
  f.dragoon.value = (co.rating && co.rating.dragoon) || '';
  f.reputation.value = (co.rating && co.rating.reputation) != null ? co.rating.reputation : '';
  f.wins.value = (co.record && co.record.wins) != null ? co.record.wins : 0;
  f.losses.value = (co.record && co.record.losses) != null ? co.record.losses : 0;
  f.insignia.value = co.insignia || '';
  f.color.value = co.color || '#7a1f1f';
}
document.getElementById('company-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const company = (await get('/api/company'))[0] || { _id: 'company:main', type: 'company' };
  await api('PUT', '/api/company/main', Object.assign({}, company, {
    name: f.name.value,
    founded: f.founded.value || null,
    rating: Object.assign({}, company.rating, {
      dragoon: f.dragoon.value || null,
      experience: f.experience.value,
      reputation: f.reputation.value !== '' ? Number(f.reputation.value) : null,
    }),
    record: { wins: Number(f.wins.value) || 0, losses: Number(f.losses.value) || 0 },
    insignia: f.insignia.value || null,
    color: f.color.value,
  }));
  await Promise.all([loadCompany(), loadTeam()]);
});

loadRefData().catch(() => {});
loadCompany().catch(() => {});
loadLocation().catch(() => {});
loadTime().catch(() => {});
loadTeam().catch(err => { document.getElementById('gm-status').textContent = 'Error: ' + err.message; });
loadMissions().catch(() => {});
