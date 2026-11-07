import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createEphemeralSignedIdentity147} from '../research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs';
const a=randomUUID(),b=randomUUID();
test('P147 RS256 signed tokens verify cryptographic subject for two independent owners',()=>{
 const identity=createEphemeralSignedIdentity147();
 const ta=identity.issue(a),tb=identity.issue(b);
 assert.equal(identity.verify(ta).ownerId,a);
 assert.equal(identity.verify(tb).ownerId,b);
 assert.equal(identity.authenticate({headers:{authorization:'Bearer '+ta}}).ownerId,a);
 assert.equal(identity.authenticate({headers:{authorization:'Bearer '+tb}}).ownerId,b);
 assert.equal(identity.stats().keyAlgorithm,'RSA-2048 / RS256');
 assert.equal(identity.stats().privateKeyExported,false);
});
test('P147 rejects tampering, forged subject, wrong alg, missing bearer and unsigned fake identities',()=>{
 const identity=createEphemeralSignedIdentity147(),token=identity.issue(a);
 const parts=token.slice('p146-synthetic-local-only-'.length).split('.');
 const claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
 const forged={...claims,sub:b,user_metadata:{admin:true,role:'service_role'}};
 const tampered='p146-synthetic-local-only-'+parts[0]+'.'+Buffer.from(JSON.stringify(forged)).toString('base64url')+'.'+parts[2];
 assert.throws(()=>identity.verify(tampered),/cryptographic identity denied/);
 const unsigned='p146-synthetic-local-only-'+Buffer.from(JSON.stringify({alg:'none',typ:'JWT',kid:'p147-ephemeral-only'})).toString('base64url')+'.'+parts[1]+'.'+parts[2];
 assert.throws(()=>identity.verify(unsigned),/cryptographic identity denied/);
 assert.equal(identity.authenticate({headers:{authorization:'Bearer wrong'}}),null);
 assert.equal(identity.authenticate({headers:{authorization:''}}),null);
 assert.equal(identity.authenticate({headers:{authorization:'Bearer p146-synthetic-local-only-'+a}}),null);
});
test('P147 rejects wrong issuer/audience, expired, premature and unissued session',()=>{
 const identity=createEphemeralSignedIdentity147(),tokens=[
  identity.issue(a,{aud:'anon'}),
  identity.issue(a,{issuerOverride:'https://attacker.invalid'}),
  identity.issue(a,{expiresIn:-10}),
  identity.issue(a,{notBefore:90}),
  identity.issue(a,{role:'service_role'})
 ];
 for(const token of tokens)assert.throws(()=>identity.verify(token),/cryptographic identity denied/);
 const fromOtherKey=createEphemeralSignedIdentity147().issue(a);
 assert.throws(()=>identity.verify(fromOtherKey),/cryptographic identity denied/);
});
test('P147 user-editable metadata cannot grant other account access',()=>{
 const identity=createEphemeralSignedIdentity147();
 const token=identity.issue(a,{userMetadata:{ownerId:b,sub:b,role:'service_role',is_admin:true}});
 assert.equal(identity.verify(token).ownerId,a);
});
test('P147 revokes signed sessions before expiration',()=>{
 const identity=createEphemeralSignedIdentity147(),token=identity.issue(a);
 const {sessionId}=identity.verify(token);
 identity.revoke(sessionId);
 assert.throws(()=>identity.verify(token),/cryptographic identity denied/);
 assert.equal(identity.stats().activeSessions,0);
});
