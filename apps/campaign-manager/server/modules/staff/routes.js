'use strict';

const express = require('express');
const {
  STAFF_TYPES,
  ensureDefaultStaffSkills,
  listStaffSkills,
  purchaseStaffSkill,
  staffCard,
} = require('./skills');

const TIERS = Object.freeze({
  substandard: { rank: 1, modifier: 0.6 },
  normal: { rank: 2, modifier: 1 },
  expert: { rank: 3, modifier: 1.4 },
  epic: { rank: 4, modifier: 2 },
  legendary: { rank: 5, modifier: 3 },
});
const DIMENSIONS = Object.freeze({
  support: 'overhead & administration',
  engineer: 'repair & refit speed / complexity',
  medical: 'crew recovery speed',
});

function staffId(value) {
  const id = String(value || '');
  return id.startsWith('staff:') ? id : `staff:${id}`;
}

function requiredName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 100) {
    throw new Error('Staff name is required and must be at most 100 characters');
  }
  return name;
}

function normalizeStaff(body, existing = {}) {
  const staffType = String(body && body.staffType || '').toLowerCase();
  if (!STAFF_TYPES.includes(staffType)) throw new Error('Unknown staff type');
  if (existing.staffType
      && existing.staffType !== staffType
      && Array.isArray(existing.skills)
      && existing.skills.length) {
    throw new Error('Staff type cannot change after skills have been purchased');
  }
  const tier = String(body && body.tier || '').toLowerCase();
  if (!TIERS[tier]) throw new Error('Unknown staff tier');
  const rating = Number(body && body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    throw new Error('Staff rating must be a whole number from 1 to 10');
  }
  const monthlyCost = Number(body && body.monthlyCost);
  if (!Number.isInteger(monthlyCost) || monthlyCost < 0 || monthlyCost > 10000000) {
    throw new Error('Monthly cost must be a whole number from 0 to 10,000,000');
  }
  const tierDetails = TIERS[tier];
  return {
    ...existing,
    name: requiredName(body && body.name),
    staffType,
    monthlyCost,
    tier,
    tierRank: tierDetails.rank,
    outputModifier: tierDetails.modifier,
    dimension: DIMENSIONS[staffType],
    rating,
    specialSkills: Array.isArray(existing.specialSkills) ? existing.specialSkills : [],
    xp: Number(existing.xp) || 0,
    xpSpent: Number(existing.xpSpent) || 0,
    xpEarned: Number(existing.xpEarned) || 0,
    skills: Array.isArray(existing.skills) ? existing.skills : [],
  };
}

function validateXpOperation(body) {
  const operation = String(body && body.operation || 'add');
  if (!['add', 'remove', 'set'].includes(operation)) {
    throw new Error('XP operation must be add, remove, or set');
  }
  const amount = Number(body && body.amount);
  const minimum = operation === 'set' ? 0 : 1;
  if (!Number.isInteger(amount) || amount < minimum || amount > 10000) {
    throw new Error(`XP amount must be a whole number from ${minimum} to 10,000`);
  }
  return { operation, amount };
}

module.exports = function createStaffRouter({ store, crypto }) {
  const router = express.Router();
  ensureDefaultStaffSkills(store);

  router.get('/api/staff-skills', (req, res) => {
    const staffType = req.query.staffType ? String(req.query.staffType).toLowerCase() : null;
    if (staffType && !STAFF_TYPES.includes(staffType)) {
      return res.status(400).json({ error: 'Unknown staff type' });
    }
    return res.json(listStaffSkills(store, staffType));
  });

  router.post('/api/staff/xp/reset', (req, res) => {
    const resetAll = store.db.transaction(() => (
      store.list('staff').map(staff => store.put({ ...staff, xp: 0 }))
    ));
    return res.json({ reset: resetAll().length });
  });

  router.post('/api/staff/xp/add', (req, res) => {
    const amount = Number(req.body && req.body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
      return res.status(400).json({ error: 'XP amount must be a whole number from 1 to 10,000' });
    }
    const staffIds = [...new Set(Array.isArray(req.body && req.body.staffIds)
      ? req.body.staffIds.map(staffId)
      : [])];
    if (!staffIds.length) {
      return res.status(400).json({ error: 'Select at least one staff member' });
    }
    const staffMembers = staffIds.map(id => store.get(id));
    if (staffMembers.some(staff => !staff)) {
      return res.status(400).json({ error: 'One or more selected staff members do not exist' });
    }
    const saveAll = store.db.transaction(() => staffMembers.map(staff => store.put({
      ...staff,
      xp: (Number(staff.xp) || 0) + amount,
      xpEarned: (Number(staff.xpEarned) || 0) + amount,
    })));
    return res.json({ amount, staff: saveAll() });
  });

  router.get('/api/staff/:id/card', (req, res) => {
    const staff = store.get(staffId(req.params.id));
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    return res.json(staffCard(store, staff));
  });

  router.post('/api/staff/:id/skills', (req, res) => {
    const staff = store.get(staffId(req.params.id));
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    try {
      return res.json(staffCard(
        store,
        purchaseStaffSkill(store, staff, req.body && req.body.skillId),
      ));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post('/api/staff/:id/xp', (req, res) => {
    const staff = store.get(staffId(req.params.id));
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    try {
      const { operation, amount } = validateXpOperation(req.body);
      const currentXp = Number(staff.xp) || 0;
      const nextXp = operation === 'set'
        ? amount
        : operation === 'remove' ? Math.max(0, currentXp - amount) : currentXp + amount;
      return res.json(store.put({
        ...staff,
        xp: nextXp,
        xpEarned: operation === 'add'
          ? (Number(staff.xpEarned) || 0) + amount
          : (Number(staff.xpEarned) || 0),
      }));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get('/api/staff', (req, res) => res.json(store.list('staff')));

  router.post('/api/staff', (req, res) => {
    try {
      const doc = normalizeStaff(req.body);
      return res.status(201).json(store.put({
        ...doc,
        _id: `staff:${crypto.randomUUID()}`,
        _type: 'staff',
      }));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.put('/api/staff/:id', (req, res) => {
    const id = staffId(req.params.id);
    const existing = store.get(id);
    if (!existing) return res.status(404).json({ error: 'Staff member not found' });
    try {
      return res.json(store.put({
        ...normalizeStaff(req.body, existing),
        _id: id,
        _type: 'staff',
      }));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api/staff/:id', (req, res) => {
    if (!store.remove(staffId(req.params.id))) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    return res.status(204).end();
  });

  return router;
};
