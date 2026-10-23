import test from 'node:test';import assert from 'node:assert/strict';import {renderVerifiedOutfit2D} from '../public/family-alpha-2d-render-outfit.mjs';
const fakeContainer=()=>({cleared:0,replaceChildren(){this.cleared++;}});
test('invalid verified garment clears stale avatar and fails closed',()=>{const c=fakeContainer();assert.throws(()=>renderVerifiedOutfit2D(c,{top:'not-owned'},{},{}));assert.equal(c.cleared,1);});
test('missing image map clears stale avatar and fails closed',()=>{const c=fakeContainer();assert.throws(()=>renderVerifiedOutfit2D(c,{top:'t'},{t:{itemId:'t',sourceIdentity:'original',sourceVersion:'v1'}},null));assert.equal(c.cleared,1);});
test('invalid dress + shirt combination clears avatar',()=>{const c=fakeContainer();const g=id=>({itemId:id,sourceIdentity:'original',sourceVersion:'v1'});assert.throws(()=>renderVerifiedOutfit2D(c,{dress:'d',top:'t'},{d:g('d'),t:g('t')},{}));assert.equal(c.cleared,1);});
