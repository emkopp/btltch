'use strict';

const STAFF_TYPES = Object.freeze(['engineer', 'medical', 'support']);
const TIER_COSTS = Object.freeze([20, 40, 80]);

function createSkillTree({ staffType, tree, names, descriptions, effects }) {
  return names.map((name, index) => {
    const id = `${staffType}-${tree}-${index + 1}`;
    return {
      id,
      name,
      staffType,
      tree: `${staffType}-${tree}`,
      tier: index + 1,
      cost: TIER_COSTS[index],
      description: descriptions[index],
      prerequisite: index ? `${staffType}-${tree}-${index}` : null,
      effect: effects[index],
    };
  });
}

const DEFAULT_STAFF_SKILLS = Object.freeze([
  ...createSkillTree({
    staffType: 'engineer',
    tree: 'field-repair',
    names: ['Field Repair Training', 'Advanced Field Repair', 'Master Field Engineer'],
    descriptions: [
      'Organizes rapid battlefield repairs and reduces routine repair time by 10%.',
      'Develops advanced diagnostic and repair procedures, reducing repair time by another 15%.',
      'Coordinates master-level repair teams, reducing repair time by another 25%.',
    ],
    effects: [
      { label: 'Repair time', key: 'repairTimeModifierPct', value: -10, unit: '%' },
      { label: 'Repair time', key: 'repairTimeModifierPct', value: -15, unit: '%' },
      { label: 'Repair time', key: 'repairTimeModifierPct', value: -25, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'engineer',
    tree: 'refit',
    names: ['Refit Technician', 'Refit Specialist', 'Master Refit Engineer'],
    descriptions: [
      'Plans common equipment swaps and reduces refit time by 10%.',
      'Handles structural and advanced component work, reducing refit time by another 15%.',
      'Leads the most complex refits, reducing refit time by another 25%.',
    ],
    effects: [
      { label: 'Refit time', key: 'refitTimeModifierPct', value: -10, unit: '%' },
      { label: 'Refit time', key: 'refitTimeModifierPct', value: -15, unit: '%' },
      { label: 'Refit time', key: 'refitTimeModifierPct', value: -25, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'engineer',
    tree: 'salvage',
    names: ['Salvage Assessment', 'Salvage Recovery', 'Lostech Recovery'],
    descriptions: [
      'Identifies reusable battlefield components and improves salvage recovery by 5%.',
      'Directs careful extraction of damaged systems and improves salvage recovery by another 10%.',
      'Recognizes and preserves rare technology, improving salvage recovery by another 15%.',
    ],
    effects: [
      { label: 'Salvage recovery', key: 'salvageRecoveryModifierPct', value: 5, unit: '%' },
      { label: 'Salvage recovery', key: 'salvageRecoveryModifierPct', value: 10, unit: '%' },
      { label: 'Salvage recovery', key: 'salvageRecoveryModifierPct', value: 15, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'medical',
    tree: 'trauma',
    names: ['Trauma Care', 'Combat Surgery', 'Master Trauma Surgeon'],
    descriptions: [
      'Improves immediate treatment and reduces injury recovery time by 10%.',
      'Provides advanced surgical care, reducing injury recovery time by another 15%.',
      'Leads elite trauma treatment, reducing injury recovery time by another 25%.',
    ],
    effects: [
      { label: 'Injury recovery time', key: 'injuryRecoveryModifierPct', value: -10, unit: '%' },
      { label: 'Injury recovery time', key: 'injuryRecoveryModifierPct', value: -15, unit: '%' },
      { label: 'Injury recovery time', key: 'injuryRecoveryModifierPct', value: -25, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'medical',
    tree: 'field-medicine',
    names: ['Field Medicine', 'Combat Stabilization', 'Master Field Medic'],
    descriptions: [
      'Provides disciplined first response, adding 1 to casualty stabilization checks.',
      'Coordinates battlefield triage, adding another 2 to casualty stabilization checks.',
      'Directs expert emergency care, adding another 3 to casualty stabilization checks.',
    ],
    effects: [
      { label: 'Stabilization checks', key: 'stabilizationModifier', value: 1 },
      { label: 'Stabilization checks', key: 'stabilizationModifier', value: 2 },
      { label: 'Stabilization checks', key: 'stabilizationModifier', value: 3 },
    ],
  }),
  ...createSkillTree({
    staffType: 'medical',
    tree: 'rehabilitation',
    names: ['Rehabilitation', 'Advanced Rehabilitation', 'Prosthetics Specialist'],
    descriptions: [
      'Creates recovery plans that reduce rehabilitation time by 10%.',
      'Uses advanced therapy to reduce rehabilitation time by another 15%.',
      'Integrates prosthetics and long-term care, reducing rehabilitation time by another 25%.',
    ],
    effects: [
      { label: 'Rehabilitation time', key: 'rehabilitationTimeModifierPct', value: -10, unit: '%' },
      { label: 'Rehabilitation time', key: 'rehabilitationTimeModifierPct', value: -15, unit: '%' },
      { label: 'Rehabilitation time', key: 'rehabilitationTimeModifierPct', value: -25, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'support',
    tree: 'logistics',
    names: ['Logistics Training', 'Supply Coordinator', 'Master Logistician'],
    descriptions: [
      'Reduces recurring maintenance and supply costs by 5%.',
      'Optimizes company supply lines, reducing maintenance and supply costs by another 10%.',
      'Runs an elite logistics network, reducing maintenance and supply costs by another 15%.',
    ],
    effects: [
      { label: 'Maintenance cost', key: 'maintenanceCostModifierPct', value: -5, unit: '%' },
      { label: 'Maintenance cost', key: 'maintenanceCostModifierPct', value: -10, unit: '%' },
      { label: 'Maintenance cost', key: 'maintenanceCostModifierPct', value: -15, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'support',
    tree: 'procurement',
    names: ['Procurement Training', 'Market Specialist', 'Master Quartermaster'],
    descriptions: [
      'Uses supplier contacts to reduce equipment purchase costs by 5%.',
      'Negotiates favorable market terms, reducing purchase costs by another 10%.',
      'Maintains exceptional supplier networks, reducing purchase costs by another 15%.',
    ],
    effects: [
      { label: 'Purchase cost', key: 'purchaseCostModifierPct', value: -5, unit: '%' },
      { label: 'Purchase cost', key: 'purchaseCostModifierPct', value: -10, unit: '%' },
      { label: 'Purchase cost', key: 'purchaseCostModifierPct', value: -15, unit: '%' },
    ],
  }),
  ...createSkillTree({
    staffType: 'support',
    tree: 'contracts',
    names: ['Contract Administration', 'Contract Negotiator', 'Master Administrator'],
    descriptions: [
      'Improves contract preparation and increases negotiated contract pay by 5%.',
      'Uses negotiation expertise to increase contract pay by another 10%.',
      'Leverages an exceptional reputation and network to increase contract pay by another 15%.',
    ],
    effects: [
      { label: 'Contract pay', key: 'contractPayModifierPct', value: 5, unit: '%' },
      { label: 'Contract pay', key: 'contractPayModifierPct', value: 10, unit: '%' },
      { label: 'Contract pay', key: 'contractPayModifierPct', value: 15, unit: '%' },
    ],
  }),
]);

function ensureDefaultStaffSkills(store) {
  for (const skill of DEFAULT_STAFF_SKILLS) {
    const id = `staffSkill:${skill.id}`;
    if (!store.get(id)) store.put({ ...skill, _id: id, _type: 'staffSkill' });
  }
  for (const staff of store.list('staff')) {
    if (Array.isArray(staff.skills)
        && Number.isFinite(staff.xp)
        && Number.isFinite(staff.xpSpent)) continue;
    store.put({
      ...staff,
      xp: Number(staff.xp) || 0,
      xpSpent: Number(staff.xpSpent) || 0,
      xpEarned: Number(staff.xpEarned) || 0,
      skills: Array.isArray(staff.skills) ? staff.skills : [],
    });
  }
}

function listStaffSkills(store, staffType) {
  return store.list('staffSkill')
    .filter(skill => !staffType || skill.staffType === staffType)
    .sort((a, b) => a.tree.localeCompare(b.tree) || a.tier - b.tier);
}

function purchasedSkills(staff) {
  return Array.isArray(staff.skills) ? staff.skills : [];
}

function findStaffSkill(store, skillId) {
  const id = String(skillId || '').replace(/^staffSkill:/, '');
  return store.get(`staffSkill:${id}`);
}

function skillAvailability(store, staff, skill) {
  const owned = purchasedSkills(staff);
  if (skill.staffType !== staff.staffType) {
    return { available: false, reason: `Only ${skill.staffType} staff can purchase this skill` };
  }
  if (owned.some(purchase => purchase.id === skill.id)) {
    return { available: false, reason: 'Already purchased' };
  }
  if (skill.prerequisite && !owned.some(purchase => purchase.id === skill.prerequisite)) {
    const prerequisite = findStaffSkill(store, skill.prerequisite);
    return {
      available: false,
      reason: `Requires ${prerequisite ? prerequisite.name : skill.prerequisite}`,
    };
  }
  if ((Number(staff.xp) || 0) < skill.cost) {
    return {
      available: false,
      reason: `Needs ${skill.cost - (Number(staff.xp) || 0)} more XP`,
    };
  }
  return { available: true, reason: null };
}

function aggregateStaffEffects(staff) {
  const effects = {};
  for (const purchase of purchasedSkills(staff)) {
    const effect = purchase.effect;
    if (!effect || !effect.key || !Number.isFinite(effect.value)) continue;
    effects[effect.key] = (effects[effect.key] || 0) + effect.value;
  }
  return effects;
}

function staffCard(store, staff) {
  const catalog = listStaffSkills(store, staff.staffType).map(skill => ({
    ...skill,
    ...skillAvailability(store, staff, skill),
  }));
  return {
    staff,
    skills: purchasedSkills(staff).map(purchase => {
      const current = findStaffSkill(store, purchase.id);
      return current
        ? { ...purchase, name: current.name, description: current.description, effect: current.effect }
        : purchase;
    }),
    catalog,
    operationalEffects: aggregateStaffEffects(staff),
  };
}

function purchaseStaffSkill(store, staff, skillId) {
  const skill = findStaffSkill(store, skillId);
  if (!skill) throw new Error('Unknown staff skill');
  const availability = skillAvailability(store, staff, skill);
  if (!availability.available) throw new Error(availability.reason);
  const purchase = {
    id: skill.id,
    name: skill.name,
    staffType: skill.staffType,
    tree: skill.tree,
    tier: skill.tier,
    cost: skill.cost,
    description: skill.description,
    effect: skill.effect,
    purchasedAt: new Date().toISOString(),
  };
  return store.put({
    ...staff,
    xp: (Number(staff.xp) || 0) - skill.cost,
    xpSpent: (Number(staff.xpSpent) || 0) + skill.cost,
    skills: [...purchasedSkills(staff), purchase],
  });
}

module.exports = {
  DEFAULT_STAFF_SKILLS,
  STAFF_TYPES,
  aggregateStaffEffects,
  ensureDefaultStaffSkills,
  listStaffSkills,
  purchaseStaffSkill,
  staffCard,
};
