/**
 * Mission 3 local PostgreSQL 17 test bootstrap.
 * Uses the exact checked-in PHOTO128/bootstrap and Supabase RLS policy SQL.
 * Never connects to staging, production, or hosted databases.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import pgModule from 'pg';

const {Client} = pgModule;
const urlText = process.env.P147_POSTGRES_URL;
assert.ok(urlText, 'Disposable P147_POSTGRES_URL required');
const url = new URL(urlText);
assert.equal(url.protocol, 'postgresql:', 'Only local PostgreSQL URLs are allowed');
assert.equal(url.hostname, 'postgres', 'Refusing non-disposable PostgreSQL host');
assert.equal(url.port, '5432', 'Unexpected disposable PostgreSQL port');
assert.equal(url.pathname, '/mission3_disposable', 'Refusing non-disposable database');
assert.equal(url.username, 'postgres', 'Unexpected disposable PostgreSQL role');
assert.equal(process.env.PGHOST, 'postgres', 'Refusing non-disposable PGHOST');
assert.equal(process.env.PGDATABASE, 'mission3_disposable', 'Refusing non-disposable PGDATABASE');
assert.equal(url.search, '', 'Refusing database connection query options');
assert.equal(url.hash, '', 'Refusing database connection fragments');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readRepoFile = path => readFileSync(resolve(root, path), 'utf8');
const bootstrap = readRepoFile('research/two-owner-cloud-rls-recovery-128/local-postgres-bootstrap.sql');
const actualPolicies = readRepoFile('supabase/cloud-backup.sql');
const slashDirectives = bootstrap.split(/\r?\n/).map(line => line.trim())
  .filter(line => line.startsWith('\\'));
assert.deepEqual(slashDirectives, ['\\set ON_ERROR_STOP on', '\\i supabase/cloud-backup.sql'],
  'Unexpected psql directive; never silently omit bootstrap commands');
assert.equal(actualPolicies.includes('create policy closet_backup_owner'), true);
assert.equal(actualPolicies.includes('create policy closet_photos_insert'), true);
const sql = bootstrap
  .replace(/^\\set ON_ERROR_STOP on\r?\n/m, '')
  .replace(/^\\i supabase\/cloud-backup\.sql\r?$/m, () => actualPolicies);
assert.ok(sql.includes(actualPolicies), 'SQL replacement must preserve original $ dollar-quoted function bodies');
assert.equal(sql.includes('\\i '), false, 'Unexpanded SQL include');

const db = new Client({connectionString: urlText, ssl: false,
  connectionTimeoutMillis: 10000, statement_timeout: 30000});
await db.connect();
try {
  await db.query('BEGIN');
  await db.query(sql);
  const policyCount = await db.query(
    "select (select count(*)::int from pg_policies where schemaname='public' and tablename='closet_backups') as backup, " +
    "(select count(*)::int from pg_policies where schemaname='storage' and tablename='objects') as storage"
  );
  assert.deepEqual(policyCount.rows[0], {backup: 1, storage: 4},
    'Unexpected unchanged owner RLS policy counts');
  await db.query('COMMIT');
  console.log('PASS: disposable PostgreSQL 17 bootstrapped from unchanged checked-in owner RLS and Storage SQL; no apt or hosted connections.');
} catch (error) {
  await db.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await db.end();
}
