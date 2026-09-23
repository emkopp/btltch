'use strict';

const express = require('express');

module.exports = function createCatalogRouter({ store }) {
  const router = express.Router();

  router.get('/api/designs/list', (req, res) => {
    res.json(store.list('design')
      .map(design => ({
        model: design.model,
        class: design.class,
        weightClass: design.weightClass,
        tons: design.tonnage,
      }))
      .sort((a, b) => String(a.model).localeCompare(String(b.model))));
  });

  router.get('/api/items/catalog', (req, res) => {
    const items = [];
    const seen = new Set();
    for (const weapon of store.list('weapon')) {
      const key = String(weapon.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ name: weapon.name, itemType: 'weapon' });
      }
    }
    for (const equipment of store.list('equipment')) {
      const key = String(equipment.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ name: equipment.name, itemType: 'equipment' });
      }
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    res.json(items);
  });

  return router;
};
