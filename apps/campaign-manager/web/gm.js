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
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${res.status} on ${url}`);
  }
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
const selectedXpPilots = new Set();

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
    const selectCell = document.createElement('td');
    const selectPilot = document.createElement('input');
    selectPilot.type = 'checkbox';
    selectPilot.checked = selectedXpPilots.has(p._id);
    selectPilot.setAttribute('aria-label', `Select ${p.callsign} for bulk XP`);
    selectPilot.addEventListener('change', () => {
      if (selectPilot.checked) selectedXpPilots.add(p._id);
      else selectedXpPilots.delete(p._id);
      updateSelectAllPilots();
    });
    selectCell.appendChild(selectPilot);
    tr.append(
      selectCell,
      td(p.callsign), td(`${p.gunnery}/${p.piloting}`), td(p.rating),
      td(mechByPilot.get(p._id) || '\u2014'), td(money(p.salary)), td(p.xp || 0),
    );
    const xpCell = document.createElement('td');
    const xpForm = document.createElement('form');
    xpForm.className = 'xp-award';
    const operation = document.createElement('select');
    operation.setAttribute('aria-label', `XP operation for ${p.callsign}`);
    for (const [value, label] of [['add', 'Add'], ['remove', 'Remove'], ['set', 'Set']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      operation.appendChild(option);
    }
    const xpInput = document.createElement('input');
    xpInput.type = 'number';
    xpInput.min = '0';
    xpInput.max = '10000';
    xpInput.step = '1';
    xpInput.value = '5';
    xpInput.setAttribute('aria-label', `XP amount for ${p.callsign}`);
    const xpButton = document.createElement('button');
    xpButton.type = 'submit';
    xpButton.className = 'btn small';
    xpButton.textContent = 'Apply';
    xpForm.append(operation, xpInput, xpButton);
    xpForm.addEventListener('submit', async event => {
      event.preventDefault();
      xpButton.disabled = true;
      try {
        await api('POST', `/api/pilot/${p._id.replace(/^pilot:/, '')}/xp`, {
          operation: operation.value,
          amount: Number(xpInput.value),
        });
        await loadTeam();
      } catch (error) {
        window.alert(error.message);
        xpButton.disabled = false;
      }
    });
    xpCell.appendChild(xpForm);
    tr.appendChild(xpCell);
    pbody.appendChild(tr);
  }
  updateSelectAllPilots();
}

function updateSelectAllPilots() {
  const selectAll = document.getElementById('select-all-pilots');
  const selectedCount = pilots.filter(pilot => selectedXpPilots.has(pilot._id)).length;
  selectAll.checked = pilots.length > 0 && selectedCount === pilots.length;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < pilots.length;
}

document.getElementById('select-all-pilots').addEventListener('change', event => {
  selectedXpPilots.clear();
  if (event.currentTarget.checked) {
    for (const pilot of pilots) selectedXpPilots.add(pilot._id);
  }
  for (const checkbox of document.querySelectorAll('#pilots-table tbody input[type="checkbox"]')) {
    checkbox.checked = event.currentTarget.checked;
  }
  updateSelectAllPilots();
});

document.getElementById('bulk-xp-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const selectedAward = event.currentTarget.amount.selectedOptions[0];
    await api('POST', '/api/pilots/xp/add', {
      amount: Number(selectedAward.dataset.amount),
      contractId: selectedAward.dataset.contractId || null,
      pilotIds: [...selectedXpPilots],
    });
    await Promise.all([loadTeam(), loadMissions()]);
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

const resetXpButton = document.getElementById('reset-all-xp');
const resetXpConfirmation = document.getElementById('reset-xp-confirmation');
resetXpButton.addEventListener('click', () => {
  resetXpButton.hidden = true;
  resetXpConfirmation.hidden = false;
});
document.getElementById('cancel-reset-all-xp').addEventListener('click', () => {
  resetXpConfirmation.hidden = true;
  resetXpButton.hidden = false;
});
const confirmResetXpButton = document.getElementById('confirm-reset-all-xp');
confirmResetXpButton.addEventListener('click', async () => {
  confirmResetXpButton.disabled = true;
  try {
    await api('POST', '/api/pilots/xp/reset');
    resetXpConfirmation.hidden = true;
    resetXpButton.hidden = false;
    await loadTeam();
  } catch (error) {
    window.alert(error.message);
  } finally {
    confirmResetXpButton.disabled = false;
  }
});

// ---- Staff panel ----
let staffMembers = [];
const selectedXpStaff = new Set();
const staffForm = document.getElementById('staff-form');
const staffFormTitle = document.getElementById('staff-form-title');
const cancelStaffEditButton = document.getElementById('cancel-staff-edit');

function resetStaffForm() {
  staffForm.reset();
  staffForm.staffId.value = '';
  staffForm.tier.value = 'normal';
  staffForm.rating.value = '5';
  staffForm.monthlyCost.value = '500';
  staffForm.querySelector('button[type="submit"]').textContent = 'Add staff member';
  staffFormTitle.textContent = 'Add Staff Member';
  cancelStaffEditButton.hidden = true;
}

function beginStaffEdit(staff) {
  staffForm.staffId.value = staff._id.replace(/^staff:/, '');
  staffForm.name.value = staff.name || '';
  staffForm.staffType.value = staff.staffType;
  staffForm.tier.value = staff.tier;
  staffForm.rating.value = staff.rating;
  staffForm.monthlyCost.value = staff.monthlyCost;
  staffForm.querySelector('button[type="submit"]').textContent = 'Save staff member';
  staffFormTitle.textContent = `Edit ${staff.name}`;
  cancelStaffEditButton.hidden = false;
  staffForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSelectAllStaff() {
  const selectAll = document.getElementById('select-all-staff');
  const selectedCount = staffMembers.filter(staff => selectedXpStaff.has(staff._id)).length;
  selectAll.checked = staffMembers.length > 0 && selectedCount === staffMembers.length;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < staffMembers.length;
}

async function applyStaffXp(staff, operation, amount) {
  await api('POST', `/api/staff/${staff._id.replace(/^staff:/, '')}/xp`, {
    operation,
    amount,
  });
  await loadStaff();
}

async function loadStaff() {
  staffMembers = await get('/api/staff');
  const currentIds = new Set(staffMembers.map(staff => staff._id));
  for (const id of selectedXpStaff) {
    if (!currentIds.has(id)) selectedXpStaff.delete(id);
  }
  const tbody = document.querySelector('#staff-table tbody');
  tbody.replaceChildren();
  for (const staff of staffMembers) {
    const row = document.createElement('tr');
    const selectCell = document.createElement('td');
    const selectStaff = document.createElement('input');
    selectStaff.type = 'checkbox';
    selectStaff.checked = selectedXpStaff.has(staff._id);
    selectStaff.setAttribute('aria-label', `Select ${staff.name} for bulk XP`);
    selectStaff.addEventListener('change', () => {
      if (selectStaff.checked) selectedXpStaff.add(staff._id);
      else selectedXpStaff.delete(staff._id);
      updateSelectAllStaff();
    });
    selectCell.appendChild(selectStaff);

    const xpCell = document.createElement('td');
    const xpForm = document.createElement('form');
    xpForm.className = 'xp-award';
    const operation = document.createElement('select');
    operation.setAttribute('aria-label', `XP operation for ${staff.name}`);
    for (const [value, label] of [['add', 'Add'], ['remove', 'Remove'], ['set', 'Set']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      operation.appendChild(option);
    }
    const amount = document.createElement('input');
    amount.type = 'number';
    amount.min = '0';
    amount.max = '10000';
    amount.step = '1';
    amount.value = '5';
    amount.setAttribute('aria-label', `XP amount for ${staff.name}`);
    const apply = document.createElement('button');
    apply.type = 'submit';
    apply.className = 'btn small';
    apply.textContent = 'Apply';
    xpForm.append(operation, amount, apply);
    xpForm.addEventListener('submit', async event => {
      event.preventDefault();
      apply.disabled = true;
      try {
        await applyStaffXp(staff, operation.value, Number(amount.value));
      } catch (error) {
        window.alert(error.message);
        apply.disabled = false;
      }
    });
    xpCell.appendChild(xpForm);

    const actions = document.createElement('td');
    actions.className = 'table-actions';
    const skills = document.createElement('a');
    skills.className = 'btn small';
    skills.href = `/staff-skills?staff=${encodeURIComponent(staff._id.replace(/^staff:/, ''))}`;
    skills.textContent = 'Skills';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn ghost small';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => beginStaffEdit(staff));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn danger small';
    remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Delete ${staff.name}? This also removes their XP and purchased skills.`)) return;
      remove.disabled = true;
      try {
        await api('DELETE', `/api/staff/${staff._id.replace(/^staff:/, '')}`);
        if (staffForm.staffId.value === staff._id.replace(/^staff:/, '')) resetStaffForm();
        await Promise.all([loadStaff(), loadTeam()]);
      } catch (error) {
        window.alert(error.message);
        remove.disabled = false;
      }
    });
    actions.append(skills, edit, remove);

    row.append(
      selectCell,
      td(staff.name),
      td(staff.staffType),
      td(staff.tier),
      td(staff.rating),
      td(money(staff.monthlyCost)),
      td(staff.xp || 0),
      td(Array.isArray(staff.skills) ? staff.skills.length : 0),
      xpCell,
      actions,
    );
    tbody.appendChild(row);
  }
  updateSelectAllStaff();
}

staffForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = staffForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  const staffId = staffForm.staffId.value;
  try {
    const body = {
      name: staffForm.name.value,
      staffType: staffForm.staffType.value,
      tier: staffForm.tier.value,
      rating: Number(staffForm.rating.value),
      monthlyCost: Number(staffForm.monthlyCost.value),
    };
    await api(staffId ? 'PUT' : 'POST', staffId ? `/api/staff/${staffId}` : '/api/staff', body);
    resetStaffForm();
    await Promise.all([loadStaff(), loadTeam()]);
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

cancelStaffEditButton.addEventListener('click', resetStaffForm);

document.getElementById('select-all-staff').addEventListener('change', event => {
  selectedXpStaff.clear();
  if (event.currentTarget.checked) {
    for (const staff of staffMembers) selectedXpStaff.add(staff._id);
  }
  for (const checkbox of document.querySelectorAll('#staff-table tbody input[type="checkbox"]')) {
    checkbox.checked = event.currentTarget.checked;
  }
  updateSelectAllStaff();
});

document.getElementById('bulk-staff-xp-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await api('POST', '/api/staff/xp/add', {
      amount: Number(event.currentTarget.amount.value),
      staffIds: [...selectedXpStaff],
    });
    await loadStaff();
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

const resetStaffXpButton = document.getElementById('reset-all-staff-xp');
const resetStaffXpConfirmation = document.getElementById('reset-staff-xp-confirmation');
resetStaffXpButton.addEventListener('click', () => {
  resetStaffXpButton.hidden = true;
  resetStaffXpConfirmation.hidden = false;
});
document.getElementById('cancel-reset-all-staff-xp').addEventListener('click', () => {
  resetStaffXpConfirmation.hidden = true;
  resetStaffXpButton.hidden = false;
});
const confirmResetStaffXpButton = document.getElementById('confirm-reset-all-staff-xp');
confirmResetStaffXpButton.addEventListener('click', async () => {
  confirmResetStaffXpButton.disabled = true;
  try {
    await api('POST', '/api/staff/xp/reset');
    resetStaffXpConfirmation.hidden = true;
    resetStaffXpButton.hidden = false;
    await loadStaff();
  } catch (error) {
    window.alert(error.message);
  } finally {
    confirmResetStaffXpButton.disabled = false;
  }
});

async function loadPerks() {
  const perks = await get('/api/pilot-perks');
  const prerequisite = document.getElementById('perk-prerequisite');
  const selected = prerequisite.value;
  prerequisite.replaceChildren();
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'None';
  prerequisite.appendChild(none);
  for (const perk of perks) {
    const option = document.createElement('option');
    option.value = perk.id;
    option.textContent = `${perk.name} (${perk.id})`;
    prerequisite.appendChild(option);
  }
  prerequisite.value = selected;

  const tbody = document.querySelector('#perks-table tbody');
  tbody.replaceChildren();
  for (const perk of perks) {
    const effect = Object.entries(perk.effect || {})[0] || [];
    const row = document.createElement('tr');
    row.append(
      td(perk.name),
      td(perk.category),
      td(`${perk.cost} XP`),
      td(perk.scope || 'All mechs'),
      td(perk.tree ? `${perk.tree} / tier ${perk.tier}` : '—'),
      td(effect.length ? `${effect[0]} ${effect[1] > 0 ? '+' : ''}${effect[1]}` : '—'),
    );
    tbody.appendChild(row);
  }
}

document.getElementById('perk-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await api('POST', '/api/pilot-perks', {
      name: form.name.value,
      id: form.id.value,
      category: form.category.value,
      cost: Number(form.cost.value),
      description: form.description.value,
      scope: form.scope.value,
      prerequisite: form.prerequisite.value,
      tree: form.tree.value,
      tier: Number(form.tier.value),
      effectName: form.effectName.value,
      effectValue: Number(form.effectValue.value),
      matchPrerequisiteWeightClass: form.matchPrerequisiteWeightClass.checked,
    });
    form.reset();
    form.cost.value = '20';
    form.tier.value = '1';
    form.effectValue.value = '-1';
    await loadPerks();
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

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
  loadMissionXpAwards(list);
  const tbody = document.querySelector('#missions-table tbody');
  tbody.replaceChildren();
  for (const c of list) {
    const tr = document.createElement('tr');
    tr.append(
      td(c.employer), td(c.missionType), td(c.location),
      td(c.lengthMonths ? `${c.lengthMonths} mo` : ''),
      td(money(c.basePay)), td((c.salvagePct ?? '') + '%'),
      td(c.xpAward ? `${c.xpAward} XP${c.xpAwarded ? ' awarded' : ''}` : '\u2014'),
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
    cell.colSpan = 10;
    cell.className = 'hint';
    cell.textContent = 'No missions yet. Create one above.';
    tr.appendChild(cell);
    tbody.appendChild(tr);
  }
}

function loadMissionXpAwards(contracts) {
  const select = document.querySelector('#bulk-xp-form select[name="amount"]');
  select.replaceChildren();
  const standard = document.createElement('optgroup');
  standard.label = 'Standard awards';
  for (const amount of [20, 40, 80]) {
    const option = document.createElement('option');
    option.value = `standard:${amount}`;
    option.dataset.amount = String(amount);
    option.textContent = `${amount} XP`;
    standard.appendChild(option);
  }
  select.appendChild(standard);

  const completed = contracts
    .filter(contract => contract.status === 'Completed' && !contract.xpAwarded && Number(contract.xpAward) > 0)
    .sort((a, b) => String(a.missionType).localeCompare(String(b.missionType)));
  if (!completed.length) return;
  const missions = document.createElement('optgroup');
  missions.label = 'Completed missions';
  for (const contract of completed) {
    const option = document.createElement('option');
    option.value = contract._id;
    option.dataset.amount = String(contract.xpAward);
    option.dataset.contractId = contract._id;
    option.textContent = `${contract.missionType} \u2014 ${contract.employer} (${contract.xpAward} XP)`;
    missions.appendChild(option);
  }
  select.appendChild(missions);
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
    xpAward: Number(f.xpAward.value) || 0,
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
  document.getElementById('travel-history-summary').textContent =
    `${loc.travelHistoryCount || 0} recorded route${loc.travelHistoryCount === 1 ? '' : 's'}  \u00b7  ` +
    `${(loc.visitedSystems || []).length} visited system${(loc.visitedSystems || []).length === 1 ? '' : 's'}`;
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

const clearTravelButton = document.getElementById('clear-travel-history');
const clearTravelConfirmation = document.getElementById('clear-travel-confirmation');
const confirmClearTravelButton = document.getElementById('confirm-clear-travel-history');
clearTravelButton.addEventListener('click', () => {
  clearTravelButton.hidden = true;
  clearTravelConfirmation.hidden = false;
});
document.getElementById('cancel-clear-travel-history').addEventListener('click', () => {
  clearTravelConfirmation.hidden = true;
  clearTravelButton.hidden = false;
});
confirmClearTravelButton.addEventListener('click', async () => {
  confirmClearTravelButton.disabled = true;
  try {
    await api('DELETE', '/api/travel/history');
    clearTravelConfirmation.hidden = true;
    clearTravelButton.hidden = false;
    await loadLocation();
  } catch (error) {
    window.alert(error.message);
  } finally {
    confirmClearTravelButton.disabled = false;
  }
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
  f.xpAward.value = String(c.xpAward || 20);
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
    xpAward: Number(f.xpAward.value) || 0,
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
loadStaff().catch(err => { document.getElementById('gm-status').textContent = 'Error: ' + err.message; });
loadPerks().catch(err => { document.getElementById('gm-status').textContent = 'Error: ' + err.message; });
loadMissions().catch(() => {});
