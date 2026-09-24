'use strict';

const TREE_CONFIG = [
  ['global-gunnery', 'Gunnery mastery · high combat impact'],
  ['global-piloting', 'Piloting mastery · lower roll frequency'],
  ['weapon-laser', 'Laser mastery · attack accuracy'],
  ['weapon-missile', 'Missile mastery · attack accuracy'],
  ['weapon-ppc', 'PPC mastery · attack accuracy'],
  ['weapon-autocannon', 'Autocannon mastery · attack accuracy'],
  ['weapon-melee', 'Melee mastery · attack accuracy'],
  ['terrain-woods', 'Woodland Runner · free terrain movement'],
  ['terrain-rubble', 'Rubble Runner · free terrain movement'],
  ['terrain-elevation', 'Elevation Expert · free level changes'],
];

const page = document.getElementById('perk-page');
const status = document.getElementById('perk-page-status');
const pilotSlug = new URLSearchParams(window.location.search).get('pilot');
const { effectText } = window.PerkUi;

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function renderPerk(card, perk) {
  const purchased = card.perks.find(item => item.id === perk.id);
  const item = document.createElement('div');
  item.className = 'perk-card perk-option';

  const heading = document.createElement('h4');
  heading.textContent = perk.name;
  const category = document.createElement('span');
  category.className = 'perk-scope';
  category.textContent = perk.category;
  const description = document.createElement('p');
  description.textContent = perk.description;
  const effect = document.createElement('strong');
  effect.className = 'perk-effect';
  effect.textContent = effectText(perk.effect);
  item.append(heading, category, description, effect);

  let select = null;
  let selectableOptions = [];
  if (perk.scope) {
    select = document.createElement('select');
    select.className = 'perk-select';
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = `Select ${perk.scope === 'weightClass' ? 'weight class' : perk.scope}…`;
    select.appendChild(prompt);
    for (const option of perk.options) {
      const choice = document.createElement('option');
      choice.value = option;
      const lockedReason = perk.lockedOptions && perk.lockedOptions[option];
      choice.textContent = lockedReason ? `${option} — locked` : option;
      choice.disabled = !!lockedReason;
      if (lockedReason) choice.title = lockedReason;
      select.appendChild(choice);
    }
    selectableOptions = [...select.options].filter(option => option.value && !option.disabled);
    if (selectableOptions.length === 1) select.value = selectableOptions[0].value;
    item.appendChild(select);
  }

  const hasSelectableScope = !perk.scope || selectableOptions.length > 0;
  const unavailable = !perk.available || !hasSelectableScope;
  if (purchased) item.classList.add('purchased', 'unavailable');
  else if (unavailable) item.classList.add('unavailable');
  if (purchased || unavailable) item.setAttribute('aria-disabled', 'true');

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'btn perk-buy';
  action.textContent = purchased ? 'Purchased' : `Spend ${perk.cost} XP`;
  action.disabled = !!purchased || unavailable;
  item.appendChild(action);

  let reasonText = null;
  if (purchased) {
    reasonText = purchased.scopeLabel
      ? `Already purchased for ${purchased.scopeLabel}`
      : 'Already purchased';
  } else if (!hasSelectableScope) {
    reasonText = 'No eligible selection is unlocked yet';
  } else if (perk.reason) {
    reasonText = perk.reason;
  }
  if (reasonText) {
    const reason = document.createElement('small');
    reason.className = 'perk-reason';
    reason.textContent = reasonText;
    item.appendChild(reason);
    action.title = reasonText;
  }

  action.addEventListener('click', async () => {
    if (select && !select.value) {
      select.focus();
      return;
    }
    action.disabled = true;
    action.textContent = 'Purchasing…';
    try {
      const scope = perk.scope ? { type: perk.scope, value: select.value } : undefined;
      const next = await request(`/api/pilot/${encodeURIComponent(pilotSlug)}/perks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perkId: perk.id, scope }),
      });
      renderPage(next);
    } catch (error) {
      action.disabled = false;
      action.textContent = `Spend ${perk.cost} XP`;
      window.alert(error.message);
    }
  });

  return item;
}

function renderPage(card) {
  const displayName = card.pilot.callsign || card.pilot.name || 'Unnamed Pilot';
  document.title = `${displayName} Perks — Mercenary Manager`;
  status.textContent = `${Number(card.pilot.xp) || 0} XP available`;

  const widget = document.createElement('section');
  widget.className = 'advancement-widget';
  const identity = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'pilot-eyebrow';
  eyebrow.textContent = `${card.pilot.rating || 'Unrated'} MechWarrior`;
  const name = document.createElement('h2');
  name.textContent = displayName;
  const realName = document.createElement('p');
  realName.className = 'pilot-name';
  realName.textContent = card.pilot.name && card.pilot.name !== displayName
    ? card.pilot.name
    : 'Pilot advancement';
  identity.append(eyebrow, name, realName);
  const xp = document.createElement('div');
  xp.className = 'pilot-xp';
  xp.innerHTML = `<strong>${Number(card.pilot.xp) || 0}</strong><span>XP available</span><small>${Number(card.pilot.xpSpent) || 0} spent</small>`;
  widget.append(identity, xp);

  const help = document.createElement('p');
  help.className = 'hint pilot-help';
  help.textContent = 'Purchased perks and perks that are not currently eligible are grayed out. Mastery paths widen from chassis to weight class to all BattleMechs.';

  const trees = document.createElement('section');
  trees.className = 'perk-trees';
  const treeConfig = [...TREE_CONFIG];
  const knownTrees = new Set(treeConfig.map(([treeId]) => treeId));
  for (const perk of card.catalog) {
    if (!perk.tree || knownTrees.has(perk.tree)) continue;
    knownTrees.add(perk.tree);
    const label = perk.tree
      .split('-')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    treeConfig.push([perk.tree, label]);
  }
  for (const [treeId, label] of treeConfig) {
    const treeTitle = document.createElement('h3');
    treeTitle.className = 'perk-tree-title';
    treeTitle.textContent = label;
    const tree = document.createElement('div');
    tree.className = 'perk-tree';
    const perks = card.catalog
      .filter(perk => perk.tree === treeId)
      .sort((a, b) => a.tier - b.tier);
    if (!perks.length) continue;
    perks.forEach((perk, index) => {
      const tier = document.createElement('div');
      tier.className = 'perk-tree-tier';
      const tierLabel = document.createElement('span');
      tierLabel.className = 'perk-tree-label';
      tierLabel.textContent = `Tier ${perk.tier}`;
      tier.append(tierLabel, renderPerk(card, perk));
      tree.appendChild(tier);
      if (index < perks.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'perk-tree-arrow';
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        tree.appendChild(arrow);
      }
    });
    trees.append(treeTitle, tree);
  }

  const otherTitle = document.createElement('h3');
  otherTitle.className = 'perk-other-title';
  otherTitle.textContent = 'Other combat perks';
  const otherPerks = document.createElement('section');
  otherPerks.className = 'perk-grid';
  for (const perk of card.catalog.filter(item => !item.tree)) {
    otherPerks.appendChild(renderPerk(card, perk));
  }

  page.replaceChildren(widget, help, trees, otherTitle, otherPerks);
}

async function load() {
  if (!pilotSlug) {
    page.innerHTML = '<p class="hint">No pilot was selected. Return to the Pilots section and open a pilot card first.</p>';
    status.textContent = 'No pilot selected';
    return;
  }
  try {
    renderPage(await request(`/api/pilot/${encodeURIComponent(pilotSlug)}/card`));
  } catch (error) {
    page.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'hint';
    message.textContent = `Unable to load pilot advancement: ${error.message}`;
    page.appendChild(message);
    status.textContent = 'Load failed';
  }
}

load();
