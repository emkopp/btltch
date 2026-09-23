'use strict';

const express = require('express');
const { systemMap } = require('./service');

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
      system: system
        ? { name: system.name, x: system.x, y: system.y, affiliation: system.affiliation }
        : null,
    });
  });

  router.post('/api/location', (req, res) => {
    const company = store.get('company:main');
    if (!company) return res.status(404).json({ error: 'No company record' });
    return res.json(store.put({
      ...company,
      currentSystem: (req.body && req.body.system) || null,
    }));
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

    const withDistance = systems.map(system => {
      const dx = system.x - home.x;
      const dy = system.y - home.y;
      return { name: system.name, distance: Math.sqrt(dx * dx + dy * dy) };
    });
    const nearest = [...withDistance]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
    const nearNames = new Set(nearest.map(system => system.name));
    const near = nearest
      .map(system => ({
        name: system.name,
        jumps: system.distance < 0.01 ? 0 : Math.ceil(system.distance / 30),
      }))
      .sort((a, b) => byName(a.name, b.name));
    const rest = withDistance
      .filter(system => !nearNames.has(system.name))
      .map(system => system.name)
      .sort(byName);
    return res.json({ home: home.name, near, rest });
  });

  return router;
};
