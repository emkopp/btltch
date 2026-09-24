'use strict';

function systemMap(store) {
  return new Map(store.list('system').map(system => [String(system.name).toLowerCase(), system]));
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function fallbackNeighbors(system, systems) {
  return systems
    .filter(candidate => candidate !== system)
    .filter(candidate => {
      const dx = candidate.x - system.x;
      const dy = candidate.y - system.y;
      return Math.sqrt(dx * dx + dy * dy) <= 30;
    })
    .map(candidate => candidate.name);
}

function reachableSystems(homeName, systems, maxJumps = 3) {
  const byName = new Map(systems.map(system => [normalizeName(system.name), system]));
  const home = byName.get(normalizeName(homeName));
  if (!home) return new Map();

  const reached = new Map([[normalizeName(home.name), {
    system: home,
    jumps: 0,
    path: [home.name],
  }]]);
  const queue = [home];
  while (queue.length) {
    const current = queue.shift();
    const currentRoute = reached.get(normalizeName(current.name));
    if (currentRoute.jumps >= maxJumps) continue;
    const neighborNames = Array.isArray(current.neighbors) && current.neighbors.length
      ? current.neighbors
      : fallbackNeighbors(current, systems);
    for (const neighborName of neighborNames) {
      const key = normalizeName(neighborName);
      const neighbor = byName.get(key);
      if (!neighbor || reached.has(key)) continue;
      reached.set(key, {
        system: neighbor,
        jumps: currentRoute.jumps + 1,
        path: [...currentRoute.path, neighbor.name],
      });
      queue.push(neighbor);
    }
  }
  return reached;
}

function computeTravel(home, destinationName, systems) {
  const destination = destinationName
    ? systems.get(String(destinationName).toLowerCase())
    : null;
  if (!home || !destination) return { known: false };
  const dx = destination.x - home.x;
  const dy = destination.y - home.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const jumps = distance < 0.01 ? 0 : Math.ceil(distance / 30);
  return {
    known: true,
    distanceLy: Math.round(distance * 10) / 10,
    jumps,
    local: jumps === 0,
  };
}

module.exports = {
  computeTravel,
  normalizeName,
  reachableSystems,
  systemMap,
};
