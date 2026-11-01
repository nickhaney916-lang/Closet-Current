/** 3D66 local Android and allowlisted, private iPhone origin acceptance.
 * Future HTTPS deploy requires separate human authorization; this is NOT
 * permission to deploy or certification that an iPhone was tested.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedPrivateIosOrigins,allowedResearchPhoneOrigin as allowed} from '../research/three-d-66/approved-phone-origins.mjs';
test('research iPhone public HTTPS is blocked with no authorization',()=>{
 assert.deepEqual(approvedPrivateIosOrigins,[]);
 assert.ok(Object.isFrozen(approvedPrivateIosOrigins));
 for(const origin of ['https://closet-current.example','https://production.example.com','https://research.example.com'])
  assert.equal(allowed({protocol:'https:',hostname:new URL(origin).hostname,origin}),false);
 assert.equal(allowed({protocol:'http:',hostname:'example.com',origin:'http://example.com'}),false);
});
test('only actual localhost Android USB and exact explicitly reviewed HTTPS origin',()=>{
 assert.equal(allowed({protocol:'http:',hostname:'localhost',origin:'http://localhost:8765'}),true);
 assert.equal(allowed({protocol:'http:',hostname:'127.0.0.1',origin:'http://127.0.0.1:8765'}),true);
 assert.equal(allowed({protocol:'http:',hostname:'10.0.1.10',origin:'http://10.0.1.10:8765'}),false);
 const whitelist=['https://private-physical-test.invalid'];
 assert.equal(allowed({protocol:'https:',hostname:'private-physical-test.invalid',origin:whitelist[0]},whitelist),true);
 assert.equal(allowed({protocol:'https:',hostname:'private-physical-test.invalid',origin:'https://private-physical-test.invalid:8443'},whitelist),false);
 assert.equal(allowed({protocol:'https:',hostname:'evil.private-physical-test.invalid',origin:'https://evil.private-physical-test.invalid'},whitelist),false);
 assert.equal(allowed({protocol:'http:',hostname:'private-physical-test.invalid',origin:'http://private-physical-test.invalid'},whitelist),false);
 assert.equal(allowed({protocol:'https:',hostname:'private-physical-test.invalid',origin:whitelist[0]},['https://*']),false);
});
test('phone diagnostics cannot authorize remote endpoint via query string/UA',()=>{
 const ui=readFileSync(new URL('../research/three-d-66/phone-acceptance.mjs',import.meta.url),'utf8');
 const policy=readFileSync(new URL('../research/three-d-66/approved-phone-origins.mjs',import.meta.url),'utf8');
 assert.match(ui,/allowedResearchPhoneOrigin\(location,approvedPrivateIosOrigins\)/);
 assert.match(ui,/!trustedOrigin/);
 assert.match(ui,/verifiedByAutomatedHardwareProbe:false/);
 assert.match(ui,/familyAlphaApproval:false/);
 assert.match(policy,/Object\.freeze\(\[\]\)/);
 assert.doesNotMatch(policy,/searchParams|userAgent|endsWith\(/);
});
