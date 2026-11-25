import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';
import { digest, fetchDocument, makeCandidate, validateFeeds, verifyStored, week } from './trends.mjs';

export function openStore(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  if (db.prepare("SELECT name FROM sqlite_master WHERE name = 'schedule'").get()) return db;
  db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS versions (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      due INTEGER NOT NULL DEFAULT 0,
      active TEXT REFERENCES versions(id),
      previous TEXT REFERENCES versions(id)
    );
    INSERT OR IGNORE INTO schedule (id) VALUES (1);
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY, at INTEGER NOT NULL, result TEXT NOT NULL, version TEXT
    );
    COMMIT;
  `);
  return db;
}

const schedule = db => db.prepare('SELECT due, active, previous FROM schedule WHERE id = 1').get();

function write(db, action) {
  try {
    db.exec('BEGIN IMMEDIATE');
  } catch (error) {
    if (error.errcode === 5) return Promise.resolve({ result: 'busy' });
    throw error;
  }
  return (async () => {
    try {
      const result = await action();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  })();
}

function audit(db, at, result, version = null) {
  db.prepare('INSERT INTO audit (at, result, version) VALUES (?, ?, ?)').run(at, result, version);
  db.exec('DELETE FROM audit WHERE id <= (SELECT MAX(id) - 100 FROM audit)');
  return { result, version };
}

function readVersion(db, version) {
  if (!version) return null;
  try {
    return { version, data: verifyStored(db.prepare('SELECT payload FROM versions WHERE id = ?').get(version)?.payload, version) };
  } catch {
    return null;
  }
}

export function activeTrends(db) {
  const current = schedule(db);
  const active = readVersion(db, current.active);
  return active || readVersion(db, current.previous);
}

export function health(db, now = Date.now()) {
  const current = schedule(db);
  const active = activeTrends(db);
  const lastAttempt = db.prepare('SELECT at, result, version FROM audit ORDER BY id DESC LIMIT 1').get() ?? null;
  return {
    status: (lastAttempt && !['activated', 'rolled-back'].includes(lastAttempt.result)) || !active || active.version !== current.active || now - Date.parse(active.data.updated_at) > week + 86400000
      ? 'degraded' : 'healthy',
    nextAttemptAt: current.due,
    activeVersion: active?.version ?? null,
    lastAttempt
  };
}

async function acquire(feeds, load, pause) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const results = await Promise.allSettled(feeds.map(feed => Promise.resolve().then(() => load(feed))));
    if (results.every(result => result.status === 'fulfilled')) return results.map(result => result.value);
    if (attempt < 2) await pause(500 * 2 ** attempt);
  }
  return null;
}

export function tick(db, feeds, { clock = Date.now, load = fetchDocument, pause = delay, beforeActivation = () => {} } = {}) {
  return write(db, async () => {
    const now = clock();
    const current = schedule(db);
    if (current.due > now) return { result: 'not-due' };
    const reject = result => {
      db.prepare('UPDATE schedule SET due = ? WHERE id = 1').run(now + 3600000);
      return audit(db, now, result);
    };
    try {
      validateFeeds(feeds);
    } catch {
      return reject('policy-rejected');
    }
    const documents = await acquire(feeds, load, pause);
    if (!documents) return reject('source-unavailable');
    const elapsed = clock() - now;
    if (elapsed > 60000 || elapsed < 0) return reject('expired-run');
    let candidate;
    try {
      candidate = makeCandidate(feeds, documents, now);
    } catch {
      return reject('candidate-rejected');
    }
    const payload = JSON.stringify(candidate);
    const version = digest(payload);
    verifyStored(payload, version);
    const previous = activeTrends(db)?.version ?? null;
    db.prepare('INSERT OR IGNORE INTO versions VALUES (?, ?)').run(version, payload);
    // Both staging and the pointer switch are invisible until commit.
    beforeActivation();
    db.prepare('UPDATE schedule SET due = ?, previous = ?, active = ? WHERE id = 1')
      .run(now + week, previous, version);
    db.exec('DELETE FROM versions WHERE id NOT IN (SELECT active FROM schedule) AND id NOT IN (SELECT previous FROM schedule WHERE previous IS NOT NULL)');
    return audit(db, now, 'activated', version);
  });
}

export function rollback(db, now = Date.now()) {
  return write(db, () => {
    const current = schedule(db);
    const fallback = readVersion(db, current.previous);
    if (!fallback) return audit(db, now, 'rollback-unavailable');
    db.prepare('UPDATE schedule SET active = ?, previous = NULL, due = ? WHERE id = 1')
      .run(fallback.version, now + week);
    db.prepare('DELETE FROM versions WHERE id != ?').run(fallback.version);
    return audit(db, now, 'rolled-back', fallback.version);
  });
}
