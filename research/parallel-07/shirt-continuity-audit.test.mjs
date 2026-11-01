import test from 'node:test';import assert from 'node:assert/strict';import {auditShirtContinuity} from './shirt-continuity-audit.mjs';
const sha='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
function shirt(gap=0.005){const a={count:2,getX:i=>i?gap:0,getY:()=>0,getZ:()=>0};return {isSkinnedMesh:true,geometry:{getAttribute:n=>({position:a,uv:{},skinIndex:{},skinWeight:{}}[n])}};}
test('verified source and 5mm shoulder seam pass',()=>assert.equal(auditShirtContinuity({shirt:shirt(),sourceSHA256:sha,expectedSHA256:sha,shoulderPairs:[[0,1]]}).status,'PASS'));
test('excessive 20mm shoulder seam stays REVIEW',()=>assert.equal(auditShirtContinuity({shirt:shirt(.02),sourceSHA256:sha,expectedSHA256:sha,shoulderPairs:[[0,1]]}).status,'REVIEW'));
test('spoofed photo hash rejected',()=>assert.throws(()=>auditShirtContinuity({shirt:shirt(),sourceSHA256:'0'.repeat(64),expectedSHA256:sha}),/SHA/));
test('non-skinned placeholder rejected',()=>assert.throws(()=>auditShirtContinuity({shirt:{},sourceSHA256:sha,expectedSHA256:sha}),/skinned/));
test('invalid vertex indices rejected',()=>assert.throws(()=>auditShirtContinuity({shirt:shirt(),sourceSHA256:sha,expectedSHA256:sha,armholePairs:[[0,3]]}),/index/));
