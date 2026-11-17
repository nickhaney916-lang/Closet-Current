import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from '../scripts/serve-device97.mjs';
const base=['--cert','private-cert.pem','--key','private-key.pem'];
test('requires HTTPS keypair; listener bounded to private LAN',()=>{
 assert.throws(()=>parseArgs([]),/cert and key required/);
 assert.deepEqual(parseArgs(base),{host:'127.0.0.1',port:8443,cert:'private-cert.pem',key:'private-key.pem'});
 for(const host of ['0.0.0.0','8.8.8.8','github.com','[::]'])
  assert.throws(()=>parseArgs([...base,'--host',host]),/private-LAN/);
 assert.equal(parseArgs([...base,'--host','192.168.1.8']).host,'192.168.1.8');
 assert.throws(()=>parseArgs([...base,'--port','80']),/invalid port/);
});
