'use strict';

const canvas = document.getElementById('campaign-map');
const context = canvas.getContext('2d');
const stage = canvas.parentElement;
const tooltip = document.getElementById('map-tooltip');
const search = document.getElementById('system-search');
const jumpButton = document.getElementById('jump-button');

let navigation = null;
let systemsByName = new Map();
let selected = null;
let hovered = null;
let scale = 1;
let cameraX = 0;
let cameraY = 0;
let fitted = false;
let drag = null;

const jumpColors = {
  0: '#e1c471',
  1: '#8ee3a1',
  2: '#66c8d7',
  3: '#718ee8',
};

function api(url, options) {
  return fetch(url, options).then(async response => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
    return body;
  });
}

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (!fitted && navigation) fitMap();
  draw();
}

function viewport() {
  return {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };
}

function fitMap() {
  if (!navigation || !navigation.systems.length) return;
  const reachable = navigation.systems.filter(system => (
    Number.isInteger(system.jumps) && system.jumps >= 0 && system.jumps <= 3
  ));
  const focusSystems = reachable.length ? reachable : navigation.systems;
  const xs = focusSystems.map(system => system.x);
  const ys = focusSystems.map(system => system.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const view = viewport();
  cameraX = (minX + maxX) / 2;
  cameraY = (minY + maxY) / 2;
  scale = Math.min(
    (view.width - 120) / Math.max(1, maxX - minX),
    (view.height - 120) / Math.max(1, maxY - minY),
  );
  fitted = true;
}

function screenPoint(system) {
  const view = viewport();
  return {
    x: (system.x - cameraX) * scale + view.width / 2,
    y: (cameraY - system.y) * scale + view.height / 2,
  };
}

function systemAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let best = null;
  let bestDistance = 11;
  for (const system of navigation.systems) {
    const point = screenPoint(system);
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < bestDistance) {
      best = system;
      bestDistance = distance;
    }
  }
  return best;
}

function drawGrid() {
  const view = viewport();
  const spacing = 100 * scale;
  if (spacing < 24) return;
  context.strokeStyle = 'rgba(115, 150, 185, 0.08)';
  context.lineWidth = 1;
  context.beginPath();
  const origin = screenPoint({ x: 0, y: 0 });
  for (let x = origin.x % spacing; x < view.width; x += spacing) {
    context.moveTo(x, 0);
    context.lineTo(x, view.height);
  }
  for (let y = origin.y % spacing; y < view.height; y += spacing) {
    context.moveTo(0, y);
    context.lineTo(view.width, y);
  }
  context.stroke();
}

function drawSelectedRoute() {
  if (!selected || !Array.isArray(selected.path)) return;
  const route = selected.path.map(name => systemsByName.get(name.toLowerCase())).filter(Boolean);
  if (route.length < 2) return;
  context.beginPath();
  route.forEach((system, index) => {
    const point = screenPoint(system);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = 'rgba(225, 196, 113, 0.8)';
  context.lineWidth = 2;
  context.setLineDash([6, 5]);
  context.stroke();
  context.setLineDash([]);
}

function drawSystem(system) {
  const point = screenPoint(system);
  const view = viewport();
  if (point.x < -20 || point.y < -20 || point.x > view.width + 20 || point.y > view.height + 20) return;
  const isCurrent = system.name === navigation.currentSystem;
  const isSelected = selected && system.name === selected.name;
  const isHovered = hovered && system.name === hovered.name;
  const reachable = Number.isInteger(system.jumps);
  const color = reachable ? jumpColors[system.jumps] : '#667380';
  const radius = isCurrent ? 5 : isSelected || isHovered ? 4.5 : reachable ? 3 : 1.6;

  if (system.visited && !isCurrent) {
    context.beginPath();
    context.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(225, 196, 113, 0.8)';
    context.lineWidth = 1.4;
    context.stroke();
  }

  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.globalAlpha = reachable || system.visited ? 1 : 0.28;
  context.fill();
  context.globalAlpha = 1;

  if (isCurrent || isSelected || isHovered || (reachable && scale > 1.7) || scale > 4) {
    context.font = `${isCurrent ? '700 ' : ''}11px system-ui`;
    context.fillStyle = isCurrent ? '#e1c471' : reachable ? '#dce8f2' : '#8492a0';
    context.fillText(system.name, point.x + 7, point.y - 6);
  }
}

function draw() {
  const view = viewport();
  context.clearRect(0, 0, view.width, view.height);
  if (!navigation) return;
  drawGrid();
  drawSelectedRoute();
  for (const system of navigation.systems) drawSystem(system);
}

function jumpLabel(jumps) {
  return `${jumps} jump${jumps === 1 ? '' : 's'}`;
}

function renderDestinations() {
  const container = document.getElementById('destination-list');
  container.replaceChildren();
  const filter = search.value.trim().toLowerCase();
  const eligible = navigation.systems
    .filter(system => system.jumps >= 1 && system.jumps <= 3)
    .filter(system => !filter || system.name.toLowerCase().includes(filter))
    .sort((a, b) => a.jumps - b.jumps || a.name.localeCompare(b.name));
  document.getElementById('destination-count').textContent =
    `${eligible.length} option${eligible.length === 1 ? '' : 's'}`;

  for (const jumps of [1, 2, 3]) {
    const matches = eligible.filter(system => system.jumps === jumps);
    if (!matches.length) continue;
    const group = document.createElement('div');
    group.className = 'jump-group';
    const heading = document.createElement('h3');
    heading.textContent = jumpLabel(jumps);
    const grid = document.createElement('div');
    grid.className = 'destination-grid';
    for (const system of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = system.name;
      button.title = `${system.name} — ${system.affiliation}`;
      button.classList.toggle('selected', selected && selected.name === system.name);
      button.addEventListener('click', () => selectSystem(system));
      grid.appendChild(button);
    }
    group.append(heading, grid);
    container.appendChild(group);
  }
  if (!eligible.length) {
    const message = document.createElement('p');
    message.textContent = filter
      ? 'No reachable destinations match this search.'
      : 'No systems are reachable within three jumps.';
    container.appendChild(message);
  }
}

function renderHistory() {
  const history = document.getElementById('travel-history');
  history.replaceChildren();
  const entries = [...(navigation.travelHistory || [])].reverse().slice(0, 20);
  document.getElementById('visited-count').textContent =
    `${navigation.visitedSystems.length} visited`;
  if (!entries.length) {
    const item = document.createElement('li');
    item.textContent = 'No recorded jumps yet.';
    history.appendChild(item);
    return;
  }
  for (const entry of entries) {
    const item = document.createElement('li');
    const destination = document.createElement('strong');
    destination.textContent = entry.to;
    item.append(`${entry.from} to `, destination, ` (${jumpLabel(entry.jumps)})`);
    history.appendChild(item);
  }
}

function renderLocation() {
  const current = systemsByName.get(String(navigation.currentSystem || '').toLowerCase());
  document.getElementById('current-system').textContent = current ? current.name : 'Not set';
  document.getElementById('current-affiliation').textContent = current
    ? current.affiliation
    : 'Set the company location in Game Master before traveling.';
}

function selectSystem(system) {
  selected = system;
  document.getElementById('selected-system').textContent = system.name;
  document.getElementById('selected-affiliation').textContent = system.affiliation;
  const route = document.getElementById('selected-route');
  route.replaceChildren();
  if (Array.isArray(system.path)) {
    for (const stop of system.path) {
      const item = document.createElement('li');
      item.textContent = stop;
      route.appendChild(item);
    }
  }
  const eligible = system.jumps >= 1 && system.jumps <= 3;
  jumpButton.disabled = !eligible;
  jumpButton.textContent = eligible
    ? `Jump ${jumpLabel(system.jumps)} to ${system.name}`
    : system.jumps === 0 ? 'Current location' : 'Outside the 3-jump range';
  document.getElementById('jump-status').textContent = '';
  renderDestinations();
  draw();
}

function renderAll() {
  systemsByName = new Map(navigation.systems.map(system => [system.name.toLowerCase(), system]));
  selected = null;
  renderLocation();
  renderDestinations();
  renderHistory();
  document.getElementById('selected-system').textContent = 'Select a reachable system';
  document.getElementById('selected-affiliation').textContent = 'Choose from the map or destination list.';
  document.getElementById('selected-route').replaceChildren();
  jumpButton.disabled = true;
  jumpButton.textContent = 'Choose a destination';
  draw();
}

async function loadNavigation() {
  navigation = await api('/api/travel/navigation');
  if (!fitted) fitMap();
  renderAll();
}

jumpButton.addEventListener('click', async () => {
  if (!selected || jumpButton.disabled) return;
  const status = document.getElementById('jump-status');
  jumpButton.disabled = true;
  status.className = 'status-message';
  status.textContent = 'Executing jump route...';
  try {
    navigation = await api('/api/travel/jump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: selected.name }),
    });
    fitted = false;
    fitMap();
    status.className = 'status-message success';
    status.textContent = `Arrived at ${navigation.currentSystem}.`;
    renderAll();
  } catch (error) {
    status.className = 'status-message error';
    status.textContent = error.message;
    jumpButton.disabled = false;
  }
});

search.addEventListener('input', () => {
  renderDestinations();
  const value = search.value.trim().toLowerCase();
  if (!value) return;
  const exact = systemsByName.get(value);
  if (exact) selectSystem(exact);
});

search.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const value = search.value.trim().toLowerCase();
  const match = navigation.systems.find(system => system.name.toLowerCase().startsWith(value));
  if (match) selectSystem(match);
});

canvas.addEventListener('pointerdown', event => {
  drag = {
    startX: event.clientX,
    startY: event.clientY,
    cameraX,
    cameraY,
  };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', event => {
  if (drag) {
    cameraX = drag.cameraX - (event.clientX - drag.startX) / scale;
    cameraY = drag.cameraY + (event.clientY - drag.startY) / scale;
    draw();
    return;
  }
  hovered = systemAt(event.clientX, event.clientY);
  if (!hovered) {
    tooltip.hidden = true;
    draw();
    return;
  }
  const rect = stage.getBoundingClientRect();
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 250)}px`;
  tooltip.style.top = `${Math.min(event.clientY - rect.top + 14, rect.height - 70)}px`;
  const tooltipName = document.createElement('strong');
  tooltipName.textContent = hovered.name;
  const tooltipDetails = document.createElement('span');
  tooltipDetails.textContent = `${hovered.affiliation} · ${
    hovered.jumps === null ? 'outside range' : jumpLabel(hovered.jumps)
  }${hovered.visited ? ' · visited' : ''}`;
  tooltip.replaceChildren(tooltipName, tooltipDetails);
  draw();
});

canvas.addEventListener('pointerup', event => {
  if (!drag) return;
  const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  drag = null;
  canvas.classList.remove('dragging');
  if (moved < 5) {
    const system = systemAt(event.clientX, event.clientY);
    if (system) selectSystem(system);
  }
});

canvas.addEventListener('pointerleave', () => {
  if (!drag) hovered = null;
  tooltip.hidden = true;
  draw();
});

canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const view = viewport();
  const worldX = (pointerX - view.width / 2) / scale + cameraX;
  const worldY = cameraY - (pointerY - view.height / 2) / scale;
  const nextScale = Math.max(0.35, Math.min(14, scale * Math.exp(-event.deltaY * 0.0012)));
  cameraX = worldX - (pointerX - view.width / 2) / nextScale;
  cameraY = worldY + (pointerY - view.height / 2) / nextScale;
  scale = nextScale;
  draw();
}, { passive: false });

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
loadNavigation().catch(error => {
  document.getElementById('current-system').textContent = 'Unable to load map';
  document.getElementById('current-affiliation').textContent = error.message;
});
