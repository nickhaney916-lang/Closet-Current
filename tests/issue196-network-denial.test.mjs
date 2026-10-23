import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('issue196: dedicated offline preload actively refuses fetch, TCP, DNS and UDP',()=>{
 const source=`
 const assert=require('node:assert/strict');
 (async()=>{
 await assert.rejects(fetch('https://example.invalid'),/ISSUE196_NETWORK_FORBIDDEN/);
 assert.throws(()=>require('node:net').connect(443,'127.0.0.1'),/ISSUE196_NETWORK_FORBIDDEN/);
 assert.throws(()=>require('node:dns').lookup('example.invalid'),/ISSUE196_NETWORK_FORBIDDEN/);
 await assert.rejects(require('node:dns').promises.resolve('example.invalid'),/ISSUE196_NETWORK_FORBIDDEN/);
 assert.throws(()=>require('node:dgram').createSocket('udp4'),/ISSUE196_NETWORK_FORBIDDEN/);
 assert.equal(globalThis.issue196NetworkGuard.attempts(),5);
 })().catch(()=>{process.exitCode=1;});`;
 const r=spawnSync(process.execPath,['--require','./tests/helpers/issue196-no-network.cjs','-e',source],{encoding:'utf8',timeout:10000});
 assert.equal(r.status,0,r.stderr);assert.equal(r.error,undefined);
});
