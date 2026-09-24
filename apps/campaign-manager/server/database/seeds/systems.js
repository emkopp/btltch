'use strict';

// Loads the Inner Sphere system list from the integrated map into the
// document store as `system` documents (name, coordinates, affiliation). These drive
// team-location tracking and mission travel-distance calculations. Re-runnable; clears
// the collection first.

const fs = require('fs');
const store = require('../db');
const paths = require('../../config/paths');

const SRC = paths.systemsDataFile;

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const existingTags = new Map(store.list('system').map(system => [
  String(system.name).toLowerCase(),
  Array.isArray(system.tags) ? system.tags : null,
]));

function slug(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const seen = new Set();
function uniqueId(base) {
  let id = base;
  let i = 2;
  while (seen.has(id)) id = `${base}-${i++}`;
  seen.add(id);
  return id;
}

const docs = [];
for (const s of raw) {
  if (!s || !s.name) continue;
  docs.push({
    _id: uniqueId(`system:${slug(s.name)}`),
    type: 'system',
    name: s.name,
    x: s.x,
    y: s.y,
    affiliation: s.affiliation || 'Unknown',
    link: s.link || null,
    neighbors: (Array.isArray(s.neighbors) ? s.neighbors : [])
      .map(index => raw[index] && raw[index].name)
      .filter(Boolean),
    ...(existingTags.get(String(s.name).toLowerCase())
      ? { tags: existingTags.get(String(s.name).toLowerCase()) }
      : {}),
  });
}

for (const d of store.list('system')) store.remove(d._id);
const insertAll = store.db.transaction(items => { for (const d of items) store.put(d); });
insertAll(docs);

console.log(`Loaded ${docs.length} systems into ${store.DB_PATH}`);
