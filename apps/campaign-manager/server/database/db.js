'use strict';

// Document store over SQLite. Every record is a JSON document stored in a single
// `documents` table, keyed by `id` and grouped by `type` — schema-less by design,
// but backed by SQLite's speed and indexing.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const paths = require('../config/paths');

const DATA_DIR = paths.storageRoot;
const DB_PATH = process.env.MERC_DB_PATH || path.join(DATA_DIR, 'merc.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    doc        TEXT NOT NULL,
    rev        INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
`);

const stmts = {
  get: db.prepare('SELECT id, type, doc, rev, updated_at FROM documents WHERE id = ?'),
  listByType: db.prepare('SELECT id, type, doc, rev, updated_at FROM documents WHERE type = ? ORDER BY id'),
  listAll: db.prepare('SELECT id, type, doc, rev, updated_at FROM documents ORDER BY type, id'),
  insert: db.prepare('INSERT INTO documents (id, type, doc, rev, updated_at) VALUES (@id, @type, @doc, 1, @updated_at)'),
  update: db.prepare('UPDATE documents SET type = @type, doc = @doc, rev = @rev, updated_at = @updated_at WHERE id = @id'),
  remove: db.prepare('DELETE FROM documents WHERE id = ?'),
};

function hydrate(row) {
  if (!row) return null;
  const body = JSON.parse(row.doc);
  return { ...body, _id: row.id, _type: row.type, _rev: row.rev, _updatedAt: row.updated_at };
}

function get(id) {
  return hydrate(stmts.get.get(id));
}

function list(type) {
  const rows = type ? stmts.listByType.all(type) : stmts.listAll.all();
  return rows.map(hydrate);
}

function put(doc) {
  if (!doc || typeof doc !== 'object') throw new Error('Document must be an object');
  const id = doc._id;
  const type = doc._type || doc.type;
  if (!id) throw new Error('Document requires an _id');
  if (!type) throw new Error('Document requires a type');

  // Meta fields are derived from columns, not stored inside the JSON body.
  const { _id, _type, _rev, _updatedAt, ...rest } = doc;
  const body = { ...rest, type };
  const serialized = JSON.stringify(body);
  const now = new Date().toISOString();

  const existing = stmts.get.get(id);
  if (existing) {
    stmts.update.run({ id, type, doc: serialized, rev: existing.rev + 1, updated_at: now });
  } else {
    stmts.insert.run({ id, type, doc: serialized, updated_at: now });
  }
  return get(id);
}

function remove(id) {
  return stmts.remove.run(id).changes > 0;
}

module.exports = { db, get, list, put, remove, DB_PATH };
