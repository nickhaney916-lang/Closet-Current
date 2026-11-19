/**
 * Real separate museum-source acquisition CI acceptance, not Honolulu
 * source replacement. Internet retrieval is ONLY from exact The Met public
 * IIIF images published on the verified 70759 object record. Does NOT use
 * images from search, similar artifacts or private owner content.
 *
 * Without both genuine JPEG bodies, NO source benchmark admission is possible.
 * Contact sheet is only a research review aid; photo views are NOT asserted
 * to depict front/back or which a/b part without independent inspection.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
import {MET_70759_89,assessMet70759IndependentSource89}
 from '../research/parallel89/met-70759-source-intake89.mjs';

const out='benchmark/parallel89-met70759-source';
await mkdir(out,{recursive:true});
const results=[];
const seen=new Set();
for(const [i,url] of MET_70759_89.publishedPhotoEndpoints.entries()){
 const initial=new URL(url);
 assert.equal(initial.hostname,'collectionapi.metmuseum.org');
 assert.equal(initial.pathname,
  '/api/collection/v1/iiif/70759/'+[2551408,2551409][i]+'/main-image');
 const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(45000),
  headers:{'accept':'image/jpeg'}});
 assert.equal(response.status,200,'original Met published JPEG source unavailable '+url);
 const final=new URL(response.url);
 assert.ok(['collectionapi.metmuseum.org','images.metmuseum.org'].includes(final.hostname),
  'museum image redirected outside authenticated institutional domain');
 const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 assert.equal(type,'image/jpeg','no genuine original JPEG in museum source');
 const arr=new Uint8Array(await response.arrayBuffer());
 assert.ok(arr.byteLength>10000&&arr.byteLength<40000000);
 assert.ok(arr[0]===0xff&&arr[1]===0xd8&&arr[2]===0xff,'not original JPEG magic');
 const m=await sharp(arr,{failOn:'error'}).metadata();
 assert.equal(m.format,'jpeg');
 assert.ok(Number.isInteger(m.width)&&m.width>=400&&m.width<=18000);
 assert.ok(Number.isInteger(m.height)&&m.height>=400&&m.height<=18000);
 const sha256=createHash('sha256').update(arr).digest('hex');
 assert.ok(!seen.has(sha256),'original images must be different public source photos');
 seen.add(sha256);
 // No source-original image is committed into repo. Source-only copy is
 // ephemeral artifact to allow copyright/source inspection in research CI.
 await writeFile(join(out,'met-70759-iiif-'+[2551408,2551409][i]+'.jpg'),arr);
 const receipt={
  sourceObjectId:70759,sourceObjectNumber:'1983.21a, b',
  sourceUrl:url,responseOrigin:final.hostname,
  redirectedToNonMuseumHost:false,httpStatus:response.status,
  contentType:type,byteLength:arr.length,
  sha256,widthPixels:m.width,heightPixels:m.height,
  jpegMagicVerified:true,actualBytesHashed:true,actualImageDecoded:true,
  photoPartExactHumanVerified:false,
  originalCameraCalibrationClaimed:false
 };
 results.push(receipt);
}
const audit=assessMet70759IndependentSource89({images:results});
assert.equal(audit.status,
 'MET_SAME_OBJECT_MEASUREMENTS_AND_TWO_PUBLISHED_JPEGS_ATTESTED_RESEARCH_ONLY');
assert.equal(audit.sourceCollectionObjectNumber,'1983.21a, b');
assert.equal(audit.aAndBAreDifferentCatalogParts,true);
assert.equal(audit.sourceEligibleForNewIndependentBenchmark,true);
assert.equal(audit.sourceImagePartAndFrontBackLabelRequiresIndependentInspection,true);
assert.equal(audit.actualSourceCameraParametersKnown,false);
assert.equal(audit.actualRealGarmentWearerWaistCircumferenceKnown,false);
assert.equal(audit.canUseMetMeasurementsToCalibrateHonolulu5152_1,false);
assert.equal(audit.consumer3DAdmitted,false);
assert.equal(audit.releaseAuthorized,false);
const metadata={schema:'M2-actual-met-70759-published-image-JPEG-SHA256-source-only/v1',
 objectPage:'https://www.metmuseum.org/art/collection/search/70759',
 imageReceipts:results,sourceEligibility:audit,realWearableFitOrCameraApproval:false,
 originalHonoluluPhotoAndOriginal163BoneRigUnmodified:true,
 familyAlpha:'HOLD',noMergeNoDeploy:true};
await writeFile(join(out,'met-70759-source-evidence.json'),
 JSON.stringify(metadata,null,2)+'\n');
console.log('P89_GENUINE_MET_MEASURED_SOURCE_RESEARCH_ONLY '+JSON.stringify({
 status:audit.status,partCount:2,actualDistinctJPEGCount:results.length,
 pubPhotoIds:[2551408,2551409],
 img:results.map(x=>({sha256:x.sha256,width:x.widthPixels,
  height:x.heightPixels,bytes:x.byteLength})),
 catalogMeasurementsMm:audit.catalogPartDimensionsMm,
 sourceIndependentOfHonolulu:true,
 selectedOriginalPhoto3DAdmitted:false,familyAlpha:'HOLD'
}));
