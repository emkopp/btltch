'use strict';

const page = document.getElementById('staff-skill-page');
const status = document.getElementById('staff-skill-status');
const staffSlug = new URLSearchParams(window.location.search).get('staff');

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function titleCase(value) {
  return String(value || '')
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function effectText(effect) {
  if (!effect) return '';
  const sign = effect.value > 0 ? '+' : '';
  return `${effect.label}: ${sign}${effect.value}${effect.unit || ''}`;
}

function renderSkill(card, skill) {
  const purchased = card.skills.some(item => item.id === skill.id);
  const item = document.createElement('div');
  item.className = 'perk-card perk-option';
  if (purchased) item.classList.add('purchased', 'unavailable');
  else if (!skill.available) item.classList.add('unavailable');
  if (purchased || !skill.available) item.setAttribute('aria-disabled', 'true');

  const heading = document.createElement('h4');
  heading.textContent = skill.name;
  const type = document.createElement('span');
  type.className = 'perk-scope';
  type.textContent = `${titleCase(skill.staffType)} skill`;
  const description = document.createElement('p');
  description.textContent = skill.description;
  const effect = document.createElement('strong');
  effect.className = 'perk-effect';
  effect.textContent = effectText(skill.effect);
  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'btn perk-buy';
  action.textContent = purchased ? 'Purchased' : `Spend ${skill.cost} XP`;
  action.disabled = purchased || !skill.available;
  item.append(heading, type, description, effect, action);

  const reasonText = purchased ? 'Already purchased' : skill.reason;
  if (reasonText) {
    const reason = document.createElement('small');
    reason.className = 'perk-reason';
    reason.textContent = reasonText;
    item.appendChild(reason);
    action.title = reasonText;
  }

  action.addEventListener('click', async () => {
    action.disabled = true;
    action.textContent = 'Purchasing\u2026';
    try {
      renderPage(await request(`/api/staff/${encodeURIComponent(staffSlug)}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id }),
      }));
    } catch (error) {
      action.disabled = false;
      action.textContent = `Spend ${skill.cost} XP`;
      window.alert(error.message);
    }
  });
  return item;
}

function renderPage(card) {
  const staff = card.staff;
  document.title = `${staff.name} Skills — Mercenary Manager`;
  status.textContent = `${Number(staff.xp) || 0} XP available`;

  const widget = document.createElement('section');
  widget.className = 'advancement-widget';
  const identity = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'pilot-eyebrow';
  eyebrow.textContent = `${titleCase(staff.tier)} ${titleCase(staff.staffType)}`;
  const name = document.createElement('h2');
  name.textContent = staff.name;
  const summary = document.createElement('p');
  summary.className = 'pilot-name';
  summary.textContent = `Rating ${staff.rating} \u00b7 ${staff.dimension}`;
  identity.append(eyebrow, name, summary);
  const xp = document.createElement('div');
  xp.className = 'pilot-xp';
  const available = document.createElement('strong');
  available.textContent = Number(staff.xp) || 0;
  const availableLabel = document.createElement('span');
  availableLabel.textContent = 'XP available';
  const spent = document.createElement('small');
  spent.textContent = `${Number(staff.xpSpent) || 0} spent`;
  xp.append(available, availableLabel, spent);
  widget.append(identity, xp);

  const effects = document.createElement('section');
  const effectsTitle = document.createElement('h3');
  effectsTitle.className = 'perk-other-title';
  effectsTitle.textContent = 'Combined operational effects';
  const effectList = document.createElement('div');
  effectList.className = 'effect-chips';
  const effectEntries = Object.entries(card.operationalEffects || {});
  if (effectEntries.length) {
    const labels = new Map(card.catalog.map(skill => [skill.effect.key, skill.effect]));
    for (const [key, value] of effectEntries) {
      const definition = labels.get(key);
      const chip = document.createElement('span');
      const sign = value > 0 ? '+' : '';
      chip.textContent = `${definition ? definition.label : titleCase(key)} ${sign}${value}${definition && definition.unit || ''}`;
      effectList.appendChild(chip);
    }
  } else {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No staff skills purchased yet.';
    effectList.appendChild(empty);
  }
  effects.append(effectsTitle, effectList);

  const help = document.createElement('p');
  help.className = 'hint pilot-help';
  help.textContent = 'Only skills for this staff member\u2019s type are shown. Each path must be purchased in tier order; unavailable and purchased skills are grayed out.';

  const trees = document.createElement('section');
  trees.className = 'perk-trees';
  const treeIds = [...new Set(card.catalog.map(skill => skill.tree))];
  for (const treeId of treeIds) {
    const treeTitle = document.createElement('h3');
    treeTitle.className = 'perk-tree-title';
    treeTitle.textContent = titleCase(treeId.replace(`${staff.staffType}-`, ''));
    const tree = document.createElement('div');
    tree.className = 'perk-tree';
    const skills = card.catalog
      .filter(skill => skill.tree === treeId)
      .sort((a, b) => a.tier - b.tier);
    skills.forEach((skill, index) => {
      const tier = document.createElement('div');
      tier.className = 'perk-tree-tier';
      const label = document.createElement('span');
      label.className = 'perk-tree-label';
      label.textContent = `Tier ${skill.tier}`;
      tier.append(label, renderSkill(card, skill));
      tree.appendChild(tier);
      if (index < skills.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'perk-tree-arrow';
        arrow.textContent = '\u2192';
        arrow.setAttribute('aria-hidden', 'true');
        tree.appendChild(arrow);
      }
    });
    trees.append(treeTitle, tree);
  }
  page.replaceChildren(widget, effects, help, trees);
}

async function load() {
  if (!staffSlug) {
    page.innerHTML = '<p class="hint">No staff member was selected. Return to the Game Master staff manager first.</p>';
    status.textContent = 'No staff selected';
    return;
  }
  try {
    renderPage(await request(`/api/staff/${encodeURIComponent(staffSlug)}/card`));
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'hint';
    message.textContent = `Unable to load staff advancement: ${error.message}`;
    page.replaceChildren(message);
    status.textContent = 'Load failed';
  }
}

load();
