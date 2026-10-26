import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {addStagingLoginDiagnostics} from '../scripts/family-alpha-staging-login-diagnostic.mjs';
import {stageAuthSource} from '../scripts/build-family-alpha-staging-auth-hold.mjs';

const original=await readFile(new URL('../public/auth.js',import.meta.url),'utf8');

test('diagnostic requires already-hardened, invite-only staging auth and fails closed',()=>{
  assert.throws(()=>addStagingLoginDiagnostics(original),/isolated owner staging/);
  assert.throws(()=>addStagingLoginDiagnostics('not auth code'),/isolated owner staging/);
  const stage=stageAuthSource(original);
  assert.throws(()=>addStagingLoginDiagnostics(stage),/isolated owner staging/);
});

test('generated staging code preserves private account and avatar hold safeguards',()=>{
 const stage=stageAuthSource(original);
 new Script(stage);
 for(const s of [
  'const URL=stage.base;','const KEY=stage.key;',
  "const STORE='closet-alpha-staging-auth-v1';",
  'Family Alpha accounts require a private invitation',
  'stageTerminalRefreshError',
  'stageLoginDiagnosticMessage(err)',
  'NET-FETCH','NET-TIMEOUT','APP-TYPE','AUTH-REJECT','AUTH-RATE','AUTH-HTTP','RESP-FORMAT',
  "if(linkType==='recovery'||linkType==='invite')"
 ])assert.ok(stage.includes(s), 'Required staging safety or diagnostic marker '+s);
 for(const s of [
  'hlkgymugtfbirlpunsra','nickhaney916-lang.github.io',
  "request('signup'+EMAIL_REDIRECT",
  'console.log(err)','console.error(err)','sendBeacon','fetch(\'/telemetry'
 ])assert.ok(!stage.includes(s),'Forbidden diagnostic or production reference '+s);
 assert.ok(!original.includes('stageLoginDiagnosticMessage'));
});
