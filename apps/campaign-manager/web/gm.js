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
let rareTemplateList = [];
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

// ---- Metadata and marketplace panel ----
let marketSystems = [];
let marketTagDefinitions = [];
let marketItemCatalog = [];
const systemTagForm = document.getElementById('system-tag-form');
const rareTemplateForm = document.getElementById('rare-template-form');

function selectedMarketSystem() {
  const name = systemTagForm.systemName.value.trim().toLowerCase();
  return marketSystems.find(system => system.name.toLowerCase() === name) || null;
}

function modifierSummary(modifiers) {
  const labels = { heat: 'Heat', range: 'Range', damage: 'Damage', tonnage: 'Tonnage' };
  return Object.entries(modifiers || {})
    .map(([key, value]) => `${labels[key] || key} ${value > 0 ? '+' : ''}${value}`)
    .join(', ') || '\u2014';
}

function renderSelectedSystemMetadata() {
  const system = selectedMarketSystem();
  for (const checkbox of document.querySelectorAll('#system-tag-checkboxes input')) {
    checkbox.checked = !!system && system.tags.includes(checkbox.value);
    checkbox.disabled = !system;
  }
  const status = document.getElementById('system-market-status');
  if (!system) {
    status.className = 'hint';
    status.textContent = 'Choose an exact system name to manage its tags and market.';
    return;
  }
  status.className = 'market-system-status';
  status.textContent = `${system.affiliation} \u00b7 ${Math.round(system.rareChance * 100)}% rare-stock chance \u00b7 ${system.rareItemCount} rare item${system.rareItemCount === 1 ? '' : 's'} currently available`;
}

function populateRareBaseItems() {
  const type = rareTemplateForm.itemType.value;
  const select = rareTemplateForm.baseItemName;
  const selected = select.value;
  select.replaceChildren();
  const any = document.createElement('option');
  any.value = '';
  any.textContent = 'Any matching item';
  select.appendChild(any);
  for (const item of marketItemCatalog.filter(item => item.itemType === type)) {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    select.appendChild(option);
  }
  if ([...select.options].some(option => option.value === selected)) select.value = selected;
}

async function loadMetadata() {
  const [map, templates, catalog, summary, saleOffers] = await Promise.all([
    get('/api/gm/system-map'),
    get('/api/rare-item-templates'),
    get('/api/items/catalog'),
    get('/api/system-tags/summary'),
    get('/api/rare-sale-offers'),
  ]);
  marketSystems = map.systems;
  marketTagDefinitions = map.tags;
  marketItemCatalog = catalog;

  document.getElementById('system-tag-summary').textContent =
    `${summary.totalSystems.toLocaleString()} systems \u00b7 ` +
    marketTagDefinitions.map(tag => `${tag.name}: ${summary.counts[tag.id] || 0}`).join(' \u00b7 ');

  const datalist = document.getElementById('tag-system-list');
  datalist.replaceChildren();
  for (const system of marketSystems) {
    const option = document.createElement('option');
    option.value = system.name;
    datalist.appendChild(option);
  }

  const tags = document.getElementById('system-tag-checkboxes');
  tags.replaceChildren();
  for (const definition of marketTagDefinitions) {
    const label = document.createElement('label');
    label.className = 'tag-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'tags';
    checkbox.value = definition.id;
    checkbox.disabled = true;
    const text = document.createElement('span');
    text.textContent = definition.name;
    const description = document.createElement('small');
    description.textContent = definition.description;
    label.append(checkbox, text, description);
    tags.appendChild(label);
  }
  renderSelectedSystemMetadata();
  populateRareBaseItems();

  const tbody = document.querySelector('#rare-template-table tbody');
  tbody.replaceChildren();
  for (const template of templates) {
    const row = document.createElement('tr');
    const actions = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn danger small';
    remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Delete rare-item template ${template.name}? Existing generated items will be preserved.`)) return;
      remove.disabled = true;
      try {
        await api('DELETE', `/api/rare-item-templates/${encodeURIComponent(template.id)}`);
        await loadMetadata();
      } catch (error) {
        window.alert(error.message);
        remove.disabled = false;
      }
    });
    actions.appendChild(remove);
    row.append(
      td(template.name),
      td(template.itemType),
      td(template.baseItemName || 'Random'),
      td(money(template.basePrice)),
      td(modifierSummary(template.modifiers)),
      actions,
    );
    tbody.appendChild(row);
  }

  const saleBody = document.querySelector('#rare-sale-table tbody');
  saleBody.replaceChildren();
  const pendingOffers = saleOffers.filter(offer => offer.status === 'pending');
  if (!pendingOffers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.className = 'hint';
    cell.textContent = 'No rare-item sale negotiations are pending.';
    row.appendChild(cell);
    saleBody.appendChild(row);
  }
  for (const offer of pendingOffers) {
    const row = document.createElement('tr');
    const priceCell = document.createElement('td');
    const price = document.createElement('input');
    price.type = 'number';
    price.min = '1';
    price.max = '1000000000';
    price.step = '1000';
    price.value = String(offer.suggestedValue || 1);
    price.setAttribute('aria-label', `Negotiated price for ${offer.itemName}`);
    priceCell.appendChild(price);
    const actions = document.createElement('td');
    actions.className = 'table-actions';
    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'btn small';
    approve.textContent = 'Approve sale';
    approve.addEventListener('click', async () => {
      approve.disabled = true;
      try {
        await api('POST', `/api/rare-sale-offers/${offer._id.replace(/^rareSaleOffer:/, '')}/resolve`, {
          action: 'approve',
          amount: Number(price.value),
        });
        await Promise.all([loadMetadata(), loadTeam()]);
      } catch (error) {
        window.alert(error.message);
        approve.disabled = false;
      }
    });
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'btn danger small';
    reject.textContent = 'Reject';
    reject.addEventListener('click', async () => {
      reject.disabled = true;
      try {
        await api('POST', `/api/rare-sale-offers/${offer._id.replace(/^rareSaleOffer:/, '')}/resolve`, {
          action: 'reject',
        });
        await loadMetadata();
      } catch (error) {
        window.alert(error.message);
        reject.disabled = false;
      }
    });
    actions.append(approve, reject);
    row.append(
      td(offer.itemName),
      td(offer.itemType),
      td(offer.systemName),
      td(modifierSummary(offer.modifiers)),
      td(money(offer.suggestedValue)),
      priceCell,
      actions,
    );
    saleBody.appendChild(row);
  }
}

systemTagForm.systemName.addEventListener('input', renderSelectedSystemMetadata);
systemTagForm.systemName.addEventListener('change', renderSelectedSystemMetadata);
systemTagForm.addEventListener('submit', async event => {
  event.preventDefault();
  const system = selectedMarketSystem();
  if (!system) {
    window.alert('Choose an exact system name first.');
    return;
  }
  const submit = systemTagForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await api('PUT', `/api/systems/${encodeURIComponent(system.id.replace(/^system:/, ''))}/tags`, {
      tags: [...systemTagForm.querySelectorAll('input[name="tags"]:checked')].map(input => input.value),
    });
    await loadMetadata();
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

document.getElementById('regenerate-system-market').addEventListener('click', async event => {
  const system = selectedMarketSystem();
  if (!system) {
    window.alert('Choose an exact system name first.');
    return;
  }
  event.currentTarget.disabled = true;
  try {
    const market = await api('POST', `/api/gm/markets/${encodeURIComponent(system.id.replace(/^system:/, ''))}/regenerate`);
    await loadMetadata();
    window.alert(`${system.name} now has ${market.rareItems.length} rare item${market.rareItems.length === 1 ? '' : 's'}.`);
  } catch (error) {
    window.alert(error.message);
  } finally {
    event.currentTarget.disabled = false;
  }
});

rareTemplateForm.itemType.addEventListener('change', populateRareBaseItems);
rareTemplateForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = rareTemplateForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const modifiers = {};
    for (const key of ['heat', 'range', 'damage', 'tonnage']) {
      const value = Number(rareTemplateForm[key].value);
      if (value) modifiers[key] = value;
    }
    await api('POST', '/api/rare-item-templates', {
      name: rareTemplateForm.name.value,
      id: rareTemplateForm.id.value,
      itemType: rareTemplateForm.itemType.value,
      namePrefix: rareTemplateForm.namePrefix.value,
      baseItemName: rareTemplateForm.baseItemName.value,
      basePrice: Number(rareTemplateForm.basePrice.value),
      description: rareTemplateForm.description.value,
      modifiers,
    });
    rareTemplateForm.reset();
    rareTemplateForm.basePrice.value = '150000';
    populateRareBaseItems();
    await loadMetadata();
  } catch (error) {
    window.alert(error.message);
  } finally {
    submit.disabled = false;
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
      td(missionRewardsSummary(c.rewards)),
      td(c.xpAward ? `${c.xpAward} XP${c.xpAwarded ? ' awarded' : ''}` : '\u2014'),
    );
    const stCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status';
    badge.textContent = c.status || 'Negotiating';
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
    actCell.className = 'table-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn small';
    edit.textContent = 'Edit promised rewards';
    edit.addEventListener('click', () => openMissionEditor(c));
    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      await api('DELETE', `/api/contract/${c._id.replace(/^contract:/, '')}`);
      await loadMissions();
    });
    actCell.append(edit, del);
    tr.appendChild(actCell);
    tbody.appendChild(tr);
  }
  if (!list.length) {
    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 11;
    cell.className = 'hint';
    cell.textContent = 'No missions yet. Create one above.';
    tr.appendChild(cell);
    tbody.appendChild(tr);
  }
}

function missionRewardsSummary(rewards) {
  const values = [];
  for (const reward of rewards || []) {
    if (reward.kind === 'bonus' && Number(reward.amount)) {
      values.push(`${money(Number(reward.amount))} bonus`);
      continue;
    }
    if (reward.kind === 'rare') {
      values.push(reward.name || `${reward.templateName || 'Rare'} ${reward.baseItemName || 'item'}`);
      continue;
    }
    const names = Array.isArray(reward.items)
      ? reward.items
      : (reward.description ? [reward.description] : []);
    values.push(...batchLabels(names));
  }
  return values.length ? values.join(', ') : '\u2014';
}

function batchLabels(names) {
  const counts = new Map();
  for (const name of names || []) counts.set(name, (counts.get(name) || 0) + 1);
  return [...counts].map(([name, count]) => count > 1 ? `${count}\u00d7 ${name}` : name);
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
  openMissionEditor({
    _isNew: true,
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
    rewards: [],
  });
});

async function loadRefData() {
  const [types, employers, transports, designs, items, rareTemplates] = await Promise.all([
    get('/api/missionType'), get('/api/employer'), get('/api/transportOption'),
    get('/api/designs/list'), get('/api/items/catalog'), get('/api/rare-item-templates'),
  ]);
  designList = designs;
  itemCatalog = items;
  rareTemplateList = rareTemplates;
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
  document.getElementById('mission-modal-title').textContent = c._isNew
    ? 'Create Mission \u2014 Promised Rewards'
    : 'Edit Mission \u2014 Promised Rewards';
  document.getElementById('mission-modal-context').textContent =
    `${c.missionType || 'Mission'} for ${c.employer || 'Unknown employer'} at ${c.location || 'an unspecified location'}`;
  document.getElementById('mission-save').textContent = c._isNew ? 'Create mission' : 'Save mission';
  f.status.value = c.status || 'Negotiating';
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

function rewardChoiceColumn(title, values, selectedValue, className, onSelect) {
  const column = document.createElement('div');
  column.className = `reward-filter-column ${className}`;
  const heading = document.createElement('strong');
  heading.textContent = title;
  const choices = document.createElement('div');
  choices.className = 'reward-filter-choices';
  for (const value of values) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reward-filter-choice';
    button.textContent = value;
    button.classList.toggle('active', value === selectedValue);
    button.addEventListener('click', () => onSelect(value));
    choices.appendChild(button);
  }
  column.append(heading, choices);
  return column;
}

function addRewardRow(reward) {
  reward = reward || { kind: 'bonus' };
  const row = document.createElement('div');
  row.className = 'reward-row';
  const kind = document.createElement('select');
  kind.className = 'reward-kind';
  [['mech', "BattleMech"], ['equipment', 'Standard item'], ['rare', 'Rare item'], ['bonus', 'Cash bonus']].forEach(function (k) {
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
    if (kind.value === 'rare') {
      const rareEditor = document.createElement('div');
      rareEditor.className = 'rare-reward-editor';
      const templateLabel = document.createElement('label');
      templateLabel.textContent = 'Rare modification';
      const templateSelect = document.createElement('select');
      templateSelect.className = 'reward-rare-template';
      for (const template of rareTemplateList) {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.name} (${template.itemType})`;
        templateSelect.appendChild(option);
      }
      if (reward.templateId) templateSelect.value = reward.templateId;
      templateLabel.appendChild(templateSelect);

      const baseLabel = document.createElement('label');
      baseLabel.textContent = 'Base weapon or equipment';
      const baseSelect = document.createElement('select');
      baseSelect.className = 'reward-rare-base';
      baseLabel.appendChild(baseSelect);
      const preview = document.createElement('div');
      preview.className = 'rare-reward-preview';

      function updateRareBaseItems() {
        const template = rareTemplateList.find(item => item.id === templateSelect.value);
        const previous = baseSelect.value || reward.baseItemName || '';
        baseSelect.replaceChildren();
        const compatible = itemCatalog.filter(item => template && item.itemType === template.itemType);
        for (const item of compatible) {
          const option = document.createElement('option');
          option.value = item.name;
          option.textContent = item.name;
          baseSelect.appendChild(option);
        }
        if (compatible.some(item => item.name === previous)) baseSelect.value = previous;
        else if (template && template.baseItemName && compatible.some(item => item.name === template.baseItemName)) {
          baseSelect.value = template.baseItemName;
        }
        updateRarePreview();
      }
      function updateRarePreview() {
        const template = rareTemplateList.find(item => item.id === templateSelect.value);
        if (!template) {
          preview.textContent = 'No rare-item templates are available. Create one in Metadata first.';
          return;
        }
        const modifiers = Object.entries(template.modifiers || {})
          .map(([key, value]) => `${key} ${Number(value) > 0 ? '+' : ''}${value}`)
          .join(', ');
        preview.textContent = `${template.namePrefix || 'Rare'} ${baseSelect.value || template.itemType}` +
          `${modifiers ? ` \u00b7 ${modifiers}` : ''}`;
      }
      templateSelect.addEventListener('change', updateRareBaseItems);
      baseSelect.addEventListener('change', updateRarePreview);
      rareEditor.append(templateLabel, baseLabel, preview);
      control.appendChild(rareEditor);
      updateRareBaseItems();
      return;
    }
    if (kind.value === 'mech') {
      const selected = new Set(Array.isArray(reward.items) ? reward.items : (reward.description ? [reward.description] : []));
      const byModel = new Map(designList.map(design => [design.model, design]));
      const picker = document.createElement('div');
      picker.className = 'mech-reward-picker';
      const chips = document.createElement('div');
      chips.className = 'reward-chips mech-reward-chips';
      const columns = document.createElement('div');
      columns.className = 'mech-picker-columns';
      picker.append(chips, columns);

      let selectedWeight = 'All';
      let selectedTechnology = selected.size ? 'All' : 'Inner Sphere';

      function renderChips() {
        chips.replaceChildren();
        for (const model of selected) {
          const design = byModel.get(model);
          const chip = document.createElement('span');
          chip.className = 'reward-chip';
          chip.dataset.value = model;
          const text = document.createElement('span');
          text.textContent = design
            ? `${design.model} \u00b7 ${design.weightClass} \u00b7 ${design.technology}`
            : model;
          const removeChip = document.createElement('button');
          removeChip.type = 'button';
          removeChip.textContent = '\u00d7';
          removeChip.addEventListener('click', () => {
            selected.delete(model);
            renderChips();
            renderColumns();
          });
          chip.append(text, removeChip);
          chips.appendChild(chip);
        }
      }

      function renderColumns() {
        columns.replaceChildren();
        const weightColumn = rewardChoiceColumn(
          '1. Weight class',
          ['All', 'Light', 'Medium', 'Heavy', 'Assault'],
          selectedWeight,
          'mech-weight-column',
          value => {
            selectedWeight = value;
            renderColumns();
          },
        );
        const technologyColumn = rewardChoiceColumn(
          '2. Technology',
          ['Inner Sphere', 'Clan', 'All'],
          selectedTechnology,
          'mech-technology-column',
          value => {
            selectedTechnology = value;
            renderColumns();
          },
        );
        const resultsColumn = document.createElement('div');
        resultsColumn.className = 'mech-filter-column mech-results-column';
        const heading = document.createElement('strong');
        const matching = designList.filter(design => (
          (selectedWeight === 'All' || design.weightClass === selectedWeight)
          && (selectedTechnology === 'All' || design.technology === selectedTechnology)
        ));
        heading.textContent = `3. BattleMechs (${matching.length})`;
        const results = document.createElement('div');
        results.className = 'mech-picker-results';
        for (const design of matching) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mech-picker-result';
          button.classList.toggle('selected', selected.has(design.model));
          button.setAttribute('aria-pressed', selected.has(design.model) ? 'true' : 'false');
          button.textContent = `${design.model} \u2014 ${design.class}${design.tons ? ` (${design.tons}t)` : ''}`;
          button.addEventListener('click', () => {
            if (selected.has(design.model)) selected.delete(design.model);
            else selected.add(design.model);
            renderChips();
            renderColumns();
          });
          results.appendChild(button);
        }
        if (!matching.length) {
          const empty = document.createElement('div');
          empty.className = 'reward-option empty';
          empty.textContent = 'No BattleMechs match these filters.';
          results.appendChild(empty);
        }
        resultsColumn.append(heading, results);
        columns.append(weightColumn, technologyColumn, resultsColumn);
      }

      renderChips();
      renderColumns();
      control.appendChild(picker);
      return;
    }
    const initialItems = Array.isArray(reward.items) ? reward.items : (reward.description ? [reward.description] : []);
    const quantities = new Map();
    for (const name of initialItems) quantities.set(name, (quantities.get(name) || 0) + 1);
    const byName = new Map(itemCatalog.map(item => [item.name, item]));
    const picker = document.createElement('div');
    picker.className = 'item-reward-picker';
    const chips = document.createElement('div');
    chips.className = 'reward-chips item-reward-chips';
    const columns = document.createElement('div');
    columns.className = 'item-picker-columns';
    picker.append(chips, columns);

    let selectedGroup = 'All';
    let selectedCategory = 'All';

    function renderChips() {
      chips.replaceChildren();
      for (const [name, quantity] of quantities) {
        const item = byName.get(name);
        const chip = document.createElement('span');
        chip.className = 'reward-chip';
        chip.dataset.value = name;
        chip.dataset.quantity = String(quantity);
        const text = document.createElement('span');
        text.textContent = `${quantity}\u00d7 ${name}${item ? ` \u00b7 ${item.category}` : ''}`;
        const decrement = document.createElement('button');
        decrement.type = 'button';
        decrement.textContent = '\u2212';
        decrement.title = `Remove one ${name}`;
        decrement.addEventListener('click', () => {
          if (quantity <= 1) quantities.delete(name);
          else quantities.set(name, quantity - 1);
          renderChips();
          renderColumns();
        });
        const increment = document.createElement('button');
        increment.type = 'button';
        increment.textContent = '+';
        increment.title = `Add one ${name}`;
        increment.addEventListener('click', () => {
          quantities.set(name, quantity + 1);
          renderChips();
          renderColumns();
        });
        const removeBatch = document.createElement('button');
        removeBatch.type = 'button';
        removeBatch.textContent = '\u00d7';
        removeBatch.title = `Remove all ${name}`;
        removeBatch.addEventListener('click', () => {
          quantities.delete(name);
          renderChips();
          renderColumns();
        });
        chip.append(text, decrement, increment, removeBatch);
        chips.appendChild(chip);
      }
    }

    function renderColumns() {
      columns.replaceChildren();
      const groupColumn = rewardChoiceColumn(
        '1. Item group',
        ['All', 'Weapons', 'Equipment'],
        selectedGroup,
        'item-group-column',
        value => {
          selectedGroup = value;
          selectedCategory = 'All';
          renderColumns();
        },
      );
      const groupItems = itemCatalog.filter(item => (
        selectedGroup === 'All'
        || (selectedGroup === 'Weapons' && item.itemType === 'weapon')
        || (selectedGroup === 'Equipment' && item.itemType === 'equipment')
      ));
      const preferredOrder = [
        'Energy', 'Ballistic', 'Missile', 'Artillery',
        'Cooling', 'Electronics', 'Physical', 'General Equipment',
      ];
      const available = new Set(groupItems.map(item => item.category));
      const categories = ['All', ...preferredOrder.filter(category => available.has(category))];
      const categoryColumn = rewardChoiceColumn(
        '2. Category',
        categories,
        selectedCategory,
        'item-category-column',
        value => {
          selectedCategory = value;
          renderColumns();
        },
      );
      const matching = groupItems.filter(item => selectedCategory === 'All' || item.category === selectedCategory);
      const resultsColumn = document.createElement('div');
      resultsColumn.className = 'reward-filter-column item-results-column';
      const heading = document.createElement('strong');
      heading.textContent = `3. Items (${matching.length})`;
      const results = document.createElement('div');
      results.className = 'item-picker-results';
      for (const item of matching) {
        const quantity = quantities.get(item.name) || 0;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'item-picker-result';
        button.classList.toggle('selected', quantity > 0);
        button.textContent = `${item.name} \u2014 ${item.itemType}${quantity ? ` \u00d7${quantity}` : ''}`;
        button.title = `Add one ${item.name}`;
        button.addEventListener('click', () => {
          quantities.set(item.name, (quantities.get(item.name) || 0) + 1);
          renderChips();
          renderColumns();
        });
        results.appendChild(button);
      }
      if (!matching.length) {
        const empty = document.createElement('div');
        empty.className = 'reward-option empty';
        empty.textContent = 'No items match these filters.';
        results.appendChild(empty);
      }
      resultsColumn.append(heading, results);
      columns.append(groupColumn, categoryColumn, resultsColumn);
    }

    renderChips();
    renderColumns();
    control.appendChild(picker);
  }
  kind.addEventListener('change', buildControl);
  buildControl();

  row.append(kind, control, remove);
  document.getElementById('rewards-list').appendChild(row);
}

document.getElementById('add-reward').addEventListener('click', () => addRewardRow());
document.getElementById('mission-close').addEventListener('click', closeMissionEditor);
document.getElementById('mission-cancel').addEventListener('click', closeMissionEditor);
document.querySelector('#mission-modal .modal-backdrop').addEventListener('click', closeMissionEditor);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('mission-modal').hidden) closeMissionEditor();
});
document.getElementById('mission-edit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const slug = editingContract._id ? editingContract._id.replace(/^contract:/, '') : null;
  const wasAwarded = !!editingContract.awarded;
  const newStatus = f.status.value;
  const rewards = Array.prototype.map.call(document.querySelectorAll('#rewards-list .reward-row'), function (row) {
    const kind = row.querySelector('.reward-kind').value;
    if (kind === 'bonus') {
      const amt = row.querySelector('.reward-amount');
      return { kind: 'bonus', amount: Number(amt ? amt.value : 0) || 0 };
    }
    if (kind === 'rare') {
      const templateSelect = row.querySelector('.reward-rare-template');
      const baseSelect = row.querySelector('.reward-rare-base');
      const template = rareTemplateList.find(item => templateSelect && item.id === templateSelect.value);
      const baseItemName = baseSelect ? baseSelect.value : '';
      if (!template || !baseItemName) return null;
      return {
        kind: 'rare',
        templateId: template.id,
        templateName: template.name,
        itemType: template.itemType,
        baseItemName,
        name: `${template.namePrefix || 'Rare'} ${baseItemName}`,
        rarity: 'Lostech',
        description: template.description,
        modifiers: template.modifiers || {},
      };
    }
    const items = Array.prototype.flatMap.call(row.querySelectorAll('.reward-chip'), function (ch) {
      return Array(Number(ch.dataset.quantity) || 1).fill(ch.dataset.value);
    });
    return { kind: kind, items: items };
  }).filter(r => r && (r.kind === 'bonus' ? r.amount : (r.kind === 'rare' ? r.baseItemName : (r.items && r.items.length))));
  const body = Object.assign({}, editingContract, {
    status: newStatus,
    rewards: rewards,
    conditionNotes: f.conditionNotes.value,
  });
  delete body._isNew;
  let saved;
  if (editingContract._isNew) {
    saved = await api('POST', '/api/contract', body);
    document.getElementById('mission-form').reset();
  } else {
    saved = await api('PUT', `/api/contract/${slug}`, body);
  }
  if (newStatus === 'Awarded' && !wasAwarded) {
    const savedSlug = saved._id.replace(/^contract:/, '');
    const result = await api('POST', `/api/contract/${savedSlug}/award`);
    if (result && result.granted && result.granted.length) {
      const lines = result.granted.map(function (g) {
        if (g.kind === 'bonus') return `+${money(g.amount)} cash`;
        if (g.kind === 'mech') return `'Mech: ${g.name}`;
        return `${g.kind === 'rare' ? 'Rare item' : 'Equipment'}: ${g.name}`;
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
loadMetadata().catch(err => { document.getElementById('gm-status').textContent = 'Error: ' + err.message; });
loadPerks().catch(err => { document.getElementById('gm-status').textContent = 'Error: ' + err.message; });
loadMissions().catch(() => {});
