/** Actual separate real P84/P541 source + screenshot byte attestation for P89.
 * No owner data, no hosted environment, no consumer 3D admission.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {VERIFIED_DONOR89,verifyActualPublicPair89} from '../research/parallel89/verify-p84-public-pair.mjs';
const [p84Arg,donorArg,engine]=process.argv.slice(2);
if(!p84Arg||!donorArg||!['chromium','webkit'].includes(engine))throw Error('P89 immutable real donor and native browser required');
const p84=resolve(p84Arg),donor=resolve(donorArg);
if(p84===donor||p84===resolve('.')||donor===resolve('.')||p84==='/'||donor==='/')
 throw Error('P89 refusing source worktree path overlap');
const hash=b=>createHash('sha256').update(b).digest('hex');
const data=async (dir,path)=>readFile(join(dir,path));
const j=async(dir,path)=>JSON.parse(await data(dir,path));
const ensureJpeg=b=>assert.ok(b.length>=1000&&b[0]===255&&b[1]===216&&b[2]===255,'P89 actual JPEG required');
const ensurePng=b=>assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a','P89 real PNG required');
const manifest=await j(donor,'benchmark/locked-photo-sources.json'),
  work47=await j(donor,'benchmark/work47/manifest.json');
const row=manifest.find(x=>x.id===VERIFIED_DONOR89.shirt.id),
  photoRow=work47.rows?.find(x=>x.id===VERIFIED_DONOR89.shirt.id);
assert.ok(row?.verified===true&&row.sha256===VERIFIED_DONOR89.shirt.originalSHA256&&
 row.attribution?.license===VERIFIED_DONOR89.shirt.license&&
 row.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')&&
 photoRow?.ownerApproved===false&&photoRow.sourceSHA256===VERIFIED_DONOR89.shirt.originalSHA256&&
 typeof photoRow.cutoutSHA256==='string','P89 public shirt provenance/alpha missing');
const shirtJPEG=await data(donor,VERIFIED_DONOR89.shirt.path),
 shirtCutout=await data(donor,VERIFIED_DONOR89.shirt.cutout);
ensureJpeg(shirtJPEG);ensurePng(shirtCutout);
assert.equal(hash(shirtJPEG),VERIFIED_DONOR89.shirt.originalSHA256,'P89 original shirt edited');
assert.equal(hash(shirtCutout),photoRow.cutoutSHA256,'P89 shirt source cutout changed');
const source={shirt:{originalSHA256:hash(shirtJPEG),cutoutSHA256:hash(shirtCutout),
 license:row.attribution.license,ownerApproved:false},denims:{}};
for(const id of ['public','second']){
 const pin=VERIFIED_DONOR89.denims[id],metrics=await j(donor,pin.metrics);
 const original=await data(donor,pin.path),cutout=await data(donor,pin.cutout);
 ensureJpeg(original);ensurePng(cutout);
 assert.equal(hash(original),pin.originalSHA256,'P89 actual denim original SHA changed');
 assert.equal(hash(cutout),pin.cutoutSHA256,'P89 actual denim mask changed');
 assert.ok(metrics.id===pin.id&&metrics.sourcePage===pin.sourcePage&&
  metrics.license===pin.license&&metrics.originalSHA256===pin.originalSHA256&&
  metrics.cutoutSHA256===pin.cutoutSHA256&&metrics.ownerApproved===false&&
  metrics.humanVisualApproval===false&&metrics.releaseAuthorized===false,
 'P89 actual denim original/mask source provenance mismatch');
 source.denims[id]={id:pin.id,sourcePage:pin.sourcePage,license:metrics.license,
  originalSHA256:hash(original),cutoutSHA256:hash(cutout),
  ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false};
}
const relative='benchmark/parallel84-source-pair/'+engine+'/',
 result=await j(p84,relative+'results.json'),images={};
assert.ok(Array.isArray(result.captures)&&Array.isArray(result.fallbacks),
 'P89 actual P84 renderer screenshots missing');
for(const x of [...result.captures,...result.fallbacks]){
 assert.ok(typeof x?.name==='string'&&/^(?:source-pair-(?:webkit|chromium)-\d+-(?:female|male)-(?:public|second)-(?:0|45|90|180)|original-2d-(?:320|390|430))\.png$/.test(x.name),
 'P89 only expected source-evidence screenshot paths');
 if(Object.hasOwn(images,x.name))throw Error('P89 duplicate photo screenshot');
 const file=await data(p84,relative+x.name);ensurePng(file);
 assert.ok(file.byteLength>1500&&file.byteLength<10_000_000,'P89 screenshot dimensions/bytes invalid');
 images[x.name]=hash(file);
}
const proof=verifyActualPublicPair89({result,source,images,engine});
if(proof.status!=='TWO_GENUINE_PHOTOGRAPHED_ITEMS_RENDERED_NOT_3D_ACCEPTED')
 throw Error('P89 source-locked paired-WebGL rejected: '+proof.reason);
const output='benchmark/parallel89-real-pair/'+engine+'/';
await mkdir(output,{recursive:true});
await writeFile(output+'receipt.json',JSON.stringify({...proof,
  sourceRecords:Object.freeze([
   {id:VERIFIED_DONOR89.shirt.id,originalSHA256:source.shirt.originalSHA256,
    maskSHA256:source.shirt.cutoutSHA256,license:source.shirt.license},
   ...['public','second'].map(id=>({id:source.denims[id].id,
    originalSHA256:source.denims[id].originalSHA256,
    maskSHA256:source.denims[id].cutoutSHA256,license:source.denims[id].license}))
  ]),
  sourceAlphaIndependentHumanReviewed:false,
  statusIsMeasuredPhotoIdentityNotVisualRealism:true,
  resultSHA256:hash(await data(p84,relative+'results.json'))
 },null,2)+'\n');
console.log('P89_GENUINE_TWO_PIECE_SOURCE_INTEGRITY_NOT_RELEASE',JSON.stringify(proof));