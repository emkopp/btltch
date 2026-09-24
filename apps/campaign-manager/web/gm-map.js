'use strict';

const canvas = document.getElementById('gm-system-map');
const context = canvas.getContext('2d');
const stage = canvas.parentElement;
const tooltip = document.getElementById('gm-map-tooltip');
const search = document.getElementById('gm-system-search');

let mapData = null;
let visibleSystems = [];
let selected = null;
let hovered = null;
let scale = 1;
let cameraX = 0;
let cameraY = 0;
let drag = null;

function tagDefinition(id) {
  return mapData.tags.find(tag => tag.id === id);
}

function systemColor(system) {
  for (const tagId of ['capital', 'lostech', 'pirate']) {
    if (system.tags.includes(tagId)) return tagDefinition(tagId).color;
  }
  return '#63717f';
}

function viewport() {
  return { width: canvas.clientWidth, height: canvas.clientHeight };
}

function screenPoint(system) {
  const view = viewport();
  return {
    x: (system.x - cameraX) * scale + view.width / 2,
    y: (cameraY - system.y) * scale + view.height / 2,
  };
}

function fitMap() {
  if (!mapData || !mapData.systems.length) return;
  const xs = mapData.systems.map(system => system.x);
  const ys = mapData.systems.map(system => system.y);
  const view = viewport();
  cameraX = (Math.min(...xs) + Math.max(...xs)) / 2;
  cameraY = (Math.min(...ys) + Math.max(...ys)) / 2;
  scale = Math.min(
    (view.width - 80) / Math.max(1, Math.max(...xs) - Math.min(...xs)),
    (view.height - 80) / Math.max(1, Math.max(...ys) - Math.min(...ys)),
  );
}

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  fitMap();
  draw();
}

function draw() {
  const view = viewport();
  context.clearRect(0, 0, view.width, view.height);
  if (!mapData) return;
  for (const system of visibleSystems) {
    const point = screenPoint(system);
    if (point.x < -10 || point.y < -10 || point.x > view.width + 10 || point.y > view.height + 10) continue;
    const active = system === selected || system === hovered;
    context.beginPath();
    context.arc(point.x, point.y, active ? 5 : system.tags.includes('capital') ? 4 : 2.8, 0, Math.PI * 2);
    context.fillStyle = systemColor(system);
    context.fill();
    if (active || scale > 2.2) {
      context.fillStyle = '#e8edf3';
      context.font = '11px system-ui';
      context.fillText(system.name, point.x + 7, point.y - 5);
    }
  }
}

function updateVisibleSystems() {
  const selectedTags = [...document.querySelectorAll('#gm-tag-filters input[data-tag]:checked')]
    .map(input => input.dataset.tag);
  const showUntagged = document.getElementById('show-untagged').checked;
  visibleSystems = mapData.systems.filter(system => (
    (showUntagged && !system.tags.length)
    || selectedTags.some(tag => system.tags.includes(tag))
  ));
  document.getElementById('gm-visible-count').textContent =
    `${visibleSystems.length.toLocaleString()} shown`;
  draw();
}

function renderFilters() {
  const container = document.getElementById('gm-tag-filters');
  const legend = document.getElementById('gm-map-legend');
  container.replaceChildren();
  legend.replaceChildren();
  for (const tag of mapData.tags) {
    const count = mapData.systems.filter(system => system.tags.includes(tag.id)).length;
    const label = document.createElement('label');
    label.className = 'gm-tag-filter';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.tag = tag.id;
    checkbox.addEventListener('change', updateVisibleSystems);
    const color = document.createElement('i');
    color.style.backgroundColor = tag.color;
    const name = document.createElement('span');
    name.textContent = tag.name;
    const total = document.createElement('small');
    total.textContent = count.toLocaleString();
    label.append(checkbox, color, name, total);
    container.appendChild(label);

    const legendItem = document.createElement('span');
    const dot = document.createElement('i');
    dot.style.backgroundColor = tag.color;
    legendItem.append(dot, tag.name);
    legend.appendChild(legendItem);
  }
  const untaggedLabel = document.createElement('label');
  untaggedLabel.className = 'gm-tag-filter';
  const untagged = document.createElement('input');
  untagged.type = 'checkbox';
  untagged.id = 'show-untagged';
  untagged.addEventListener('change', updateVisibleSystems);
  const untaggedColor = document.createElement('i');
  untaggedColor.style.backgroundColor = '#63717f';
  const untaggedText = document.createElement('span');
  untaggedText.textContent = 'Untagged';
  const untaggedCount = document.createElement('small');
  untaggedCount.textContent = mapData.systems.filter(system => !system.tags.length).length.toLocaleString();
  untaggedLabel.append(untagged, untaggedColor, untaggedText, untaggedCount);
  container.appendChild(untaggedLabel);
}

function selectSystem(system) {
  selected = system;
  document.getElementById('gm-selected-name').textContent = system.name;
  document.getElementById('gm-selected-affiliation').textContent = system.affiliation;
  document.getElementById('gm-selected-chance').textContent = `${Math.round(system.rareChance * 100)}%`;
  document.getElementById('gm-selected-stock').textContent = system.rareItemCount;
  const tags = document.getElementById('gm-selected-tags');
  tags.replaceChildren();
  if (!system.tags.length) {
    const none = document.createElement('span');
    none.textContent = 'Untagged';
    tags.appendChild(none);
  } else {
    for (const tagId of system.tags) {
      const definition = tagDefinition(tagId);
      const chip = document.createElement('span');
      chip.textContent = definition ? definition.name : tagId;
      chip.style.color = definition ? definition.color : '#e8edf3';
      tags.appendChild(chip);
    }
  }
  draw();
}

function systemAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let closest = null;
  let distance = 11;
  for (const system of visibleSystems) {
    const point = screenPoint(system);
    const next = Math.hypot(point.x - x, point.y - y);
    if (next < distance) {
      closest = system;
      distance = next;
    }
  }
  return closest;
}

canvas.addEventListener('pointerdown', event => {
  drag = { x: event.clientX, y: event.clientY, cameraX, cameraY, moved: false };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (drag) {
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    cameraX = drag.cameraX - dx / scale;
    cameraY = drag.cameraY + dy / scale;
    draw();
    return;
  }
  hovered = systemAt(event.clientX, event.clientY);
  if (!hovered) {
    tooltip.hidden = true;
  } else {
    const rect = stage.getBoundingClientRect();
    tooltip.hidden = false;
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top + 12}px`;
    tooltip.innerHTML = `<strong>${hovered.name}</strong><span>${hovered.affiliation}</span><span>${hovered.tags.join(', ') || 'Untagged'} \u00b7 ${hovered.rareItemCount} rare items</span>`;
  }
  draw();
});
canvas.addEventListener('pointerup', event => {
  const clicked = !drag || !drag.moved;
  drag = null;
  canvas.releasePointerCapture(event.pointerId);
  if (clicked) {
    const system = systemAt(event.clientX, event.clientY);
    if (system) selectSystem(system);
  }
});
canvas.addEventListener('pointerleave', () => {
  hovered = null;
  tooltip.hidden = true;
  draw();
});
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  scale = Math.max(0.15, Math.min(12, scale * (event.deltaY < 0 ? 1.15 : 0.87)));
  draw();
}, { passive: false });
search.addEventListener('change', () => {
  const match = mapData.systems.find(system => system.name.toLowerCase() === search.value.trim().toLowerCase());
  if (!match) return;
  if (!visibleSystems.includes(match)) {
    document.getElementById('show-untagged').checked = true;
    for (const input of document.querySelectorAll('#gm-tag-filters input[data-tag]')) input.checked = true;
    updateVisibleSystems();
  }
  cameraX = match.x;
  cameraY = match.y;
  scale = Math.max(scale, 3);
  selectSystem(match);
});

async function load() {
  const response = await fetch('/api/gm/system-map');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  mapData = await response.json();
  const listId = 'gm-system-names';
  const list = document.createElement('datalist');
  list.id = listId;
  for (const system of mapData.systems) {
    const option = document.createElement('option');
    option.value = system.name;
    list.appendChild(option);
  }
  document.body.appendChild(list);
  search.setAttribute('list', listId);
  renderFilters();
  updateVisibleSystems();
  resizeCanvas();
}

window.addEventListener('resize', resizeCanvas);
load().catch(error => {
  document.getElementById('gm-selected-name').textContent = 'Map unavailable';
  document.getElementById('gm-selected-affiliation').textContent = error.message;
});
