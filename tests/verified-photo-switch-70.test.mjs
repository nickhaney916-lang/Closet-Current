import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 MIN_REPLACEMENT_BYTES70,MAX_REPLACEMENT_BYTES70,
 validReplacementFile70,sourcePreflightStillCurrent70
} from '../research/verified-photo-switch-70/source-preflight.mjs';
const file=size=>({size,arrayBuffer:async()=>new Uint8Array(size).buffer});
const current=()=>({
 selection:2,currentSelection:2,reviewEpoch:12,currentReviewEpoch:12,
 owner:'owner-A',currentOwner:'owner-A',
 dbName:'closet-current-user-owner-A',submitting:false
});
test('SOURCE70 valid exact-size original JPEG file is eligible for full proof/decode, not asserted valid on MIME alone',()=>{
 assert.equal(MIN_REPLACEMENT_BYTES70,128);
 assert.equal(MAX_REPLACEMENT_BYTES70,10485760);
 assert.equal(validReplacementFile70(file(128)),true);
 assert.equal(validReplacementFile70(file(10485760)),true);
});
test('SOURCE70 empty/oversized/negative/corrupt-size files are excluded before any old review revoke',()=>{
 for(const x of [
  null,undefined,{},file(0),file(127),file(10485761),
  {...file(400),size:-1},{...file(400),size:NaN},
  {...file(400),size:Infinity},{...file(400),size:12.5},
  {...file(400),arrayBuffer:null},{...file(400),size:'400'},
  {...file(400),size:2**53}
 ])assert.equal(validReplacementFile70(x),false,String(x?.size));
});
test('SOURCE70 a current signed owner/source epoch can complete its staged replacement',()=>{
 assert.equal(sourcePreflightStillCurrent70(current()),true);
});
test('SOURCE70 delayed prior file selection cannot replace newer input for same owner',()=>{
 assert.equal(sourcePreflightStillCurrent70({...current(),currentSelection:3}),false);
});
test('SOURCE70 stale save/source review epoch cannot replace newer photo or confirmed manual review',()=>{
 assert.equal(sourcePreflightStillCurrent70({...current(),currentReviewEpoch:13}),false);
});
test('SOURCE70 logout/owner switch cannot resurrect old original photo or confirmed crop',()=>{
 assert.equal(sourcePreflightStillCurrent70({...current(),currentOwner:null}),false);
 assert.equal(sourcePreflightStillCurrent70({...current(),currentOwner:'owner-B'}),false);
});
test('SOURCE70 private database identity must match captured owner, not only current session label',()=>{
 assert.equal(sourcePreflightStillCurrent70({...current(),dbName:'closet-current-user-owner-B'}),false);
 assert.equal(sourcePreflightStillCurrent70({...current(),dbName:undefined}),false);
});
test('SOURCE70 cannot switch sources during an owner-private atomic save',()=>{
 assert.equal(sourcePreflightStillCurrent70({...current(),submitting:true}),false);
});
test('SOURCE70 malformed attempt ID, epoch and owner cannot qualify for source replacement',()=>{
 for(const x of [
  {selection:0},{selection:-1},{selection:NaN},{selection:1.8},
  {reviewEpoch:-1},{reviewEpoch:undefined},{owner:''},{owner:null}
 ])assert.equal(sourcePreflightStillCurrent70({...current(),...x}),false,JSON.stringify(x));
});
test('SOURCE70 exact current attempts after canceled older ones cannot overtake when epoch advances',()=>{
 const old=current(),newer={...current(),selection:3,currentSelection:3};
 assert.equal(sourcePreflightStillCurrent70(old),true);
 assert.equal(sourcePreflightStillCurrent70({...old,currentSelection:3}),false);
 assert.equal(sourcePreflightStillCurrent70(newer),true);
 assert.equal(sourcePreflightStillCurrent70({...newer,currentReviewEpoch:13}),false);
});
test('SOURCE70 UI stages source canonical SHA and full image decode before any revoke or new state',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const a=s.indexOf('async function startFile(file)'),b=s.indexOf('async function commit()',a);
 assert.ok(a>0&&b>a);
 const body=s.slice(a,b);
 const proof=body.indexOf('const proof=await makeProof(file,owner)');
 const decoded=body.indexOf('const decoded=await ensureImage(proof.image)');
 const prompt=body.indexOf('window.confirm(DISCARD_PROMPT68)');
 const revoke=body.indexOf('revoke();canceled=false;');
 const newstate=body.indexOf('state={owner,proof,decoded,pieces:[]};');
 assert.ok(proof>=0&&decoded>proof&&prompt>decoded&&revoke>prompt&&newstate>revoke,
  'SHA proof and decoded original must be complete before consent and state replacement');
 assert.match(body,/if\(!validReplacementFile70\(file\)\)/);
});
test('SOURCE70 original review is NEVER reset by a failing replacement photo',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const body=s.slice(s.indexOf('async function startFile(file)'),s.indexOf('async function commit()'));
 const fail=body.lastIndexOf('}catch(error)');
 const block=body.slice(fail);
 assert.ok(fail>0);
 assert.match(block,/if\(pending\(\)\)status\.textContent/);
 assert.match(block,/original photo and reviewed clothing remain unchanged; nothing was saved/);
 assert.doesNotMatch(block,/reset\(|revoke\(|state=null|original\.removeAttribute/);
});
test('SOURCE70 selection and logout revoke both invalidate pending decoded files',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(s,/let state=null,canceled=false,job=null,renderVersion=0,selectionEpoch70=0/);
 assert.match(s,/function revoke\(\)\{cancelClassification42\(\);canceled=true;renderVersion\+\+;selectionEpoch70\+\+/);
 assert.match(s,/const selection=\+\+selectionEpoch70,priorEpoch=epoch/);
 assert.match(s,/sourcePreflightStillCurrent70\(\{/);
 assert.match(s,/getDb\(\)\?\.name,submitting/);
});
test('SOURCE70 unexpected decoder/reformat failure stays before switching old original JPEG',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=s.indexOf('async function startFile(file)'),end=s.indexOf('async function commit()',start);
 const body=s.slice(start,end),revoke=body.indexOf('revoke();canceled=false;');
 assert.ok(body.indexOf('c.getContext(\'2d\').drawImage(decoded')<revoke);
 assert.ok(body.indexOf("inference=c.toDataURL('image/jpeg',.9)")<revoke);
});
test('SOURCE70 existing owner session lock/pagehide still immediately remove private original photo',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(s,/original\.removeAttribute\('src'\);original\.hidden=true;grid\.replaceChildren\(\)/);
 assert.match(s,/addEventListener\('closet:session-locked',\(\)=>reset/);
 assert.match(s,/addEventListener\('pagehide',\(\)=>revoke/);
});
test('SOURCE70 actual native acceptance exercises two invalid originals before a valid distinct-photo switch',()=>{
 const script=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const term of [
  "const source70=process.env.SOURCE70==='1'",
  'not-really-a-jpeg.jpg',
  'jpeg-envelope-but-corrupt.jpg',
  'Could not verify selected replacement photo',
  '02b-invalid-false-jpeg-preserves-reviewed-original-all',
  '02c-undecodable-jpeg-envelope-preserves-reviewed-original-all',
  '02a-cancel-switch-preserves-three-reviewed-crops-all',
  '03b-approved-switch-clears-unsaved-keeps-private-closet-all',
  'multi24-B','v4Backup:true','v4Restore:true'
 ])assert.ok(script.includes(term),'Missing actual native evidence '+term);
});
