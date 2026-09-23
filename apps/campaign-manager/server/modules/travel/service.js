'use strict';

function systemMap(store) {
  return new Map(store.list('system').map(system => [String(system.name).toLowerCase(), system]));
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

module.exports = { computeTravel, systemMap };
