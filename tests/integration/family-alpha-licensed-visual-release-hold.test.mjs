import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {
 GALLERY_SHA,GALLERY_FILE,INSPECTION_FILE,
 auditFamilyVisualEvidence,auditPinnedFamilyVisualEvidence
} from '../../scripts/audit-family-alpha-licensed-visual-release-hold.mjs';
const source=()=>JSON.parse(execFileSync('git',['show',GALLERY_SHA+':'+GALLERY_FILE]).toString('utf8'));
const notes=async()=>JSON.parse(await readFile(INSPECTION_FILE,'utf8'));
test('source pinned independent real-photo benchmark makes visual gate HOLD, despite technical browser PASS',async()=>{
 const r=await auditPinnedFamilyVisualEvidence();
 assert.equal(r.releaseGate,'HOLD');assert.equal(r.readyForFourAccounts,false);
 assert.equal(r.ownerApproved,false);assert.equal(r.physicalPhoneVerified,false);
 assert.equal(r.photoCohort,15);assert.equal(r.provisionalCutouts,7);
 assert.equal(r.unrenderablePhotos,8);assert.equal(r.visuallyInspected,5);
 assert.equal(r.inspectedFails,3);assert.equal(r.inspectedReviews,2);
 assert.equal(r.inspectedAccepted,0);assert.equal(r.uninspectedProposals,2);
 assert.ok(r.visuallyFailedCases.some(x=>x.id==='commons-0053'&&
  x.issues.some(t=>t.includes('mannequin'))));
 assert.ok(r.visuallyFailedCases.some(x=>x.id==='commons-0082'&&
  x.issues.some(t=>t.includes('single'))));
 assert.equal(new Set([...r.uninspectedIds,...r.noCutoutIds,...r.visuallyFailedCases.map(x=>x.id)]).size,13);
});
test('fake owner release approval, screenshot acceptance or a result upgrade fail closed',async()=>{
 const orig=await notes();
 for(const [key,value] of [
  ['ownerApproved',true],['physicalPhoneVerified',true],
  ['familyReleaseAuthorized',true],['galleryCommit','untrusted']
 ]){
  const copy=structuredClone(orig);copy[key]=value;
  assert.throws(()=>auditFamilyVisualEvidence(source(),copy),/Independent visual inspection/);
 }
 for(const mut of [
  x=>x.inspections[0].assessment='PASS',
  x=>x.inspections[0].ownerApproved=true,
  x=>x.inspections[0].technicalDisplayPassClaim=true,
  x=>x.inspections[0].screenshot='https://elsewhere.invalid/image.png',
  x=>x.inspections.push(structuredClone(x.inspections[0])),
  x=>x.inspections[1].issues=[],
  x=>x.inspections[3].photoCategory='pair of shoes'
 ]){
  const copy=structuredClone(orig);mut(copy);
  assert.throws(()=>auditFamilyVisualEvidence(source(),copy),/Unsupported case annotation|fake visual approval/);
 }
});
test('missing or falsified native garment proposal source cannot become accepted',async()=>{
 const rows=source(),inspection=await notes();
 for(const mut of [
  s=>s.rows[0].sourceSHA256='deadbeef',
  s=>s.rows[0].ownerApproved=true,
  s=>s.rows[0].decision='PASS',
  s=>s.rows[0].work30NativeCutoutSHA256=null,
  s=>s.rows.splice(0,1),
  s=>s.rows[1].id=s.rows[0].id,
  s=>s.rows[1].hasProposal=true
 ]){
  const altered=structuredClone(rows);mut(altered);
  assert.throws(()=>auditFamilyVisualEvidence(altered,inspection),/Unverified|Expected immutable|falsely accepted/);
 }
});
test('no-cutout garments never become rendered by rebranding them REVIEW',async()=>{
 const row=source().rows.find(x=>!x.hasProposal),note=await notes();
 note.inspections.push({
  id:row.id,photoCategory:row.role,assessment:'REVIEW',
  issues:['unavailable cropped mask must not be forged'],
  explanation:'Cannot preview a nonexistent transparent garment from original JPEG.',
  screenshot:'screenshots/chromium-390-'+row.id+'-PROVISIONAL-HOLD.png',
  ownerApproved:false,technicalDisplayPassClaim:false
 });
 assert.throws(()=>auditFamilyVisualEvidence(source(),note),/Cannot inspect a rendered garment/);
});
