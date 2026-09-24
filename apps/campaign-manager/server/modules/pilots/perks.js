'use strict';

function createWeaponMasteryTree({ id, name, effect }) {
  const category = 'Weapon Mastery';
  return [
    {
      id: `${id}-specialist-chassis`,
      name: `${name} Specialist`,
      category,
      cost: 30,
      description: `Reduce the attack target number by 1 with ${name} attacks in one selected BattleMech chassis.`,
      scope: 'chassis',
      tree: `weapon-${id}`,
      tier: 1,
      effect: { [effect]: -1 },
    },
    {
      id: `${id}-specialist-class`,
      name: `Class ${name} Specialist`,
      category,
      cost: 60,
      description: `Reduce the attack target number by 1 with ${name} attacks in one selected weight class. Requires mastery of a chassis in that class.`,
      scope: 'weightClass',
      prerequisite: `${id}-specialist-chassis`,
      matchPrerequisiteWeightClass: true,
      tree: `weapon-${id}`,
      tier: 2,
      effect: { [effect]: -1 },
    },
    {
      id: `${id}-mastery-all`,
      name: `All-Mech ${name} Mastery`,
      category,
      cost: 120,
      description: `Reduce the attack target number by 1 with ${name} attacks in every BattleMech. Requires mastery of a weight class.`,
      prerequisite: `${id}-specialist-class`,
      tree: `weapon-${id}`,
      tier: 3,
      effect: { [effect]: -1 },
    },
  ];
}

const DEFAULT_PERKS = Object.freeze([
  {
    id: 'gunnery-mech-specialist',
    name: 'Mech Gunnery Specialist',
    category: 'Gunnery',
    cost: 40,
    description: 'Reduce gunnery by 1 in one selected BattleMech chassis.',
    scope: 'chassis',
    tree: 'global-gunnery',
    tier: 1,
    effect: { gunneryModifier: -1 },
  },
  {
    id: 'gunnery-class-specialist',
    name: 'Class Gunnery Specialist',
    category: 'Gunnery',
    cost: 80,
    description: 'Reduce gunnery by 1 in one selected weight class. Requires mastery of a chassis in that class.',
    scope: 'weightClass',
    prerequisite: 'gunnery-mech-specialist',
    matchPrerequisiteWeightClass: true,
    tree: 'global-gunnery',
    tier: 2,
    effect: { gunneryModifier: -1 },
  },
  {
    id: 'gunnery-all-mechs',
    name: 'All-Mech Gunnery Mastery',
    category: 'Gunnery',
    cost: 160,
    description: 'Reduce gunnery by 1 in every BattleMech. Requires mastery of a weight class.',
    prerequisite: 'gunnery-class-specialist',
    tree: 'global-gunnery',
    tier: 3,
    effect: { gunneryModifier: -1 },
  },
  ...createWeaponMasteryTree({
    id: 'laser',
    name: 'Laser',
    effect: 'laserAttackModifier',
  }),
  ...createWeaponMasteryTree({
    id: 'missile',
    name: 'Missile',
    effect: 'missileAttackModifier',
  }),
  ...createWeaponMasteryTree({
    id: 'ppc',
    name: 'PPC',
    effect: 'ppcAttackModifier',
  }),
  ...createWeaponMasteryTree({
    id: 'autocannon',
    name: 'Autocannon',
    effect: 'autocannonAttackModifier',
  }),
  ...createWeaponMasteryTree({
    id: 'melee',
    name: 'Melee',
    effect: 'meleeAttackModifier',
  }),
  {
    id: 'weapon-specialist',
    name: 'Weapon Specialist',
    category: 'Gunnery',
    cost: 25,
    description: 'Reduce the gunnery target number by 1 with one selected weapon.',
    scope: 'weapon',
    effect: { gunneryModifier: -1 },
  },
  {
    id: 'long-range-marksman',
    name: 'Long-Range Marksman',
    category: 'Gunnery',
    cost: 30,
    description: 'Reduce the long-range modifier by 1.',
    effect: { longRangeModifier: -1 },
  },
  {
    id: 'recoil-control',
    name: 'Recoil Control',
    category: 'Gunnery',
    cost: 20,
    description: 'Reduce recoil penalties from autocannons and rapid-fire weapons by 1.',
    effect: { recoilModifier: -1 },
  },
  {
    id: 'piloting-mech-specialist',
    name: 'Mech Piloting Specialist',
    category: 'Piloting',
    cost: 20,
    description: 'Reduce piloting by 1 in one selected BattleMech chassis.',
    scope: 'chassis',
    tree: 'global-piloting',
    tier: 1,
    effect: { pilotingModifier: -1 },
  },
  {
    id: 'piloting-class-specialist',
    name: 'Class Piloting Specialist',
    category: 'Piloting',
    cost: 40,
    description: 'Reduce piloting by 1 in one selected weight class. Requires mastery of a chassis in that class.',
    scope: 'weightClass',
    prerequisite: 'piloting-mech-specialist',
    matchPrerequisiteWeightClass: true,
    tree: 'global-piloting',
    tier: 2,
    effect: { pilotingModifier: -1 },
  },
  {
    id: 'piloting-all-mechs',
    name: 'All-Mech Piloting Mastery',
    category: 'Piloting',
    cost: 80,
    description: 'Reduce piloting by 1 in every BattleMech. Requires mastery of a weight class.',
    prerequisite: 'piloting-class-specialist',
    tree: 'global-piloting',
    tier: 3,
    effect: { pilotingModifier: -1 },
  },
  {
    id: 'sure-footed',
    name: 'Sure-Footed',
    category: 'Piloting',
    cost: 30,
    description: 'Reduce difficult-terrain and fall piloting modifiers by 1.',
    effect: { terrainPilotingModifier: -1 },
  },
  {
    id: 'woodland-runner-chassis',
    name: 'Woodland Runner',
    category: 'Terrain',
    cost: 30,
    description: 'In one selected chassis, ignore the movement surcharge for light woods on a piloting roll of 10 or less, or heavy woods on 7 or less.',
    scope: 'chassis',
    tree: 'terrain-woods',
    tier: 1,
    effect: {
      lightWoodsFreeRollMax: 10,
      heavyWoodsFreeRollMax: 7,
    },
  },
  {
    id: 'woodland-runner-class',
    name: 'Class Woodland Runner',
    category: 'Terrain',
    cost: 60,
    description: 'Apply Woodland Runner to one selected weight class. Requires training in a chassis from that class.',
    scope: 'weightClass',
    prerequisite: 'woodland-runner-chassis',
    matchPrerequisiteWeightClass: true,
    tree: 'terrain-woods',
    tier: 2,
    effect: {
      lightWoodsFreeRollMax: 10,
      heavyWoodsFreeRollMax: 7,
    },
  },
  {
    id: 'woodland-runner-all',
    name: 'All-Mech Woodland Runner Mastery',
    category: 'Terrain',
    cost: 120,
    description: 'Apply Woodland Runner in every BattleMech. Requires training in a weight class.',
    prerequisite: 'woodland-runner-class',
    tree: 'terrain-woods',
    tier: 3,
    effect: {
      lightWoodsFreeRollMax: 10,
      heavyWoodsFreeRollMax: 7,
    },
  },
  {
    id: 'rubble-runner-chassis',
    name: 'Rubble Runner',
    category: 'Terrain',
    cost: 30,
    description: 'In one selected chassis, ignore the movement surcharge for light rubble on a piloting roll of 10 or less, or heavy rubble on 7 or less.',
    scope: 'chassis',
    tree: 'terrain-rubble',
    tier: 1,
    effect: {
      lightRubbleFreeRollMax: 10,
      heavyRubbleFreeRollMax: 7,
    },
  },
  {
    id: 'rubble-runner-class',
    name: 'Class Rubble Runner',
    category: 'Terrain',
    cost: 60,
    description: 'Apply Rubble Runner to one selected weight class. Requires training in a chassis from that class.',
    scope: 'weightClass',
    prerequisite: 'rubble-runner-chassis',
    matchPrerequisiteWeightClass: true,
    tree: 'terrain-rubble',
    tier: 2,
    effect: {
      lightRubbleFreeRollMax: 10,
      heavyRubbleFreeRollMax: 7,
    },
  },
  {
    id: 'rubble-runner-all',
    name: 'All-Mech Rubble Runner Mastery',
    category: 'Terrain',
    cost: 120,
    description: 'Apply Rubble Runner in every BattleMech. Requires training in a weight class.',
    prerequisite: 'rubble-runner-class',
    tree: 'terrain-rubble',
    tier: 3,
    effect: {
      lightRubbleFreeRollMax: 10,
      heavyRubbleFreeRollMax: 7,
    },
  },
  {
    id: 'elevation-expert-chassis',
    name: 'Elevation Expert',
    category: 'Terrain',
    cost: 40,
    description: 'In one selected chassis, roll separately for every level climbed: first level on 10 or less, second on 7 or less, and third on 5 or less. Each success removes that level’s movement surcharge.',
    scope: 'chassis',
    tree: 'terrain-elevation',
    tier: 1,
    effect: {
      oneLevelFreeRollMax: 10,
      twoLevelsFreeRollMax: 7,
      threeLevelsFreeRollMax: 5,
      separateElevationRollPerLevel: 1,
    },
  },
  {
    id: 'elevation-expert-class',
    name: 'Class Elevation Expert',
    category: 'Terrain',
    cost: 80,
    description: 'Apply Elevation Expert to one selected weight class. Requires training in a chassis from that class.',
    scope: 'weightClass',
    prerequisite: 'elevation-expert-chassis',
    matchPrerequisiteWeightClass: true,
    tree: 'terrain-elevation',
    tier: 2,
    effect: {
      oneLevelFreeRollMax: 10,
      twoLevelsFreeRollMax: 7,
      threeLevelsFreeRollMax: 5,
      separateElevationRollPerLevel: 1,
    },
  },
  {
    id: 'elevation-expert-all',
    name: 'All-Mech Elevation Expert Mastery',
    category: 'Terrain',
    cost: 160,
    description: 'Apply Elevation Expert in every BattleMech. Requires training in a weight class.',
    prerequisite: 'elevation-expert-class',
    tree: 'terrain-elevation',
    tier: 3,
    effect: {
      oneLevelFreeRollMax: 10,
      twoLevelsFreeRollMax: 7,
      threeLevelsFreeRollMax: 5,
      separateElevationRollPerLevel: 1,
    },
  },
  {
    id: 'jump-ace',
    name: 'Jump Ace',
    category: 'Mobility',
    cost: 30,
    description: 'Increase maximum jump distance by 1 hex.',
    requirement: 'jump-capable',
    effect: { jumpDistanceModifier: 1 },
  },
  {
    id: 'evasive-movement',
    name: 'Evasive Movement',
    category: 'Mobility',
    cost: 35,
    description: 'Gain +1 defensive movement modifier after moving at least 5 hexes.',
    effect: { defensiveMovementModifier: 1 },
  },
  {
    id: 'heat-management',
    name: 'Heat Management',
    category: 'Systems',
    cost: 25,
    description: 'Reduce heat generated each combat round by 1, to a minimum of 0.',
    effect: { heatGeneratedModifier: -1 },
  },
  {
    id: 'cool-under-fire',
    name: 'Cool Under Fire',
    category: 'Systems',
    cost: 20,
    description: 'Reduce heat-related gunnery and piloting penalties by 1.',
    prerequisite: 'heat-management',
    effect: { heatPenaltyModifier: -1 },
  },
  {
    id: 'combat-reflexes',
    name: 'Combat Reflexes',
    category: 'Command',
    cost: 35,
    description: 'Add 1 to personal initiative rolls.',
    effect: { initiativeModifier: 1 },
  },
]);

const WEIGHT_CLASSES = Object.freeze(['Light', 'Medium', 'Heavy', 'Assault']);
const NON_STACKING_THRESHOLDS = new Set([
  'lightWoodsFreeRollMax',
  'heavyWoodsFreeRollMax',
  'lightRubbleFreeRollMax',
  'heavyRubbleFreeRollMax',
  'oneLevelFreeRollMax',
  'twoLevelsFreeRollMax',
  'threeLevelsFreeRollMax',
  'separateElevationRollPerLevel',
]);

function ensureDefaultPerks(store) {
  const existing = new Set(store.list('perk').map(perk => perk.id));
  for (const perk of DEFAULT_PERKS) {
    if (existing.has(perk.id)) continue;
    store.put({
      _id: `perk:${perk.id}`,
      _type: 'perk',
      ...perk,
    });
  }
}

function listPerks(store) {
  ensureDefaultPerks(store);
  return store.list('perk').map(document => {
    const { _id, _type, _rev, _updatedAt, type, ...perk } = document;
    return perk;
  });
}

function findPerk(store, perkId) {
  return listPerks(store).find(perk => perk.id === perkId) || null;
}

function purchasedPerks(pilot) {
  return Array.isArray(pilot.perks) ? pilot.perks : [];
}

function scopeLabel(scope) {
  if (!scope) return null;
  return scope.value || null;
}

function scopedEffectApplies(purchase, mech, weaponName) {
  if (!purchase.scope) return true;
  if (!mech) return false;
  if (purchase.scope.type === 'chassis') {
    return String(mech.chassis || '').toLowerCase() === String(purchase.scope.value).toLowerCase();
  }
  if (purchase.scope.type === 'weightClass') {
    return String(mech.weightClass || '').toLowerCase() === String(purchase.scope.value).toLowerCase();
  }
  if (purchase.scope.type === 'weapon') {
    return weaponName
      && String(weaponName).toLowerCase() === String(purchase.scope.value).toLowerCase();
  }
  return false;
}

function aggregateEffects(pilot, mech, weaponName) {
  const effects = {};
  for (const purchase of purchasedPerks(pilot)) {
    if (!scopedEffectApplies(purchase, mech, weaponName)) continue;
    for (const [name, value] of Object.entries(purchase.effect || {})) {
      effects[name] = NON_STACKING_THRESHOLDS.has(name)
        ? Math.max(effects[name] || 0, value)
        : (effects[name] || 0) + value;
    }
  }
  return effects;
}

function purchaseKey(perkId, scope) {
  return `${perkId}:${scope ? `${scope.type}:${String(scope.value).toLowerCase()}` : 'global'}`;
}

function perkOptions(store, perk) {
  if (perk.scope === 'weightClass') return WEIGHT_CLASSES;
  if (perk.scope === 'chassis') {
    return [...new Set([
      ...store.list('design').map(design => design.class),
      ...store.list('mech').map(mech => mech.chassis),
    ].filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }
  if (perk.scope === 'weapon') {
    return [...new Set(store.list('weapon').map(weapon => weapon.name).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }
  return [];
}

function assignedMech(store, pilotId) {
  return store.list('mech').find(mech => mech.pilotId === pilotId) || null;
}

function chassisWeightClass(store, chassis) {
  const normalized = String(chassis).toLowerCase();
  const owned = store.list('mech').find(mech => (
    String(mech.chassis || '').toLowerCase() === normalized
  ));
  if (owned && owned.weightClass) return owned.weightClass;
  const design = store.list('design').find(item => (
    String(item.class || '').toLowerCase() === normalized
  ));
  return design ? design.weightClass : null;
}

function hasMatchingChassisTier(store, pilot, prerequisiteId, weightClass) {
  return purchasedPerks(pilot)
    .filter(purchase => purchase.id === prerequisiteId && purchase.scope)
    .some(purchase => (
      String(chassisWeightClass(store, purchase.scope.value)).toLowerCase()
      === String(weightClass).toLowerCase()
    ));
}

function perkAvailability(store, pilot, perk, mech) {
  const owned = purchasedPerks(pilot);
  if (perk.prerequisite && !owned.some(purchase => purchase.id === perk.prerequisite)) {
    const required = findPerk(store, perk.prerequisite);
    return { available: false, reason: `Requires ${required ? required.name : perk.prerequisite}` };
  }
  if (perk.requirement === 'jump-capable' && (!mech || !(mech.move && mech.move.jump > 0))) {
    return { available: false, reason: 'Requires assignment to a jump-capable BattleMech' };
  }
  if ((pilot.xp || 0) < perk.cost) {
    return { available: false, reason: `Needs ${perk.cost - (pilot.xp || 0)} more XP` };
  }
  return { available: true, reason: null };
}

function lockedOptions(store, pilot, perk, options) {
  if (!perk.matchPrerequisiteWeightClass) return {};
  return Object.fromEntries(options
    .filter(option => !hasMatchingChassisTier(store, pilot, perk.prerequisite, option))
    .map(option => [option, `First master a ${option} chassis`]));
}

function pilotCard(store, pilot) {
  const mech = assignedMech(store, pilot._id);
  const ownedKeys = new Set(purchasedPerks(pilot).map(purchase => (
    purchaseKey(purchase.id, purchase.scope)
  )));
  const catalog = listPerks(store).map(perk => {
    const options = perkOptions(store, perk);
    const availability = perkAvailability(store, pilot, perk, mech);
    const purchasedGlobally = !perk.scope && ownedKeys.has(purchaseKey(perk.id));
    return {
      ...perk,
      options,
      lockedOptions: lockedOptions(store, pilot, perk, options),
      purchased: purchasedGlobally,
      ...availability,
      available: availability.available && !purchasedGlobally,
      reason: purchasedGlobally ? 'Already purchased' : availability.reason,
    };
  });
  return {
    pilot,
    assignedMech: mech,
    perks: purchasedPerks(pilot).map(purchase => {
      const current = findPerk(store, purchase.id);
      return current ? { ...purchase, name: current.name, description: current.description } : purchase;
    }),
    catalog,
    combatEffects: aggregateEffects(pilot, mech),
  };
}

function validateScope(store, perk, scope) {
  if (!perk.scope) {
    if (scope !== undefined && scope !== null) throw new Error('This perk does not accept a scope');
    return null;
  }
  if (!scope || scope.type !== perk.scope || typeof scope.value !== 'string' || !scope.value.trim()) {
    throw new Error(`This perk requires a ${perk.scope} selection`);
  }
  const options = perkOptions(store, perk);
  const selected = options.find(option => (
    option.toLowerCase() === scope.value.trim().toLowerCase()
  ));
  if (!selected) throw new Error(`Unknown ${perk.scope}: ${scope.value}`);
  return { type: perk.scope, value: selected };
}

function validateProgression(store, pilot, perk, scope) {
  if (perk.matchPrerequisiteWeightClass
      && !hasMatchingChassisTier(store, pilot, perk.prerequisite, scope.value)) {
    const prerequisite = findPerk(store, perk.prerequisite);
    throw new Error(`First purchase ${prerequisite.name} for a ${scope.value} chassis`);
  }
}

function purchasePerk(store, pilot, perkId, requestedScope) {
  const perk = findPerk(store, perkId);
  if (!perk) throw new Error('Unknown perk');
  const mech = assignedMech(store, pilot._id);
  const scope = validateScope(store, perk, requestedScope);
  const key = purchaseKey(perk.id, scope);
  if (purchasedPerks(pilot).some(purchase => purchaseKey(purchase.id, purchase.scope) === key)) {
    throw new Error('Pilot already owns this perk for the selected scope');
  }
  const availability = perkAvailability(store, pilot, perk, mech);
  if (!availability.available) throw new Error(availability.reason);
  validateProgression(store, pilot, perk, scope);

  const purchase = {
    id: perk.id,
    name: perk.name,
    category: perk.category,
    cost: perk.cost,
    description: perk.description,
    scope,
    scopeLabel: scopeLabel(scope),
    effect: perk.effect,
    purchasedAt: new Date().toISOString(),
  };
  return store.put({
    ...pilot,
    xp: (pilot.xp || 0) - perk.cost,
    xpSpent: (pilot.xpSpent || 0) + perk.cost,
    perks: [...purchasedPerks(pilot), purchase],
  });
}

module.exports = {
  DEFAULT_PERKS,
  aggregateEffects,
  ensureDefaultPerks,
  listPerks,
  pilotCard,
  purchasePerk,
};
