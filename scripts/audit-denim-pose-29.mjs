/** P29 independent SHA-256 screenshot proof and 12 actual WebGL contact sheets. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const input='benchmark/denim-pose-29',output='benchmark/denim-pose-29-review';
await mkdir(output,{recursive:true});
const m=JSON.parse(await readFile(join(input,'results.json'),'utf8'));
assert.equal(m.authenticWebGLFrames,96);
assert.equal(m.rows.length,96);
assert.equal(m.familyAlpha,'HOLD');
assert.equal(m.releaseAuthorized,false);
assert.equal(m.physicalDeviceTested,false);
assert.equal(m.dynamicFabricSimulationApproved,false);
assert.equal(m.sweptCollisionCertified,false);
assert.deepEqual(m.errors,[]);assert.deepEqual(m.external,[]);
const keys=new Set(),contacts=[];
for(const row of m.rows){
 const key=[row.width,row.rig,row.denimIndex,row.pose,row.angle].join('|');
 assert.ok(!keys.has(key),'P29 duplicate real 3D frame');keys.add(key);
 assert.ok([320,390,430].includes(row.width));
 assert.ok(['male','female'].includes(row.rig));
 assert.ok([0,1].includes(row.denimIndex));
 assert.ok(['left-12','right-12','both-16','source'].includes(row.pose));
 assert.ok([90,180].includes(row.angle));
 assert.equal(row.sourceSHA256,m.originalSources[row.denimIndex]);
 assert.equal(row.realBodyContacts,0);
 assert.equal(row.account,'fixture-account-a');
 assert.equal(row.originalPhotoProtected,true);
 assert.equal(row.syntheticRearPhoto,false);
 assert.equal(row.releaseAuthorized,false);
 assert.ok(row.denimPixels>=1200);
 if(row.pose==='source')assert.ok(row.phase==='SOURCE_FIT_RESTORED'&&row.fitVisible);
 else assert.ok(row.phase==='BENT_SOURCE_ONLY'&&!row.fitVisible);
 const bytes=await readFile(join(input,row.screenshot));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  row.screenshotSHA256,'P29 original JPEG WebGL screenshot SHA did not match');
}
assert.equal(keys.size,96);
for(const width of [320,390,430])for(const rig of ['female','male'])
 for(const denimIndex of [0,1]){
  const comps=[];let col=0;
  for(const pose of ['left-12','right-12','both-16','source'])
   for(const angle of [90,180]){
    const name=width+'-'+rig+'-denim-'+denimIndex+'-'+pose+'-view-'+angle+'.png';
    const bytes=await readFile(join(input,name));
    const frame=await sharp(bytes).resize({width:220,height:320,
      fit:'contain',background:'#ffffff'}).png().toBuffer();
    comps.push({input:frame,left:col*220,top:25});
    const label=pose+' '+angle+' deg';
    comps.push({input:Buffer.from('<svg width="220" height="25">'+
      '<rect width="220" height="25" fill="white"/>'+
      '<text x="5" y="18" fill="#111" font-size="13" font-family="sans-serif">'+
      label+'</text></svg>'),left:col*220,top:0});
    col++;
   }
  const sheet=await sharp({create:{width:1760,height:345,channels:3,
   background:'#ffffff'}}).composite(comps).jpeg({quality:90}).toBuffer();
  const name=width+'-'+rig+'-denim-'+denimIndex+'-knee-pose-contact.jpg';
  await writeFile(join(output,name),sheet);
  contacts.push({name,sha256:createHash('sha256').update(sheet).digest('hex')});
 }
assert.equal(contacts.length,12);
const result={priority:'DENIM-POSE-29',verifiedOriginalSourceWebGLFrames:96,
  independentSHA256Verified:96,kneePoseTransitions:4,contactSheets:contacts,
  originalPhotoUnchanged:true,authenticatedFixtureAccountIsolation:true,
  realSkinnedBodyContactZero:true,
  sourceP28RestRecoveryAudited:true,bentP28FittedClaimProhibited:true,
  humanRealismVerdict:'REVIEW',consumerPhonesTested:false,
  sweptCollisionCertified:false,familyAlpha:'HOLD',
  productionModified:false,releaseAuthorized:false};
await writeFile(join(output,'visual-evidence.json'),JSON.stringify(result,null,2));
console.log('DENIM29_SOURCE_POSE_QA',JSON.stringify({screenshots:96,
 contactSheets:12,sourceRestVerified:true,bentClothModeling:'UNVERIFIED_REST_FALLBACK',
 release:'HOLD'}));
