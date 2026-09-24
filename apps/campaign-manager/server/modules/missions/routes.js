'use strict';

const express = require('express');
const { computeTravel, systemMap } = require('../travel/service');

module.exports = function createMissionRouter({ store, crypto }) {
  const router = express.Router();

  router.get('/api/missions/available', (req, res) => {
    const company = store.get('company:main') || {};
    const systems = systemMap(store);
    const home = company.currentSystem
      ? systems.get(String(company.currentSystem).toLowerCase())
      : null;
    const missions = store.list('contract')
      .filter(contract => contract.visibleToMerc)
      .map(contract => ({
        ...contract,
        travel: computeTravel(home, contract.location, systems),
        homeSystem: company.currentSystem || null,
      }));
    res.json(missions);
  });

  router.post('/api/contract/:id/award', (req, res) => {
    const contractId = `contract:${req.params.id}`;
    const current = store.get(contractId);
    if (!current) return res.status(404).json({ error: 'Contract not found' });
    if (current.awarded) {
      return res.json({ alreadyAwarded: true, granted: [], contract: current });
    }

    const clock = store.get('clock:main') || {};
    const date = `${clock.year || 3025}-${String(clock.month || 1).padStart(2, '0')}-01`;
    const weaponNames = new Set(store.list('weapon').map(weapon => (
      String(weapon.name).toLowerCase()
    )));
    const designsByModel = new Map(store.list('design').map(design => (
      [String(design.model).toLowerCase(), design]
    )));
    const granted = [];

    for (const reward of (current.rewards || [])) {
      if (reward.kind === 'bonus' && reward.amount) {
        store.put({
          _id: `txn:${crypto.randomUUID()}`,
          type: 'txn',
          date,
          category: 'reward',
          description: `Contract reward — ${current.employer} (${current.missionType})`,
          amount: reward.amount,
        });
        granted.push({ kind: 'bonus', amount: reward.amount });
        continue;
      }

      if (reward.kind === 'rare') {
        const itemType = reward.itemType === 'weapon' ? 'weapon' : 'equipment';
        const baseName = String(reward.baseItemName || '').trim();
        const name = String(reward.name || '').trim()
          || `${reward.templateName || 'Rare'} ${baseName || itemType}`;
        const item = store.put({
          _id: `item:${crypto.randomUUID()}`,
          type: 'item',
          itemType,
          name,
          condition: 'functional',
          rarity: reward.rarity || 'Lostech',
          catalogId: null,
          baseItemName: baseName || null,
          rareTemplateId: reward.templateId || null,
          modifiers: reward.modifiers || {},
          source: 'contract reward',
          contractId: current._id,
        });
        granted.push({ kind: 'rare', name: item.name, itemType });
        continue;
      }

      const names = Array.isArray(reward.items)
        ? reward.items
        : (reward.description ? [reward.description] : []);
      for (const name of names) {
        if (!name) continue;
        if (reward.kind === 'mech') {
          const design = designsByModel.get(String(name).toLowerCase());
          store.put({
            _id: `mech:${crypto.randomUUID()}`,
            type: 'mech',
            designId: design ? design._id : null,
            variant: design ? design.model : name,
            chassis: design ? design.class : name,
            weightClass: design ? design.weightClass : '',
            tons: design ? design.tonnage : null,
            move: design ? design.movement : null,
            loadout: design
              ? (design.loadout || []).map(item => `${item.count}x ${item.name}`)
              : [],
            condition: 'salvage',
            pilotId: null,
            source: 'contract reward',
          });
          granted.push({ kind: 'mech', name: design ? `${design.class} ${design.model}` : name });
        } else {
          const itemType = weaponNames.has(String(name).toLowerCase())
            ? 'weapon'
            : 'equipment';
          store.put({
            _id: `item:${crypto.randomUUID()}`,
            type: 'item',
            itemType,
            name,
            condition: 'functional',
            source: 'contract reward',
          });
          granted.push({ kind: itemType, name });
        }
      }

    }

    const contract = store.put({
      ...current,
      status: 'Awarded',
      awarded: true,
      awardedAt: date,
    });
    return res.json({ awarded: true, granted, contract });
  });

  return router;
};
