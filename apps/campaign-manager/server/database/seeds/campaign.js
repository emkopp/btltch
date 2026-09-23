'use strict';

// Seeds the document store with the mercenary command's starting assets: one company
// record plus the four 'Mechs with reference sheets. Safe to re-run —
// put() upserts by id.

const store = require('../db');
const crypto = require('crypto');

const company = {
  _id: 'company:main',
  type: 'company',
  name: 'Unnamed Command',
  founded: null,
  currentSystem: 'New India',
  color: '#7a1f1f',
  insignia: null,
  rating: { dragoon: null, experience: 'Regular', reputation: null },
  record: { wins: 0, losses: 0 },
};

const mechs = [
  {
    _id: `mech:${crypto.randomUUID()}`,
    type: 'mech',
    designId: 'design:bl6-knt',
    chassis: 'Black Knight',
    variant: 'BL6-KNT',
    weightClass: 'Heavy',
    tons: 75,
    move: { walk: 4, run: 6, jump: 0 },
    engine: '300 Fusion (Normal)',
    structure: 'Endo Steel',
    heatSinks: { count: 10, type: 'Single' },
    loadout: ['PPC', '2x Large Laser', '4x Medium Laser', 'Small Laser', 'Beagle Active Probe'],
    pilotId: 'pilot:0001',
    condition: 'battle-ready',
    sheet: '/reference/mechs/recordsheets/BL6-KNT_RecordSheet.html',
  },
  {
    _id: `mech:${crypto.randomUUID()}`,
    type: 'mech',
    designId: 'design:um-r60',
    chassis: 'UrbanMech',
    variant: 'UM-R60',
    weightClass: 'Light',
    tons: 30,
    move: { walk: 2, run: 3, jump: 2 },
    engine: '60 Fusion (Normal)',
    structure: 'Standard',
    heatSinks: { count: 11, type: 'Single' },
    loadout: ['Autocannon/10', 'Small Laser'],
    ammo: ['AC/10 - 10 rounds (no CASE)'],
    pilotId: 'pilot:0002',
    condition: 'battle-ready',
    sheet: '/reference/mechs/recordsheets/UM-R60_RecordSheet.html',
  },
  {
    _id: `mech:${crypto.randomUUID()}`,
    type: 'mech',
    designId: 'design:stg-3r',
    chassis: 'Stinger',
    variant: 'STG-3R',
    weightClass: 'Light',
    tons: 20,
    move: { walk: 6, run: 9, jump: 6 },
    loadout: ['Medium Laser', '2x Machine Gun'],
    pilotId: 'pilot:0003',
    condition: 'battle-ready',
    sheet: '/reference/mechs/recordsheets/STG-3R_QuirkSheet.html',
  },
  {
    _id: `mech:${crypto.randomUUID()}`,
    type: 'mech',
    designId: 'design:wsp-1a',
    chassis: 'Wasp',
    variant: 'WSP-1A',
    weightClass: 'Light',
    tons: 20,
    move: { walk: 6, run: 9, jump: 6 },
    loadout: ['Medium Laser', 'SRM 2'],
    pilotId: 'pilot:0004',
    condition: 'battle-ready',
    sheet: '/reference/mechs/recordsheets/WSP-1A_QuirkSheet.html',
  },
];

const pilots = [
  { _id: 'pilot:0001', type: 'pilot', callsign: 'Sabre', name: 'Unnamed', gunnery: 3, piloting: 4, rating: 'Veteran', xp: 0, injuries: 0, salary: 2400, role: 'Commander' },
  { _id: 'pilot:0002', type: 'pilot', callsign: 'Grinder', name: 'Unnamed', gunnery: 4, piloting: 5, rating: 'Regular', xp: 0, injuries: 0, salary: 1500 },
  { _id: 'pilot:0003', type: 'pilot', callsign: 'Ghost', name: 'Unnamed', gunnery: 4, piloting: 5, rating: 'Regular', xp: 0, injuries: 0, salary: 1500 },
  { _id: 'pilot:0004', type: 'pilot', callsign: 'Sparrow', name: 'Unnamed', gunnery: 5, piloting: 6, rating: 'Green', xp: 0, injuries: 0, salary: 1000 },
];

const txns = [
  { _id: 'txn:0001', type: 'txn', date: '3025-01-01', category: 'opening', description: 'Opening balance', amount: 500000 },
  { _id: 'txn:0002', type: 'txn', date: '3025-01-05', category: 'contract', description: 'Contract advance', amount: 250000 },
  { _id: 'txn:0003', type: 'txn', date: '3025-01-31', category: 'maintenance', description: "January 'Mech maintenance", amount: -45000 },
];

const TIERS = {
  substandard: { rank: 1, modifier: 0.6 },
  normal: { rank: 2, modifier: 1.0 },
  expert: { rank: 3, modifier: 1.4 },
  epic: { rank: 4, modifier: 2.0 },
  legendary: { rank: 5, modifier: 3.0 },
};
// Each staff type's tier chiefly scales a different dimension of their trade output.
const DIMENSION = {
  support: 'overhead & administration',
  engineer: 'repair & refit speed / complexity',
  medical: 'crew recovery speed',
};
function staffDoc(id, name, staffType, monthlyCost, tier, rating, specialSkills) {
  const t = TIERS[tier];
  return {
    _id: `staff:${id}`, type: 'staff', name, staffType, monthlyCost,
    tier, tierRank: t.rank, outputModifier: t.modifier, dimension: DIMENSION[staffType],
    rating, specialSkills,
  };
}

const staff = [
  staffDoc('0001', 'Wrench Kowalski', 'engineer', 1200, 'expert', 8, ['Refit specialist', 'Endo-steel welds']),
  staffDoc('0002', 'Astech Pool', 'engineer', 600, 'normal', 4, ['General maintenance']),
  staffDoc('0003', 'Chief Engineer Rho', 'engineer', 2600, 'legendary', 10, ['Prototype fabrication', 'Lostech recovery', 'XL engine tuning']),
  staffDoc('0004', 'Doc Halloran', 'medical', 900, 'expert', 7, ['Battlefield trauma', 'Prosthetics']),
  staffDoc('0005', 'Surgeon Adept Ilsa', 'medical', 2200, 'epic', 9, ['Cybernetic surgery', 'Rapid recovery protocols']),
  staffDoc('0006', 'Medtech Suki', 'medical', 500, 'substandard', 3, ['First aid']),
  staffDoc('0007', 'Quartermaster Vance', 'support', 800, 'normal', 5, ['Logistics', 'Procurement']),
  staffDoc('0008', 'Comms Officer Bex', 'support', 1000, 'expert', 7, ['ECM operations', 'Contract negotiation']),
];

const advancements = [
  { _id: 'advancement:jumpship-charter', type: 'advancement', category: 'Transport', name: 'JumpShip Charter', description: 'Standing charter with an Invader-class JumpShip for interstellar transit.', status: 'available', cost: 5000000, progress: 0 },
  { _id: 'advancement:dropship-union', type: 'advancement', category: 'Transport', name: 'DropShip - Union-class', description: 'Spheroid DropShip with 12 BattleMech cubicles.', status: 'available', cost: 18000000, progress: 0 },
  { _id: 'advancement:dropship-leopard', type: 'advancement', category: 'Transport', name: 'DropShip - Leopard-class', description: 'Aerodyne DropShip carrying a lance of 4 BattleMechs.', status: 'acquired', cost: 9000000, progress: 100 },
  { _id: 'advancement:research-salvage', type: 'advancement', category: 'Research', name: 'Battlefield Salvage Analysis', description: 'Improves recovered-component yield after engagements.', status: 'in-progress', cost: 750000, progress: 45 },
  { _id: 'advancement:research-lostech', type: 'advancement', category: 'Research', name: 'Lostech Recovery Program', description: 'Unlocks reconstruction of Star League-era equipment.', status: 'available', cost: 3000000, progress: 0 },
  { _id: 'advancement:proto-weapons', type: 'advancement', category: 'Prototyping & Advanced Engineering', name: 'Prototype Weapons Lab', description: 'In-house design and testing of experimental weapons.', status: 'available', cost: 4200000, progress: 0 },
  { _id: 'advancement:proto-refit', type: 'advancement', category: 'Prototyping & Advanced Engineering', name: 'Advanced Refit Bay', description: 'Enables complex refits such as engine swaps and structure changes.', status: 'in-progress', cost: 2500000, progress: 30 },
];

// Reference datasets that govern the mission builder.
function mt(id, name, payMultiplier, defaultLengthMonths, description) {
  return { _id: `missionType:${id}`, type: 'missionType', name, payMultiplier, defaultLengthMonths, description };
}
const missionTypes = [
  mt('garrison-duty', 'Garrison Duty', 1.0, 12, 'Static defense of a planet or facility against raids.'),
  mt('cadre-duty', 'Cadre Duty', 0.8, 6, "Train an employer's green units; low combat exposure."),
  mt('security', 'Security', 1.1, 6, 'Protect a person, convoy, or site from hostile action.'),
  mt('recon-raid', 'Recon Raid', 1.4, 3, 'Scout enemy positions and gather intelligence.'),
  mt('riot-duty', 'Riot Duty', 0.9, 6, 'Suppress civil unrest and maintain order.'),
  mt('guerrilla-warfare', 'Guerrilla Warfare', 1.6, 3, 'Hit-and-run operations behind enemy lines.'),
  mt('pirate-hunting', 'Pirate Hunting', 1.3, 6, 'Track and eliminate pirate bands.'),
  mt('objective-raid', 'Objective Raid', 1.5, 2, 'Strike a specific high-value target and withdraw.'),
  mt('extraction-raid', 'Extraction Raid', 1.6, 1, 'Recover personnel or materiel from hostile territory.'),
  mt('assault', 'Assault', 1.8, 2, 'Seize and hold a defended objective.'),
  mt('diversionary-raid', 'Diversionary Raid', 1.4, 1, 'Draw enemy forces away from the main effort.'),
  mt('planetary-assault', 'Planetary Assault', 2.0, 3, 'Full-scale invasion of a defended world.'),
  mt('relief-duty', 'Relief Duty', 1.2, 3, 'Reinforce or extract a besieged friendly force.'),
];

function emp(id, name, faction) {
  return { _id: `employer:${id}`, type: 'employer', name, faction };
}
const employers = [
  emp('steiner', 'House Steiner', 'Lyran Commonwealth'),
  emp('davion', 'House Davion', 'Federated Suns'),
  emp('kurita', 'House Kurita', 'Draconis Combine'),
  emp('liao', 'House Liao', 'Capellan Confederation'),
  emp('marik', 'House Marik', 'Free Worlds League'),
  emp('comstar', 'ComStar', 'ComStar'),
  emp('mrbc', 'Mercenary Review Board', 'Independent'),
  emp('periphery', 'Periphery State', 'Periphery'),
];

function tr(id, name, description) {
  return { _id: `transport:${id}`, type: 'transportOption', name, description };
}
const transportOptions = [
  tr('employer-full', 'Employer-provided (full)', 'Employer provides JumpShip and DropShip transit both ways.'),
  tr('employer-jumpship', 'Employer JumpShip only', 'Employer provides interstellar jump; unit supplies DropShips.'),
  tr('employer-dropship', 'Employer DropShip only', 'Employer provides in-system DropShips; unit arranges jumps.'),
  tr('independent', 'Independent (own transport)', 'Unit provides all of its own transport.'),
  tr('none', 'None (unit arranges)', 'No transport support; the unit arranges and funds transit.'),
];

// Five randomized 1-month Steiner contracts in the New India system.
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max, step) { const steps = Math.floor((max - min) / step); return min + Math.floor(Math.random() * (steps + 1)) * step; }
const commandRightsList = ['Independent', 'House', 'Liaison', 'Integrated'];
const supportList = ['Straight Support', 'Battle Loss Compensation', 'None'];
const steinerMissions = [];
for (let i = 1; i <= 5; i++) {
  const missionType = pick(missionTypes);
  const basePay = Math.round(randInt(80000, 320000, 10000) * missionType.payMultiplier);
  steinerMissions.push({
    _id: `contract:steiner-newindia-${i}`,
    type: 'contract',
    employer: 'House Steiner',
    missionType: missionType.name,
    location: 'New India',
    lengthMonths: 1,
    basePay,
    salvagePct: pick([0, 25, 50, 75, 100]),
    commandRights: pick(commandRightsList),
    support: pick(supportList),
    transport: pick(transportOptions).name,
    objectives: `${missionType.name} operation in the New India system for the Lyran Commonwealth.`,
    status: 'Negotiating',
    visibleToMerc: i <= 3,
  });
}

// Owned inventory: each physical weapon/equipment is its own document with a UUID,
// displayed grouped by name in the Mercenary Team view.
function makeItems(itemType, name, count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({ _id: `item:${crypto.randomUUID()}`, type: 'item', itemType, name, condition: 'functional' });
  }
  return arr;
}
const items = [
  ...makeItems('weapon', 'Medium Laser', 6),
  ...makeItems('weapon', 'Large Laser', 2),
  ...makeItems('weapon', 'PPC', 1),
  ...makeItems('weapon', 'SRM 6', 2),
  ...makeItems('weapon', 'Machine Gun', 4),
  ...makeItems('weapon', 'LRM 10', 2),
  ...makeItems('equipment', 'Heat Sink', 10),
  ...makeItems('equipment', 'Jump Jet', 4),
  ...makeItems('equipment', 'CASE', 2),
  ...makeItems('equipment', 'Beagle Active Probe', 1),
];

const clock = { _id: 'clock:main', type: 'clock', month: 1, year: 3025, turn: 0 };

const docs = [
  company, clock, ...mechs, ...pilots, ...staff, ...advancements,
  ...missionTypes, ...employers, ...transportOptions, ...steinerMissions, ...items, ...txns,
];
// Items and stable 'Mechs use random UUIDs and time-advance appends ledger rows, so reset
// those collections on re-seed to a known state instead of accumulating.
for (const t of ['mech', 'item', 'txn']) for (const d of store.list(t)) store.remove(d._id);
for (const doc of docs) {
  store.put(doc);
}

console.log(`Seeded ${docs.length} documents into ${store.DB_PATH}`);
for (const m of store.list('mech')) {
  const pilot = m.pilotId ? store.get(m.pilotId) : null;
  const who = pilot ? `${pilot.callsign} (${pilot.gunnery}/${pilot.piloting})` : 'unassigned';
  console.log(`  mech ${m.variant.padEnd(8)} ${String(m.tons).padStart(3)}t  ${m.chassis.padEnd(13)} pilot: ${who}`);
}
console.log(`  staff ${store.list('staff').length}  ·  advancements ${store.list('advancement').length}`);
console.log(`  missionTypes ${store.list('missionType').length}  ·  employers ${store.list('employer').length}  ·  transport ${store.list('transportOption').length}  ·  contracts ${store.list('contract').length}`);
console.log(`  items ${store.list('item').length}  ·  clock turn ${(store.get('clock:main') || {}).turn}`);
