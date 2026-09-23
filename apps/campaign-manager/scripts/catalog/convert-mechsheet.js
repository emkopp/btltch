'use strict';

// Converts data/catalog/source/mechsheet.xls into JSON catalog files:
//   data/catalog/designs.json    - stock 'Mech designs (BiMechClasses)
//   data/catalog/weapons.json    - Inner Sphere + Clan weapon stats
//   data/catalog/equipment.json  - equipment catalog
// Run once, or after the workbook changes. The catalog seed loader inserts
// the results into SQLite. Requires the dev dependency `xlsx`.

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const paths = require('../../server/config/paths');

const XLS = path.join(paths.catalogDataRoot, 'source', 'mechsheet.xls');
const OUT = paths.catalogDataRoot;
fs.mkdirSync(OUT, { recursive: true });

const wb = XLSX.readFile(XLS);

function slug(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function weightClass(tons) {
  if (tons <= 35) return 'Light';
  if (tons <= 55) return 'Medium';
  if (tons <= 75) return 'Heavy';
  return 'Assault';
}

function uniqueId(base, seen) {
  let id = base;
  let i = 2;
  while (seen.has(id)) id = `${base}-${i++}`;
  seen.add(id);
  return id;
}

// ---- Weapons (ISWeapons + ClanWeapons share the same 12-column layout) ----
function convertWeapons(sheetName, techBase, techPrefix, seen) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const [, name, heat, attacks, dmg, total, missile, shortRange, minRange, hasAmmo, ammoName, ammoNumber] = rows[r];
    if (!name) continue;
    const s = num(shortRange);
    out.push({
      _id: uniqueId(`weapon:${techPrefix}-${slug(name)}`, seen),
      type: 'weapon',
      techBase,
      name: String(name).trim(),
      heat: num(heat),
      attacks: num(attacks),
      damagePerAttack: num(dmg),
      totalDamage: num(total),
      missile: missile === true || missile === 'true',
      range: {
        min: num(minRange) || 0,
        short: s,
        medium: typeof s === 'number' ? s * 2 : null,
        long: typeof s === 'number' ? s * 3 : null,
      },
      hasAmmo: hasAmmo === true || hasAmmo === 'true',
      ammoName: ammoName ? String(ammoName).trim() : null,
      ammoPerTon: num(ammoNumber),
    });
  }
  return out;
}

const weaponSeen = new Set();
const weapons = [
  ...convertWeapons('ISWeapons', 'IS', 'is', weaponSeen),
  ...convertWeapons('ClanWeapons', 'Clan', 'cl', weaponSeen),
];

// ---- Equipment ----
const equipRows = XLSX.utils.sheet_to_json(wb.Sheets['Equipment'], { header: 1, defval: '' });
const equipSeen = new Set();
const equipment = [];
for (let r = 1; r < equipRows.length; r++) {
  const [name, desc] = equipRows[r];
  if (!name) continue;
  equipment.push({
    _id: uniqueId(`equipment:${slug(name)}`, equipSeen),
    type: 'equipment',
    name: String(name).trim(),
    description: desc ? String(desc).trim() : '',
  });
}

// ---- Designs (BiMechClasses) ----
function locCols(prefix, n) {
  return Array.from({ length: n }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`);
}
const LOCS = {
  HD: locCols('HD', 6), CT: locCols('CT', 12), RT: locCols('RT', 12), LT: locCols('LT', 12),
  RA: locCols('RA', 12), LA: locCols('LA', 12), RL: locCols('RL', 6), LL: locCols('LL', 6),
};

// Weapons and equipment occupy tagged slots, e.g. "PPC(WF)" or "Beagle Probe(EA)".
// Each distinct tag is one physical item; count tags per name for the loadout.
function deriveLoadout(slots) {
  const groups = new Map();
  for (const cells of Object.values(slots)) {
    for (const cell of cells) {
      const m = /^(.+?)\(([WE][A-Z0-9]+)\)$/.exec(cell);
      if (m) groups.set(m[2], m[1].trim());
    }
  }
  const counts = new Map();
  for (const name of groups.values()) counts.set(name, (counts.get(name) || 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const designRows = XLSX.utils.sheet_to_json(wb.Sheets['BiMechClasses'], { defval: '' });
const designSeen = new Set();
const designs = [];
for (const row of designRows) {
  const model = String(row.Model || '').trim();
  if (!model) continue;
  const tonnage = num(row.Tonnage);
  const criticalSlots = {};
  for (const [loc, cols] of Object.entries(LOCS)) {
    criticalSlots[loc] = cols.map(c => String(row[c] ?? '').trim());
  }
  const ammo = [];
  for (let i = 1; i <= 20; i++) {
    const a = String(row[`Ammo${i}`] ?? '').trim();
    if (a) ammo.push(a);
  }
  designs.push({
    _id: uniqueId(`design:${slug(model)}`, designSeen),
    type: 'design',
    model,
    class: String(row.Class || '').trim(),
    weightClass: typeof tonnage === 'number' ? weightClass(tonnage) : null,
    tonnage,
    chassis: String(row.Chassis || '').trim(),
    engine: {
      make: String(row.PowerPlantMake || '').trim(),
      rating: num(row.PowerPlantModel),
      type: String(row.PowerPlantType || '').trim(),
    },
    movement: { walk: num(row.CrusingSpeed), run: num(row.MaxSpeed), jump: num(row.JumpDist) },
    heatSinks: {
      internal: num(row.HeatsinksInt),
      external: num(row.HeatsinksExt),
      type: String(row.HeatsinkType || '').trim(),
    },
    armor: {
      head: num(row.HeadArmor), centerTorso: num(row.CenterTorsoArmor), sideTorso: num(row.SideTorsoArmor),
      arm: num(row.ArmArmor), leg: num(row.LegArmor), rearCenter: num(row.RearCentreArmor), rearSide: num(row.RearSideArmor),
    },
    structure: {
      head: num(row.HeadStructure), centerTorso: num(row.CentreTorsoStructure), sideTorso: num(row.SideTorsoStructure),
      arm: num(row.ArmStructure), leg: num(row.LegStructure),
    },
    techBase: String(row.MechTech || '').trim(),
    loadout: deriveLoadout(criticalSlots),
    ammo,
    criticalSlots,
    flavor: {
      manufacturer: String(row.Manufacturer || '').trim(),
      comms: String(row.CommunicationsSystems || '').trim(),
      targeting: String(row.TargetAndTracking || '').trim(),
      armorMake: String(row.ArmourMake || '').trim(),
      jumpJetMake: String(row.JumpJetMake || '').trim(),
    },
  });
}

function write(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`  ${name.padEnd(16)} ${String(data.length).padStart(4)} records`);
}

console.log(`Converted ${path.relative(process.cwd(), XLS)} -> ${path.relative(process.cwd(), OUT)}/`);
write('designs.json', designs);
write('weapons.json', weapons);
write('equipment.json', equipment);
