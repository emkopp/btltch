'use strict';

// Loads the converted catalog JSON (designs, weapons, equipment) into the store.
// These are reference data (the 'Mech design catalog and weapon/equipment stats),
// distinct from the mercenary's owned `mech` stable seeded by seed.js.
// Re-runnable; put() upserts by id.

const fs = require('fs');
const path = require('path');
const store = require('../db');
const paths = require('../../config/paths');

const SEED_DIR = paths.catalogDataRoot;

function load(name) {
  const file = path.join(SEED_DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}. Run "npm run convert" first.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let total = 0;
for (const name of ['designs.json', 'weapons.json', 'equipment.json']) {
  const docs = load(name);
  const insertAll = store.db.transaction(items => {
    for (const doc of items) store.put(doc);
  });
  insertAll(docs);
  total += docs.length;
  console.log(`  ${name.padEnd(16)} ${String(docs.length).padStart(4)} documents`);
}

console.log(`Loaded ${total} catalog documents into ${store.DB_PATH}`);
console.log(`  designs:   ${store.list('design').length}`);
console.log(`  weapons:   ${store.list('weapon').length}`);
console.log(`  equipment: ${store.list('equipment').length}`);
