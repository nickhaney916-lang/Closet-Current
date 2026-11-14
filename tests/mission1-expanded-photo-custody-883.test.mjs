/** P883: synthetic source receipts only. No human, model, or private image data. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {exposedSources883,inspectNewCandidate883,reportCandidates883} from '../scripts/p883-candidate-custody.mjs';

const hash=n=>n.repeat(64),now=new Date().toISOString();
const src=n=>'https://commons.wikimedia.org/wiki/File:Garment_'+n+'.jpg';
const candidate=(id,digit)=>({
 schema:'p75-v1',id,discoveryFamily:'footwear',sourcePage:src(id),
 originalURL:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Garment_'+id+'.jpg',
 license:'CC BY 4.0',licenseURL:'https://creativecommons.org/licenses/by/4.0/',
 artist:'synthetic photographer',title:'synthetic candidate '+id,
 sha256:hash(digit),commonsSha1:digit.repeat(40),
 byteLength:100000,width:640,height:480,orientation:1,mime:'image/jpeg',
 acquiredAt:now,verification:'bytes-verified',photoContent:'unreviewed',
 rightsReview:'manual-review-required',sourceGroupApproved:false,
 garmentHumanVerified:false,split:'quarantine',sourceGroupId:null,
 modelScored:false,labelsPublic:false,seriesKey:null,dhash64:'1234567890abcdef',
 overlapFlags:[]});
const pinned=()=>({schema:'p75-public-candidates-pin-v1',rows:[
 candidate('old-p75','a'),candidate('previous-photo','b')
]});
const history=()=>({'benchmark/manifest-reviewed-32.json':[
 {id:'historical-photo',source:src('old-historical'),sha256:hash('c')},
 {id:'duplicate-photo-source',source:src('old-historical'),sha256:hash('c')}
]});
const exposure=()=>exposedSources883(history(),pinned());

test('P883 requires prior P75 public dataset and excludes historical duplicates',()=>{
 const blocked=exposure();assert.equal(blocked.length,3);
 assert.ok(blocked.some(r=>r.from==='previous-p75-publicly-exposed-not-blind'));
 assert.ok(blocked.some(r=>r.id==='historical-photo'));
 assert.throws(()=>exposedSources883(history(),{}),/P883_PINNED_P75_LEDGER/);
});
test('P883 accepts only new source SHA and explicit rights/physical-group quarantine',()=>{
 const a=candidate('fresh-1','d');const review=inspectNewCandidate883(a,exposure());
 assert.equal(review.sourceMachineVerified,true);
 assert.equal(review.newSourceDisjoint,true);
 assert.deepEqual(review.overlapFlags,[]);
});
test('P883 blocks reused P75 source pages and duplicate source bytes even with changed IDs',()=>{
 const a=candidate('fresh-1','d');a.sourcePage=src('old-p75');
 assert.ok(inspectNewCandidate883(a,exposure()).overlapFlags.includes('same-commons-page'));
 const b=candidate('fresh-2','a');
 assert.ok(inspectNewCandidate883(b,exposure()).overlapFlags.includes('exact-sha256'));
});
test('P883 flags suspicious publisher series and near-identical perceptual hashes',()=>{
 const p=pinned();p.rows[0].seriesKey='catalog-accession:932';p.rows[0].dhash64='cccccccccccccccc';
 const e=exposedSources883(history(),p);
 const a=candidate('fresh-1','d');a.seriesKey='catalog-accession:932';
 assert.ok(inspectNewCandidate883(a,e).overlapFlags.includes('same-publisher-series'));
 const b=candidate('fresh-2','e');b.dhash64='cccccccccccccccc';
 assert.ok(inspectNewCandidate883(b,e).overlapFlags.includes('pixel-near-duplicate'));
});
test('P883 forbids claiming unverified garment, source-group or human-approved labels',()=>{
 const a=candidate('fresh-1','d');a.garmentHumanVerified=true;
 assert.equal(inspectNewCandidate883(a,exposure()).newSourceDisjoint,false);
 const b=candidate('fresh-2','e');b.split='blind';
 assert.equal(inspectNewCandidate883(b,exposure()).newSourceDisjoint,false);
 const c=candidate('fresh-3','f');c.rightsReview='curator-approved';
 assert.equal(inspectNewCandidate883(c,exposure()).newSourceDisjoint,false);
});
test('P883 checks supported Commons source license and current machine original metadata',()=>{
 const a=candidate('fresh-1','d');a.license='all rights reserved';
 assert.equal(inspectNewCandidate883(a,exposure()).sourceMachineVerified,false);
 const b=candidate('fresh-2','e');b.originalURL='https://example.com/garment.jpg';
 assert.equal(inspectNewCandidate883(b,exposure()).newSourceDisjoint,false);
 const c=candidate('fresh-3','f');c.commonsSha1='bad';
 assert.equal(inspectNewCandidate883(c,exposure()).newSourceDisjoint,false);
});
test('P883 no duplicates accepted within same discovery cohort',()=>{
 const one=candidate('fresh-1','d'),two=candidate('fresh-2','d');
 assert.ok(inspectNewCandidate883(two,exposure(),[one]).overlapFlags.includes('exact-sha256'));
 assert.throws(()=>reportCandidates883([one,two],exposure(),{planQueries:2,querySuccesses:2}),/P883_UNSAFE_OR_REPEATED_SOURCE/);
});
test('P883 even successful public source acquisition never manufactures independent blind truth',()=>{
 const one=candidate('fresh-1','d'),two=candidate('fresh-2','e');
 two.dhash64='f1234567890abcde';
 const r=reportCandidates883([one,two],exposure(),{planQueries:12,querySuccesses:10,failures:{'no-image-info':1}});
 assert.equal(r.machineVerifiedNewOriginals,2);
 assert.equal(r.distinctNewSourceDigests,2);
 assert.equal(r.sourceGroupHumanApproved,0);
 assert.equal(r.humanGarmentLabels,0);
 assert.equal(r.twoHumanConsensusLabels,0);
 assert.equal(r.availableForBlindEvaluation,0);
 assert.equal(r.independentBlindAccuracy,null);
 assert.equal(r.originalJPEGsInCIArtifacts,0);
 assert.equal(r.shouldLiftFamilyAlphaHold,false);
 assert.equal(r.releaseReady,false);
 assert.equal(r.modelPromoted,false);
});
