'use strict';

const express = require('express');
const {
  ensureDefaultPerks,
  listPerks,
  pilotCard,
  purchasePerk,
} = require('./perks');

const SCOPES = new Set(['chassis', 'weightClass', 'weapon']);
const EFFECT_NAMES = new Set([
  'gunneryModifier',
  'pilotingModifier',
  'laserAttackModifier',
  'missileAttackModifier',
  'ppcAttackModifier',
  'autocannonAttackModifier',
  'meleeAttackModifier',
  'longRangeModifier',
  'recoilModifier',
  'terrainPilotingModifier',
  'jumpDistanceModifier',
  'defensiveMovementModifier',
  'heatGeneratedModifier',
  'heatPenaltyModifier',
  'initiativeModifier',
  'lightWoodsFreeRollMax',
  'heavyWoodsFreeRollMax',
  'lightRubbleFreeRollMax',
  'heavyRubbleFreeRollMax',
  'oneLevelFreeRollMax',
  'twoLevelsFreeRollMax',
  'threeLevelsFreeRollMax',
  'separateElevationRollPerLevel',
]);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function requiredText(value, label, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) {
    throw new Error(`${label} is required and must be at most ${maxLength} characters`);
  }
  return text;
}

function createPerkDocument(store, body) {
  const name = requiredText(body && body.name, 'Perk name', 80);
  const category = requiredText(body && body.category, 'Category', 40);
  const description = requiredText(body && body.description, 'Description', 500);
  const id = slugify(body && body.id ? body.id : name);
  if (!id) throw new Error('Perk ID must contain letters or numbers');
  if (store.get(`perk:${id}`)) throw new Error(`Perk ID already exists: ${id}`);

  const cost = Number(body && body.cost);
  if (!Number.isInteger(cost) || cost < 1 || cost > 10000) {
    throw new Error('Perk cost must be a whole number from 1 to 10,000');
  }
  const effectName = String(body && body.effectName || '');
  if (!EFFECT_NAMES.has(effectName)) throw new Error('Unknown perk effect');
  const effectValue = Number(body && body.effectValue);
  if (!Number.isInteger(effectValue) || effectValue === 0 || effectValue < -20 || effectValue > 20) {
    throw new Error('Effect value must be a non-zero whole number from -20 to 20');
  }

  const scopeValue = String(body && body.scope || '');
  const scope = scopeValue ? scopeValue : null;
  if (scope && !SCOPES.has(scope)) throw new Error('Unknown perk scope');

  const prerequisite = body && body.prerequisite
    ? slugify(body.prerequisite)
    : null;
  if (prerequisite && !store.get(`perk:${prerequisite}`)) {
    throw new Error(`Unknown prerequisite: ${prerequisite}`);
  }
  const tree = body && body.tree ? slugify(body.tree) : null;
  const tier = tree ? Number(body && body.tier) : null;
  if (tree && (!Number.isInteger(tier) || tier < 1 || tier > 10)) {
    throw new Error('Tree tier must be a whole number from 1 to 10');
  }

  return {
    _id: `perk:${id}`,
    _type: 'perk',
    id,
    name,
    category,
    cost,
    description,
    ...(scope ? { scope } : {}),
    ...(prerequisite ? { prerequisite } : {}),
    ...(body && body.matchPrerequisiteWeightClass ? { matchPrerequisiteWeightClass: true } : {}),
    ...(tree ? { tree, tier } : {}),
    effect: { [effectName]: effectValue },
  };
}

module.exports = function createPilotRouter({ store }) {
  const router = express.Router();
  ensureDefaultPerks(store);

  router.get('/api/pilot-perks', (req, res) => {
    res.json(listPerks(store));
  });

  router.post('/api/pilot-perks', (req, res) => {
    try {
      store.put(createPerkDocument(store, req.body));
      return res.status(201).json(listPerks(store));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get('/api/pilot/:id/card', (req, res) => {
    const pilot = store.get(`pilot:${req.params.id}`);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    return res.json(pilotCard(store, pilot));
  });

  router.post('/api/pilot/:id/perks', (req, res) => {
    const pilot = store.get(`pilot:${req.params.id}`);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    try {
      const saved = purchasePerk(
        store,
        pilot,
        req.body && req.body.perkId,
        req.body && req.body.scope,
      );
      return res.json(pilotCard(store, saved));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post('/api/pilots/xp/reset', (req, res) => {
    const reset = store.list('pilot').map(pilot => store.put({ ...pilot, xp: 0 }));
    return res.json({ reset: reset.length });
  });

  router.post('/api/pilots/xp/add', (req, res) => {
    const contractId = req.body && req.body.contractId
      ? String(req.body.contractId)
      : null;
    const contract = contractId
      ? store.get(contractId.startsWith('contract:') ? contractId : `contract:${contractId}`)
      : null;
    if (contractId && !contract) {
      return res.status(400).json({ error: 'Selected completed mission does not exist' });
    }
    if (contract && contract.status !== 'Completed') {
      return res.status(400).json({ error: 'Mission XP can only be awarded after completion' });
    }
    if (contract && contract.xpAwarded) {
      return res.status(400).json({ error: 'Mission XP has already been awarded' });
    }
    const amount = contract ? Number(contract.xpAward) : Number(req.body && req.body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
      return res.status(400).json({ error: 'XP amount must be a whole number from 1 to 10,000' });
    }
    const pilotIds = [...new Set(Array.isArray(req.body && req.body.pilotIds)
      ? req.body.pilotIds.map(value => String(value))
      : [])];
    if (!pilotIds.length) {
      return res.status(400).json({ error: 'Select at least one pilot' });
    }
    const pilots = pilotIds.map(id => store.get(id.startsWith('pilot:') ? id : `pilot:${id}`));
    if (pilots.some(pilot => !pilot)) {
      return res.status(400).json({ error: 'One or more selected pilots do not exist' });
    }
    const saveAll = store.db.transaction(() => {
      const savedPilots = pilots.map(pilot => store.put({
        ...pilot,
        xp: (pilot.xp || 0) + amount,
        xpEarned: (pilot.xpEarned || 0) + amount,
      }));
      const savedContract = contract ? store.put({
        ...contract,
        xpAwarded: true,
        xpAwardedAt: new Date().toISOString(),
        xpAwardedTo: savedPilots.map(pilot => pilot._id),
      }) : null;
      return { savedPilots, savedContract };
    });
    const saved = saveAll();
    return res.json({
      amount,
      pilots: saved.savedPilots,
      contract: saved.savedContract,
    });
  });

  router.post('/api/pilot/:id/xp', (req, res) => {
    const pilot = store.get(`pilot:${req.params.id}`);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    const amount = Number(req.body && req.body.amount);
    const operation = String(req.body && req.body.operation || 'add');
    if (!['add', 'remove', 'set'].includes(operation)) {
      return res.status(400).json({ error: 'XP operation must be add, remove, or set' });
    }
    const minimum = operation === 'set' ? 0 : 1;
    if (!Number.isInteger(amount) || amount < minimum || amount > 10000) {
      return res.status(400).json({
        error: `XP amount must be a whole number from ${minimum} to 10,000`,
      });
    }
    const currentXp = Number(pilot.xp) || 0;
    const nextXp = operation === 'set'
      ? amount
      : operation === 'remove' ? Math.max(0, currentXp - amount) : currentXp + amount;
    return res.json(store.put({
      ...pilot,
      xp: nextXp,
      xpEarned: operation === 'add' ? (pilot.xpEarned || 0) + amount : (pilot.xpEarned || 0),
    }));
  });

  return router;
};
