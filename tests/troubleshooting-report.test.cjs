'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {createReport} = require('../public/troubleshooting-report.js');

test('diagnostics accept only bounded fields and enumerated codes', () => {
 const canary = 'secret-owner@example.invalid <img onerror=alert(1)> https://example.invalid/?token=private';
 const report = createReport({
  assetVersion: '0123456789ab', browser: 'webkit', viewport: 'compact', connection: 'offline',
  topic: 'outfit-3d', recognition: 'working', photoImport: 'partial', outfit: 'pending',
  presentation: 'verified-2d', backup: 'pending', maintenance: 'cached-library',
  logs: canary, originalPhoto: canary, outfitName: canary, owner: canary, location: canary
 });
 assert.deepEqual(report, {
  reportVersion: 1, assetVersion: '0123456789ab', browser: 'webkit', viewport: 'compact',
  connection: 'offline', topic: 'outfit-3d', recognition: 'working', photoImport: 'partial',
  outfit: 'pending', presentation: 'verified-2d', backup: 'pending', maintenance: 'cached-library'
 });
 assert.ok(Object.isFrozen(report));
 assert.ok(Buffer.byteLength(JSON.stringify(report, null, 2)) < 512);
});

test('diagnostics reject malformed fields, inherited fields, accessors and injection', () => {
 const input = Object.assign(Object.create({browser:'webkit'}), {
  topic: '<script>alert(1)</script>', viewport: 320, connection: ['available'],
  recognition: {toString(){throw Error('should never coerce');}},
  assetVersion: 'a'.repeat(100_000)
 });
 Object.defineProperty(input, 'backup', {get(){throw Error('should never read accessors');}});
 const blank = createReport(null);
 assert.deepEqual(createReport(input), blank);
 assert.deepEqual(createReport(42), blank);
 assert.deepEqual(createReport(Proxy.revocable({}, {}).proxy), blank);
 const revoked = Proxy.revocable({}, {});
 revoked.revoke();
 assert.deepEqual(createReport(revoked.proxy), blank);
});
