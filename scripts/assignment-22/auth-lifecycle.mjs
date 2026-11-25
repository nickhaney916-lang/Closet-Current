import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { json, request } from '../assignment-21/local-http.mjs';

async function auth(path, body, token = null) {
  const response = await request('/auth/v1/' + path, token, 'POST', body);
  assert.ok(response.ok, 'Local Auth request failed with status ' + response.status);
  return response;
}

function sessionID(session) {
  const claims = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url'));
  const id = claims.session_id;
  assert.ok(typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id), 'Auth returned a session UUID');
  return id;
}

function countSessions(ids) {
  const values = ids.map(id => "'" + id + "'::uuid").join(',');
  return Number(execFileSync('docker', [
    'exec', 'supabase_db_closet-a21', 'psql', '-U', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1',
    '-c', 'select count(*) from auth.sessions where id in (' + values + ')',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
}

async function confirmPrivateBackupAvailable(session) {
  const response = await request('/rest/v1/closet_backups?select=revision', session.access_token);
  assert.ok(response.ok, 'Active session could query backup metadata');
  assert.deepEqual(json(response), [{ revision: 1 }], 'The active session can read its owner backup');
}

const owners = [];
for (let i = 0; i < 4; i++) {
  const credentials = {
    email: 'closet-session-' + randomUUID() + '@example.test',
    password: randomBytes(24).toString('hex'),
  };
  const first = json(await auth('signup', credentials));
  const backup = await request('/rest/v1/rpc/save_closet_backup', first.access_token, 'POST', {
    p_expected_revision: 0,
    p_document: { schemaVersion: 1, items: [], state: {} },
  });
  assert.ok(backup.ok, 'A new synthetic owner can write the first backup');
  assert.equal(json(backup), 1);
  const second = json(await auth('token?grant_type=password', credentials));
  const firstId = sessionID(first);
  const secondId = sessionID(second);
  assert.ok(firstId !== secondId, 'Two devices have independent session IDs');
  assert.equal(countSessions([firstId, secondId]), 2);
  owners.push({ credentials, first, second, firstId, secondId });
}

for (const { credentials, first, second, firstId, secondId } of owners) {
  const refreshed = json(await auth('token?grant_type=refresh_token', { refresh_token: first.refresh_token }));
  assert.ok(sessionID(refreshed) === firstId, 'Normal refresh keeps the active session');
  await confirmPrivateBackupAvailable(refreshed);

  await auth('logout?scope=local', {}, refreshed.access_token);
  assert.equal(countSessions([firstId]), 0, 'Local logout removes its server session');
  assert.equal(countSessions([secondId]), 1, 'Local logout preserves the other device session');
  await confirmPrivateBackupAvailable(second);

  const third = json(await auth('token?grant_type=password', credentials));
  const thirdId = sessionID(third);
  await auth('logout?scope=global', {}, second.access_token);
  assert.equal(countSessions([secondId, thirdId]), 0, 'Global logout removes both server sessions');

  const recovery = json(await auth('token?grant_type=password', credentials));
  await confirmPrivateBackupAvailable(recovery);
  await auth('logout?scope=local', {}, recovery.access_token);
}

console.log('Four synthetic owners passed normal refresh, local logout, other-device continuity, global logout and fresh sign-in.');
