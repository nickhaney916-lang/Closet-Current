/**
 * Mission 2 P2-C35: independent original-photo visual acceptance gate.
 * The 59 original Commons images have recognition labels, NOT independent
 * photographic 3D fitting, photorealism, or blind human-ground-truth ratings.
 * The existing 0016 blouse is recognition holdout but M2 research exposed.
 * Research only. No owner files, production, staging or deployment.
 */
import {readFile as readFileNative} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import sharp from 'sharp';

export const M2_VISUAL_POLICY=Object.freeze({
 schema:'closet-current-mission2-independent-3d-visual-v1',
 partitionLengths:Object.freeze({development:32,validation:11,holdout:16}),
 originalCount:59,
 categories:Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes']),
 figures:Object.freeze(['female','male']),
 views:Object.freeze(['front','side','rear']),
 widths:Object.freeze([320,390,430]),
 researchExposed:Object.freeze(['commons-0016','commons-0053']),
 independentlyRated3DPhotos:0,
 independentBlind3DPhotos:0,
 releaseAuthorized:false
});
const fail=message=>{throw Error('M2 C35 genuine-3d-photo visual gate: '+message);};
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const id=v=>typeof v==='string'&&/^(commons|validation)-[0-9]{4}$/.test(v);
const partitionSpecs=[
 ['development','benchmark/manifest-reviewed-32.json',32],
 ['validation','benchmark/manifest-fresh-11.json',11],
 ['holdout','benchmark/manifest-holdout-16.json',16]
];

export function verifyCohortRecords({locked,development,validation,holdout}={}){
 if(!Array.isArray(locked)||locked.length!==59)fail('59 immutable licensed originals required');
 const sourceById=new Map(),seenHashes=new Set();
 for(const row of locked){
  if(!id(row?.id)||row.image!==row.id+'.jpg'||row.verified!==true||
     !sha(row.sha256)||sourceById.has(row.id)||seenHashes.has(row.sha256)||
     !row.downloadUrl?.startsWith('https://')||
     !row.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')||
     !row.attribution?.license)
   fail('unambiguous original licensed image SHA, URL and attribution required');
  sourceById.set(row.id,row);seenHashes.add(row.sha256);
 }
 const input={development,validation,holdout},assigned=new Set(),rows=[],partitionCounts={};
 const counts=Object.fromEntries(M2_VISUAL_POLICY.categories.map(c=>[c,0]));
 for(const [partition,,count] of partitionSpecs){
  const entries=input[partition];
  if(!Array.isArray(entries)||entries.length!==count)
   fail('frozen original 32/11/16 partitions changed');
  partitionCounts[partition]=count;
  for(const entry of entries){
   const original=sourceById.get(entry?.id);
   if(!original||entry.verified!==true||entry.image!==original.image||
      !entry.expectedCategory||!entry.expectedType||assigned.has(entry.id)||
      (entry.sha256&&entry.sha256!==original.sha256)||
      (entry.source&&entry.source!==original.attribution.source))
    fail('source-partition leakage, category ground truth or original SHA mismatch');
   assigned.add(entry.id);
   if(Object.hasOwn(counts,entry.expectedCategory))counts[entry.expectedCategory]++;
   rows.push(Object.freeze({
    id:entry.id,sha256:original.sha256,image:original.image,
    category:entry.expectedCategory,partition,
    researchExposed:M2_VISUAL_POLICY.researchExposed.includes(entry.id),
    humanRated3D:false,verified3DBlind:false
   }));
  }
 }
 if(assigned.size!==59||Object.values(counts).some(n=>n<2))
  fail('complete source-disjoint, multi-category original photo evidence required');
 if(!rows.some(r=>r.id==='commons-0016'&&r.partition==='holdout'&&r.researchExposed))
  fail('research-exposed blouse cannot pass 3D blind acceptance');
 return Object.freeze({
  rows:Object.freeze(rows),sources:sourceById,
  sourceCount:59,categoryCounts:Object.freeze(counts),
  partitionCounts:Object.freeze(partitionCounts),
  researchExposedInRecognitionHoldout:true,
  blind3DHumanEvidenceCount:0,releaseAuthorized:false
 });
}
export async function inspectOriginalVisualAssets({root='.',readBinary=readFileNative}={}){
 if(typeof root!=='string'||!root||typeof readBinary!=='function')
  fail('bounded read-only source validation required');
 const base=resolve(root);
 const readJSON=async p=>JSON.parse(await readFileNative(join(base,p),'utf8'));
 const [locked,development,validation,holdout]=await Promise.all([
  readJSON('benchmark/locked-photo-sources.json'),
  readJSON('benchmark/manifest-reviewed-32.json'),
  readJSON('benchmark/manifest-fresh-11.json'),
  readJSON('benchmark/manifest-holdout-16.json')
 ]);
 const corpus=verifyCohortRecords({locked,development,validation,holdout});
 let files=0,bytesVerified=0,minWidth=Infinity,minHeight=Infinity;
 const seen=new Set();
 for(const row of corpus.rows){
  const bytes=await readBinary(join(base,'benchmark/fixtures',row.image));
  if(!Buffer.isBuffer(bytes)||bytes.length<4096||bytes.length>25_000_000||
     bytes[0]!==0xff||bytes[1]!==0xd8||
     bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)
   fail('genuine pinned original JPEG absent or invalid');
  const digest=createHash('sha256').update(bytes).digest('hex');
  if(digest!==row.sha256||seen.has(digest))
   fail('original source JPEG SHA changed, duplicate or corrupted');
  seen.add(digest);
  const meta=await sharp(bytes,{limitInputPixels:120_000_000,failOn:'error'}).metadata();
  if(meta.format!=='jpeg'||!Number.isInteger(meta.width)||!Number.isInteger(meta.height)||
     meta.width<80||meta.height<80)fail('decoded original photograph invalid');
  files++;bytesVerified+=bytes.length;
  minWidth=Math.min(minWidth,meta.width);minHeight=Math.min(minHeight,meta.height);
 }
 if(files!==59)fail('incomplete locked genuine photo corpus');
 return Object.freeze({
  schema:M2_VISUAL_POLICY.schema,
  originalSourceJPEGsSHA256Verified:files,
  originalBytesVerified:bytesVerified,
  minimumOriginalWidth:minWidth,minimumOriginalHeight:minHeight,
  categorySourceCounts:corpus.categoryCounts,
  partitionCounts:corpus.partitionCounts,
  researchExposedInRecognitionHoldout:true,
  independent3DBlindSourcesVerified:0,
  independentlyHumanRatedSource3DImages:0,
  originalRecognitionCategoryLabelsNot3DShapeGroundTruth:true,
  independentLegalReviewNotCertified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
/**
 * No user-supplied evidence JSON or screenshot metadata alone authorizes
 * release. Only externally verified independent human, unseen-source, actual
 * photographed garment/fabric, continuous collision, and real devices can
 * eventually satisfy the release requirements. No such verification exists.
 */
export function assessMission2VisualRelease(audit,{renderProofs=[],humanRatings=[],
 blindProofs=[],physicalDeviceProofs=[],signedOwnerProofs=[]}={}){
 if(!audit||audit.schema!==M2_VISUAL_POLICY.schema||
    audit.originalSourceJPEGsSHA256Verified!==59||
    audit.researchExposedInRecognitionHoldout!==true||
    audit.releaseAuthorized!==false||
    ![renderProofs,humanRatings,blindProofs,physicalDeviceProofs,signedOwnerProofs]
      .every(Array.isArray))
  fail('verified full source cohort and separate untrusted evidence lists required');
 const categoryClaims=Object.fromEntries(M2_VISUAL_POLICY.categories.map(c=>[c,0]));
 for(const entry of renderProofs){
  if(!entry||!Object.hasOwn(categoryClaims,entry.category)||
     !id(entry.sourceId)||!sha(entry.originalPhotoSHA256)||
     !sha(entry.renderPNG_SHA256)||!M2_VISUAL_POLICY.widths.includes(entry.width)||
     !M2_VISUAL_POLICY.views.includes(entry.view)||
     !M2_VISUAL_POLICY.figures.includes(entry.figure))
   fail('malformed alleged source-bound photo-to-3d screenshot proof');
  categoryClaims[entry.category]++;
 }
 return Object.freeze({
  originalPhotoCount:59,verifiedOriginals:59,
  categoryCounts:audit.categorySourceCounts,
  submittedNotIndependentlyVerified:Object.freeze({
   renders:renderProofs.length,humanRatings:humanRatings.length,
   unseenOriginals:blindProofs.length,devices:physicalDeviceProofs.length,
   signedOwnerAudits:signedOwnerProofs.length
  }),
  submittedRenderCategoryClaims:Object.freeze(categoryClaims),
  independentlyCertifiedPhotorealismRatings:0,
  independentlyCertifiedUnseen3DSourceCount:0,
  physicalIPhoneAndroid3DVerified:false,
  originalSourceAndSignedPrivateOwnerReleaseVerified:false,
  mathematicallyContinuousClothCollisionVerified:false,
  humanReviewed3DShapeFabricDrapeVerified:false,
  keyBlockers:Object.freeze([
   'research-exposed-holdout-blouse-not-independent-blind-3d-evidence',
   'diverse-original-3d-screenshots-not-independently-reviewed',
   'no-independent-human-source-to-3d-color-shape-fabric-ratings',
   'no-continuous-drape-and-swept-layer-contact-certification',
   'no-physical-iphone-android-3d-acceptance',
   'no-independent-live-signed-owner-privacy-security-acceptance'
  ]),
  humanPhotorealism10of10Certified:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}
