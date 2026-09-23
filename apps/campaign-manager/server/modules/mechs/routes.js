'use strict';

const express = require('express');

module.exports = function createMechRouter({ store, broadcast }) {
  const router = express.Router();

  router.get('/api/stable', (req, res) => {
    const stable = store.list('mech').map(mech => ({
      ...mech,
      pilot: mech.pilotId ? store.get(mech.pilotId) : null,
      design: mech.designId ? store.get(mech.designId) : null,
    }));
    res.json(stable);
  });

  router.put('/api/mech/:id/state', (req, res) => {
    const mech = store.get(`mech:${req.params.id}`);
    if (!mech) return res.status(404).json({ error: 'Mech not found' });
    const body = req.body || {};
    const next = { ...mech };
    if (body.state !== undefined) next.state = body.state;
    if (body.condition !== undefined) next.condition = body.condition;
    const saved = store.put(next);
    broadcast('mech-state', {
      id: saved._id,
      state: saved.state ?? null,
      rev: saved._rev,
      origin: req.get('X-Client-Id') || null,
    });
    res.json(saved);
  });

  return router;
};
