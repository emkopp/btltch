'use strict';

const express = require('express');
const {
  normalizeName,
  reachableSystems,
  systemMap,
} = require('./service');

function uniqueNames(values) {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const name = String(value || '').trim();
    const key = normalizeName(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function navigationState(store) {
  const company = store.get('company:main') || {};
  const systems = store.list('system');
  const reached = reachableSystems(company.currentSystem, systems, 3);
  const visited = new Set(uniqueNames([
    ...(Array.isArray(company.visitedSystems) ? company.visitedSystems : []),
    company.currentSystem,
  ]).map(normalizeName));
  return {
    currentSystem: company.currentSystem || null,
    visitedSystems: systems
      .filter(system => visited.has(normalizeName(system.name)))
      .map(system => system.name)
      .sort((a, b) => a.localeCompare(b)),
    travelHistory: Array.isArray(company.travelHistory) ? company.travelHistory : [],
    systems: systems.map(system => {
      const route = reached.get(normalizeName(system.name));
      return {
        name: system.name,
        x: system.x,
        y: system.y,
        affiliation: system.affiliation,
        visited: visited.has(normalizeName(system.name)),
        jumps: route ? route.jumps : null,
        path: route ? route.path : null,
      };
    }),
  };
}

module.exports = function createTravelRouter({ store }) {
  const router = express.Router();

  router.get('/api/location', (req, res) => {
    const company = store.get('company:main') || {};
    const systems = systemMap(store);
    const system = company.currentSystem
      ? systems.get(String(company.currentSystem).toLowerCase())
      : null;
    res.json({
      currentSystem: company.currentSystem || null,
      visitedSystems: uniqueNames([
        ...(Array.isArray(company.visitedSystems) ? company.visitedSystems : []),
        company.currentSystem,
      ]),
      travelHistoryCount: Array.isArray(company.travelHistory) ? company.travelHistory.length : 0,
      system: system
        ? { name: system.name, x: system.x, y: system.y, affiliation: system.affiliation }
        : null,
    });
  });

  router.post('/api/location', (req, res) => {
    const company = store.get('company:main');
    if (!company) return res.status(404).json({ error: 'No company record' });
    const requested = String(req.body && req.body.system || '').trim();
    const selected = store.list('system').find(system => (
      normalizeName(system.name) === normalizeName(requested)
    ));
    if (requested && !selected) return res.status(400).json({ error: 'Unknown system' });
    const nextSystem = selected ? selected.name : null;
    return res.json(store.put({
      ...company,
      currentSystem: nextSystem,
      visitedSystems: uniqueNames([
        ...(Array.isArray(company.visitedSystems) ? company.visitedSystems : []),
        company.currentSystem,
        nextSystem,
      ]),
    }));
  });

  router.get('/api/travel/navigation', (req, res) => {
    res.json(navigationState(store));
  });

  router.post('/api/travel/jump', (req, res) => {
    const company = store.get('company:main');
    if (!company) return res.status(404).json({ error: 'No company record' });
    if (!company.currentSystem) {
      return res.status(400).json({ error: 'Set a current system before traveling' });
    }
    const destinationName = String(req.body && req.body.destination || '').trim();
    const systems = store.list('system');
    const destination = systems.find(system => (
      normalizeName(system.name) === normalizeName(destinationName)
    ));
    if (!destination) return res.status(400).json({ error: 'Unknown destination system' });
    const route = reachableSystems(company.currentSystem, systems, 3)
      .get(normalizeName(destination.name));
    if (!route || route.jumps < 1 || route.jumps > 3) {
      return res.status(400).json({ error: 'Destination must be between 1 and 3 jumps away' });
    }
    const history = Array.isArray(company.travelHistory) ? company.travelHistory : [];
    store.put({
      ...company,
      currentSystem: destination.name,
      visitedSystems: uniqueNames([
        ...(Array.isArray(company.visitedSystems) ? company.visitedSystems : []),
        company.currentSystem,
        ...route.path,
      ]),
      travelHistory: [...history, {
        from: company.currentSystem,
        to: destination.name,
        jumps: route.jumps,
        path: route.path,
        traveledAt: new Date().toISOString(),
      }].slice(-500),
    });
    return res.json(navigationState(store));
  });

  router.delete('/api/travel/history', (req, res) => {
    const company = store.get('company:main');
    if (!company) return res.status(404).json({ error: 'No company record' });
    const cleared = store.put({
      ...company,
      visitedSystems: uniqueNames([company.currentSystem]),
      travelHistory: [],
    });
    return res.json({
      cleared: true,
      currentSystem: cleared.currentSystem || null,
      visitedSystems: cleared.visitedSystems,
      travelHistoryCount: 0,
    });
  });

  router.get('/api/systems/names', (req, res) => {
    res.json(store.list('system').map(system => system.name).sort());
  });

  router.get('/api/systems/picker', (req, res) => {
    const company = store.get('company:main') || {};
    const systems = store.list('system');
    const byName = (a, b) => String(a).localeCompare(String(b));
    const home = company.currentSystem
      ? systems.find(system => (
        String(system.name).toLowerCase() === String(company.currentSystem).toLowerCase()
      ))
      : null;
    if (!home) {
      return res.json({
        home: null,
        near: [],
        rest: systems.map(system => system.name).sort(byName),
      });
    }

    const reached = reachableSystems(home.name, systems, 3);
    const near = [...reached.values()]
      .map(route => ({
        name: route.system.name,
        jumps: route.jumps,
      }))
      .sort((a, b) => byName(a.name, b.name));
    const nearNames = new Set(near.map(system => normalizeName(system.name)));
    const rest = systems
      .filter(system => !nearNames.has(normalizeName(system.name)))
      .map(system => system.name)
      .sort(byName);
    return res.json({ home: home.name, near, rest });
  });

  return router;
};
