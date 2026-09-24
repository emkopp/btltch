'use strict';

const express = require('express');

function itemCategory(item, itemType) {
  const name = String(item.name || '').toLowerCase();
  if (/\bheat sink\b|coolant/.test(name)) return 'Cooling';
  if (/\blaser\b|\bppc\b|\bflamer\b|plasma/.test(name)) return 'Energy';
  if (item.missile || /\blrm\b|\bsrm\b|\bmrm\b|\batm\b|streak|narc|thunderbolt|rocket launcher/.test(name)) {
    return 'Missile';
  }
  if (/long tom|sniper|thumper|arrow iv/.test(name)) return 'Artillery';
  if (/autocannon|auto cannon|\bac[/ -]|lb \d|ultra ac|gauss rifle|machine gun|rifle/.test(name)) {
    return 'Ballistic';
  }
  if (/hatchet|sword|mace|claw|physical weapon/.test(name)) return 'Physical';
  if (/probe|ecm|\bc3\b|\btag\b|targeting|artemis|case|masc|anti-missile|anti-personnel/.test(name)) {
    return 'Electronics';
  }
  return itemType === 'equipment' ? 'General Equipment' : 'General Equipment';
}

module.exports = function createCatalogRouter({ store }) {
  const router = express.Router();

  router.get('/api/designs/list', (req, res) => {
    res.json(store.list('design')
      .map(design => ({
        model: design.model,
        class: design.class,
        weightClass: design.weightClass,
        tons: design.tonnage,
        techBase: design.techBase,
        technology: String(design.techBase || '').startsWith('CL') ? 'Clan' : 'Inner Sphere',
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
        items.push({
          name: weapon.name,
          itemType: 'weapon',
          category: itemCategory(weapon, 'weapon'),
        });
      }
    }
    for (const equipment of store.list('equipment')) {
      const key = String(equipment.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          name: equipment.name,
          itemType: 'equipment',
          category: itemCategory(equipment, 'equipment'),
        });
      }
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    res.json(items);
  });

  return router;
};
