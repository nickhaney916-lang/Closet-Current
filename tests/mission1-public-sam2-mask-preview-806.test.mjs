import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {webcrypto} from 'node:crypto';
import {verifyPublicOriginalSAM2ResearchMask806,SAM2_EVIDENCE_SOURCE_SHA256_806}
 from '../public/mission1-public-sam2-mask-preview-806.mjs';

// These are immutable P804 *Playwright* source coordinates, not real-human
// truth. PUBLIC ORIGINAL only. The genuine PNG is provided by exact prior
// GitHub Actions artifact in the dedicated P806 browser job, never production.
const sha=SAM2_EVIDENCE_SOURCE_SHA256_806;
const rect=(browser='chromium')=>{
 const [x0,y0,x1,y1]=browser==='chromium'?[360,426,1589,2530]:[360,432,1589,2535];
 return {schema:'closet-current-m1-owner-original-rectangle-800/review-only/v1',
  sourceSHA256:sha,sourceWidth:1920,sourceHeight:2880,
  ownerId:'fixture-owner-1',sourceId:'fixture-photo-1',
  x0,y0,x1,y1,twoVerifiedOriginalJPEGCornerTaps:true};
};
const point=(browser='chromium')=>{
 const [pointX,pointY]=browser==='chromium'?[955,1434]:[955,1440];
 return {schema:'closet-current-m1-owner-original-point-798/review-only/v1',
  ownerId:'fixture-owner-1',sourceId:'fixture-photo-1',sourceSHA256:sha,
  sourceWidth:1920,sourceHeight:2880,pointX,pointY,
  sourceBytesSHA256Verified:true,capturedFromOriginalJPEG:true};
};
const source={image:'data:image/jpeg;base64,'+'AA'.repeat(64),sha256:sha};
const args=()=>({originalSource:source,box:rect(),point:point(),
 actorBrowser:'chromium',pngBase64:'AA'.repeat(64),stillCurrent:()=>true,
 cryptoProvider:webcrypto});
test('P806 never accepts a foreign owner/point/rectangle/source or missing lease',async()=>{
 const pairs=[
  {originalSource:{...source,sha256:'0'.repeat(64)}},
  {box:{...rect(),sourceSHA256:'0'.repeat(64)}},
  {box:{...rect(),ownerId:'another-owner'}},
  {point:{...point(),ownerId:'another-owner'}},
  {box:{...rect(),twoVerifiedOriginalJPEGCornerTaps:false}},
  {point:{...point(),sourceBytesSHA256Verified:false}},
  {stillCurrent:()=>false},
  {actorBrowser:'not-P804-verified'},
  {box:{...rect(),x0:359}},
  {point:{...point(),pointX:956}},
  {box:{...rect(),sourceHeight:100}}
 ];
 for(const values of pairs)
  await assert.rejects(()=>verifyPublicOriginalSAM2ResearchMask806({...args(),...values}),
   /only pinned public SHA/,JSON.stringify(Object.keys(values)));
});
test('P806 rejects non-PNG, oversized or malformed immutable model mask bytes',async()=>{
 for(const pngBase64 of ['AAA','%%%','AAAA'.repeat(60001),'AA'.repeat(100)])
  await assert.rejects(()=>verifyPublicOriginalSAM2ResearchMask806({...args(),pngBase64}),
   /only pinned public SHA|not a PNG|budget/);
});
test('P806 requires identical SHA-bound original point and box browser engine',async()=>{
 await assert.rejects(()=>verifyPublicOriginalSAM2ResearchMask806({...args(),
  actorBrowser:'webkit'}),/only pinned public SHA/);
 await assert.rejects(()=>verifyPublicOriginalSAM2ResearchMask806({...args(),
  box:rect('webkit'),point:point()}),/only pinned public SHA/);
});
test('P806 genuine P804 archived model PNG validates by cryptographic SHA when artifact is supplied',async(t)=>{
 const folder=process.env.M1_P806_PUBLIC_SAM2_ARTIFACT_DIR;
 if(!folder){t.skip('Exact signed GitHub artifact available only in dedicated browser acceptance job');return;}
 for(const browser of ['chromium','webkit']){
  const pngBase64=readFileSync(resolve(folder,'mask-'+browser+'-pointBox-UNVERIFIED.png')).toString('base64');
  const result=await verifyPublicOriginalSAM2ResearchMask806({...args(),
   actorBrowser:browser,box:rect(browser),point:point(browser),pngBase64});
  assert.equal(result.currentBrowserDidNotRunSAM2,true);
  assert.equal(result.previewOnly,true);
  assert.equal(result.sourceSHA256,sha);
  assert.match(result.dataURL,/^data:image\/png;base64,/);
  for(const k of ['autoSaveAllowed','maskVerifiedByHuman','independentHumanVerified',
   'privateOwnerModelRun','privatePersisted','externalUpload','releaseAuthorized'])
   assert.equal(result[k],false,k);
 }
});
test('P806 preview module has no private photo export, model execution or storage',()=>{
 const src=readFileSync('public/mission1-public-sam2-mask-preview-806.mjs','utf8');
 for(const forbidden of ['fetch(', 'localStorage.', 'indexedDB.', 'XMLHttpRequest',
  'postMessage(', 'InferenceSession','AutoModel.from_pretrained','navigator.sendBeacon',
  'source.image=','store.put('])
  assert.equal(src.includes(forbidden),false,forbidden);
});
