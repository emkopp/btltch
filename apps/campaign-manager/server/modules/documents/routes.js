'use strict';

const express = require('express');

module.exports = function createDocumentRouter({ store, crypto }) {
  const router = express.Router();

  router.get('/api/:type', (req, res) => {
    res.json(store.list(req.params.type));
  });

  router.get('/api/:type/:id', (req, res) => {
    const document = store.get(`${req.params.type}:${req.params.id}`);
    if (!document) return res.status(404).json({ error: 'Not found' });
    return res.json(document);
  });

  router.post('/api/:type', (req, res) => {
    const { type } = req.params;
    const id = `${type}:${crypto.randomUUID()}`;
    try {
      return res.status(201).json(store.put({ ...req.body, _id: id, type }));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.put('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    try {
      return res.json(store.put({ ...req.body, _id: `${type}:${id}`, type }));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api/:type/:id', (req, res) => {
    const removed = store.remove(`${req.params.type}:${req.params.id}`);
    if (!removed) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  });

  return router;
};
