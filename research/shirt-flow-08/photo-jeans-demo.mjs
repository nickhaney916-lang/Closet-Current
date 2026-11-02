/** 3D31: local-only owner-review research preview. No photo is automatically
 * accepted, no camera, storage, accounts, backend or deployment. */
import {mountAnatomicalShowroom} from './showroom.mjs';
import {PANTS_RESEARCH_SOURCE} from '../three-d-30/reviewed-photo-pants.mjs';
import {loadLicensedCutout} from '../three-d-02/reviewed-texture.mjs';
import {SHIRT_FLOW01,armPoseAt01,assertVerifiedShirtPose01,createArmPoseCycle01} from '../shirt-flow-01/arm-motion-gate.mjs';
const $=id=>document.getElementById(id),urls=[],status=text=>{$('status').textContent=text;};
let app,pants,shirt,ready=false,closed=false,armCycle=null,armTimer=null;
const flowEnabled=()=>new URLSearchParams(location.search).get('shirtFlow')==='after'&&new URLSearchParams(location.search).get('move56')==='after'&&new URLSearchParams(location.search).get('construction')==='after'&&new URLSearchParams(location.search).get('sweep')==='after';
function stopArms(){if(armTimer!==null){clearInterval(armTimer);armTimer=null;}armCycle?.dispose();armCycle=null;}
const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function imageFrom(url,sha,id){
 if(!/^\/benchmark\/(?:three-d-31\/(?:original-jeans\.jpg|cutout-proposal\.png)|work47\/assets\/commons-0003\.(?:jpg|png))$/.test(url))throw Error('Only original local research assets allowed');
 const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('Original source unavailable: '+id);
 const ab=await res.arrayBuffer();if(ab.byteLength<1000||ab.byteLength>3e6||await digest(ab)!==sha)throw Error('Original image hash mismatch: '+id);
 const b=new Blob([ab],{type:url.endsWith('.png')?'image/png':'image/jpeg'}),u=URL.createObjectURL(b);urls.push(u);
 const img=new Image();img.src=u;await img.decode();return img;
}
function verifyVisibleRGB(original,cutout){
 if(original.naturalWidth!==cutout.naturalWidth||original.naturalHeight!==cutout.naturalHeight||original.naturalWidth!==435||original.naturalHeight!==650)throw Error('Original image dimensions changed');
 const w=original.naturalWidth,h=original.naturalHeight,read=img=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return ctx.getImageData(0,0,w,h).data;};
 const a=read(original),b=read(cutout);let n=0,violations=0;
 for(let i=0;i<a.length;i+=4)if(b[i+3]){n++;if(Math.abs(a[i]-b[i])>2||Math.abs(a[i+1]-b[i+1])>2||Math.abs(a[i+2]-b[i+2])>2)violations++;}
 if(n<60000||violations>0)throw Error('Visible jeans fabric RGB mismatch; preview blocked ('+violations+')');
 // Source-derived neutral backing from only high-opacity original denim, never
 // fabricated texture/detail for the side or unphotographed rear.
 const colors=[[],[],[]];for(let i=0;i<a.length;i+=16)if(b[i+3]>=240&&b[i+2]>b[i]&&b[i+2]>b[i+1]){
  for(let k=0;k<3;k++)colors[k].push(b[i+k]);
 }
 if(colors.some(v=>v.length<100))throw Error('Cannot establish source-denim neutral color');
 const neutralRGB=colors.map(v=>{v.sort((x,y)=>x-y);return v[Math.floor(v.length/2)];});
 return {pixels:n,neutralRGB};
}
function update(){if(app)$('diagnostics').textContent=JSON.stringify(app.getState(),null,2);}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Research preview is localhost only');
 const independentGarments=new URLSearchParams(location.search).get('construction')==='after';
 const poseContactFactory=independentGarments?(await import('../shirt-flow-02/posed-contact.mjs')).createPoseContact:null;
 app=mountAnatomicalShowroom($('avatar'),{independentGarments,poseContactFactory,poseConditionedSleeveDrape:independentGarments&&new URLSearchParams(location.search).get('move56')==='after',gravityFabricFlow:independentGarments&&new URLSearchParams(location.search).get('fabricFlow')==='after',torsoDrape04:independentGarments&&new URLSearchParams(location.search).get('torsoFlow')==='after',temporalDrape05:independentGarments&&new URLSearchParams(location.search).get('timeFlow')==='after',sourceClothLight06:independentGarments&&new URLSearchParams(location.search).get('lightFlow')==='after',sourceWeightedFolds07:independentGarments&&new URLSearchParams(location.search).get('foldFlow')==='after',sourceHemSwing08:independentGarments&&new URLSearchParams(location.search).get('hemFlow')==='after',crispSourcePhotoClarity:independentGarments&&new URLSearchParams(location.search).get('crisp58')==='after',naturalShoulderFall61:independentGarments&&new URLSearchParams(location.search).get('fit59')==='after'&&new URLSearchParams(location.search).get('slope61')==='after',trueShoulderTop64:independentGarments&&new URLSearchParams(location.search).get('slope61')==='after'&&new URLSearchParams(location.search).get('crest64')==='after',anatomicalShirtSideFlow:independentGarments&&new URLSearchParams(location.search).get('rear53')==='after'&&new URLSearchParams(location.search).get('round54')==='after'&&new URLSearchParams(location.search).get('hang55')==='after'&&new URLSearchParams(location.search).get('fit59')==='after',tailoredShoulderSleeves:independentGarments&&new URLSearchParams(location.search).get('sleeve44')==='after',independentShoulderCaps:independentGarments&&new URLSearchParams(location.search).get('sleeve44')==='after'&&new URLSearchParams(location.search).get('caps45')==='after',realisticShoulderContour:independentGarments&&new URLSearchParams(location.search).get('caps45')==='after'&&new URLSearchParams(location.search).get('contour46')==='after',upperArmFabricVolume:independentGarments&&new URLSearchParams(location.search).get('contour46')==='after'&&new URLSearchParams(location.search).get('volume47')==='after',sourceNeutralCollarRoll:independentGarments&&new URLSearchParams(location.search).get('volume47')==='after'&&new URLSearchParams(location.search).get('collar48')==='after',rearShirtFabricRelief:independentGarments&&new URLSearchParams(location.search).get('collar48')==='after'&&new URLSearchParams(location.search).get('rear53')==='after',naturalShoulderSleeveTransition:independentGarments&&new URLSearchParams(location.search).get('rear53')==='after'&&new URLSearchParams(location.search).get('round54')==='after',sourceMeasuredSleeveHang:independentGarments&&new URLSearchParams(location.search).get('rear53')==='after'&&new URLSearchParams(location.search).get('round54')==='after'&&new URLSearchParams(location.search).get('hang55')==='after',naturalPantsDrape:new URLSearchParams(location.search).get('pantsDrape')!=='before',posteriorJeansFairing:new URLSearchParams(location.search).get('seatFairing')!=='before',structuralPantsEnvelope:new URLSearchParams(location.search).get('envelope')!=='before',independentJeansLoft:new URLSearchParams(location.search).get('loft')!=='before',crotchSeatPanel:new URLSearchParams(location.search).get('crotchPanel')!=='before',sourceShirtWaistFit:new URLSearchParams(location.search).get('waistFit')!=='before',clothWaistContact:new URLSearchParams(location.search).get('waistContact')!=='before',shirtHangingSilhouette:new URLSearchParams(location.search).get('hanging')!=='before',denimHangingSilhouette:new URLSearchParams(location.search).get('hanging')!=='before',jeansPanelFall:new URLSearchParams(location.search).get('clothFall')==='after'});app.start();
 const [original,cutout,m]=await Promise.all([
  imageFrom('/benchmark/three-d-31/original-jeans.jpg',PANTS_RESEARCH_SOURCE.originalSHA256,'source'),
  imageFrom('/benchmark/three-d-31/cutout-proposal.png',PANTS_RESEARCH_SOURCE.cutoutSHA256,'mask'),
  fetch('/benchmark/three-d-31/metrics.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Provenance missing');return r.json();})
 ]);
 if(m.originalSHA256!==PANTS_RESEARCH_SOURCE.originalSHA256||m.cutoutSHA256!==PANTS_RESEARCH_SOURCE.cutoutSHA256||m.ownerApproved!==false||m.releaseAuthorized!==false||m.humanVisualApproval!==false||m.imageOrientation!=='laid-flat-front')throw Error('Research proposal provenance mismatch');
 const verified=verifyVisibleRGB(original,cutout);
 if(!Array.isArray(m.bbox)||m.bbox.length!==4||m.width!==435||m.height!==650)throw Error('Pinned silhouette bounds missing');
 const [l,t,r,b]=m.bbox;
 if(l<0||t<0||r>=m.width||b>=m.height||r-l<200||b-t<300)throw Error('Invalid verified pants alpha silhouette');
 // Cropping to the SOURCE alpha silhouette—not the JPEG background—keeps
 // original photographed waistband and hems aligned to the skinned pants.
 const cropRect=[l/m.width,t/m.height,(r-l+1)/m.width,(b-t+1)/m.height];
 $('original').src=original.src;$('cutout').src=cutout.src;
 pants=Object.freeze({id:PANTS_RESEARCH_SOURCE.id,type:'pants',sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256,cutoutSHA256:PANTS_RESEARCH_SOURCE.cutoutSHA256,
  cutout,original,originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
  cropRect,neutralColorRGB:verified.neutralRGB,ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
 const manifest=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'}).then(r=>r.json());
 shirt=await loadLicensedCutout('commons-0003',{manifest,reviewConfirmed:true});
 await app.load('female');ready=true;status('Original RGB verified at '+verified.pixels+' visible pixels; source-dominant neutral backing and alpha silhouette registered. Research mask REVIEW · HOLD');update();
 $('model').addEventListener('change',async()=>{if(closed)return;stopArms();ready=false;$('review').checked=false;$('photo').disabled=true;$('full').disabled=true;await app.load($('model').value);ready=true;update();status('New original anatomical model · provisional photo requires fresh review');});
 $('review').addEventListener('change',()=>{$('photo').disabled=!ready||!$('review').checked;$('full').disabled=!ready||!$('review').checked;});
 for(const angle of ['front','side','back'])$(angle).addEventListener('click',()=>{app[angle]();update();});
 $('threequarter').addEventListener('click',()=>{app.rotate(30);update();});
 $('pose').addEventListener('change',()=>{app.setPose($('pose').value);update();});
 $('neutral').addEventListener('click',()=>{stopArms();if(!ready)return;app.applyOutfit('pants');status('Original neutral anatomical research pants. No photographed cloth applied.');update();});
 $('photo').addEventListener('click',e=>{stopArms();if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('pants',null,{pantsCandidate:pants,pantsReviewed:true});status('Original denim front pixels on 3D pant mesh · unphotographed neutral back · HOLD');update();});
 $('full').addEventListener('click',e=>{stopArms();if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('shirt-pants',shirt,{reviewed:true,pantsCandidate:pants,pantsReviewed:true});status('Original AJ shirt plus original denim pixels on separate 3D pants · HOLD');update();});
 window.cc31Diagnostics=()=>app.getState();
 window.ccShirtFlow01=stage=>{
  if(!ready||closed||!flowEnabled()||!shirt||shirt.id!==SHIRT_FLOW01.approvedSourceId)
   throw Error('Verified original photographed shirt arm flow feature is disabled');
  const before=assertVerifiedShirtPose01(app.getState(),shirt.sourceSHA256);
  const pose=armPoseAt01(stage);
  app.setPose(pose);update();const after=assertVerifiedShirtPose01(app.getState(),shirt.sourceSHA256);
  const detail=app.getState().outfit.shirt;
  if(detail.poseConditionedSleeveDrape.pose!==pose||detail.poseTriangleContact.after.count!==0)
   throw Error('Original photographed shirt pose is not collision-verified');
  return {...before,...after,pose,stage,
   photographicSourceSHA256:shirt.sourceSHA256,originalBodyBones:163,
   bothArmFabricSides:detail.poseConditionedSleeveDrape.sides,
   maxFabricShiftMeters:detail.poseConditionedSleeveDrape.maximum,
   trueSkinnedGarmentContactCount:detail.poseTriangleContact.after.count,
   fullSweptClothCertified:false,physicalPhoneVerified:false,releaseAuthorized:false};
 };
 window.ccShirtFlowPlay01=()=>{
  if(!ready||closed||!flowEnabled())throw Error('Photo shirt flow not authorized');
  assertVerifiedShirtPose01(app.getState(),shirt?.sourceSHA256);
  stopArms();armCycle=createArmPoseCycle01();
  // Research keyframe preview; not a claim of seamless cloth physics.
  const stages=[0,.25,.5,.75,1];let i=0;
  armTimer=setInterval(()=>{try{window.ccShirtFlow01(stages[i++%stages.length]);}
   catch(e){stopArms();console.error(e);}},350);
  return {fiveOriginalSourcePoses:true,intervalMs:350,
   continuousClothPhysicsCertified:false,releaseAuthorized:false};
 };
 window.ccShirtFlowStop01=()=>{stopArms();return {stopped:true,releaseAuthorized:false};};
 for(const [id,stage] of [['arm-source',0],['arm-quarter',.25],['arm-half',.5],['arm-threequarter',.75],['arm-relaxed',1]])
  $(id)?.addEventListener('click',()=>window.ccShirtFlow01(stage));
 $('arm-play')?.addEventListener('click',()=>window.ccShirtFlowPlay01());
  $('arm-stop')?.addEventListener('click',()=>window.ccShirtFlowStop01());
 window.ccShirtFlow02=fraction=>{
  if(!ready||closed||!flowEnabled()||new URLSearchParams(location.search).get('smoothFlow')!=='after')
   throw Error('17-stage original-photo arm interpolation is not authorized');
  if(typeof fraction!=='number'||!Number.isFinite(fraction)||fraction<0||fraction>1||Math.abs(fraction*16-Math.round(fraction*16))>1e-9)
   throw Error('Unreviewed arm position: only 17 bounded phases are authorized');
  assertVerifiedShirtPose01(app.getState(),shirt?.sourceSHA256);
  app.setPose(fraction);
  const result=assertVerifiedShirtPose01(app.getState(),shirt.sourceSHA256);
  const detail=app.getState().outfit.shirt;
  if(detail.poseConditionedSleeveDrape.pose!==fraction||detail.poseTriangleContact.after.count!==0)
   throw Error('Continuous-phase garment and real-body triangles were not verified');
  update();
  return {...result,phase:fraction,pose:fraction,originalBodyBones:163,
   photographicSourceSHA256:shirt.sourceSHA256,
   bothArmFabricSides:detail.poseConditionedSleeveDrape.sides,
   maxFabricShiftMeters:detail.poseConditionedSleeveDrape.maximum,
   trueSkinnedGarmentContactCount:detail.poseTriangleContact.after.count,
   sampledPoseCount:17,sweptCollisionCertified:false,fullClothPhysicsCertified:false,releaseAuthorized:false};
 };
 window.ccShirtFlow03=fraction=>{
  const result=window.ccShirtFlow02(fraction),detail=app.getState().outfit.shirt;
  if(!flowEnabled()||new URLSearchParams(location.search).get('fabricFlow')!=='after'||!detail?.gravitationalFabricResponse?.gravityResponsive||detail.poseTriangleContact.after.count!==0)
   throw Error('Gravitational original-photo sleeve fabric was not collision certified');
  return {...result,gravityResponse:detail.gravitationalFabricResponse};
 };
 window.ccShirtFlow04=fraction=>{
  const result=window.ccShirtFlow03(fraction),shirtState=app.getState().outfit.shirt;
  const torso=shirtState?.sourceTorsoDrape04;
  if(!flowEnabled()||new URLSearchParams(location.search).get('torsoFlow')!=='after'||!torso?.realPoseResponse||shirtState.poseTriangleContact.after.count!==0)
   throw Error('Source-photographed shoulder torso relief not independently collision verified');
  return {...result,sourceTorsoDrape04:torso};
 };
 window.ccShirtFlow05=fraction=>{
  const result=window.ccShirtFlow04(fraction),shirtState=app.getState().outfit.shirt;
  const temporal=shirtState?.temporalPhotoDrape05;
  if(!flowEnabled()||new URLSearchParams(location.search).get('timeFlow')!=='after'||!temporal||!temporal.photoAndSkinPreserved||shirtState.poseTriangleContact.after.count!==0)
   throw Error('Original photograph temporal settling was not real skinned BVH verified');
  return {...result,temporalPhotoDrape05:temporal};
 };
 window.ccShirtFlow06=fraction=>{
  const result=window.ccShirtFlow05(fraction),detail=app.getState().outfit.shirt;
  const optical=detail?.sourceClothLight06;
  if(!flowEnabled()||new URLSearchParams(location.search).get('lightFlow')!=='after'||
    !optical?.boundedMatteSurfaceResponse||!optical.originalPhotoAndSkinUnmodified||
    detail.poseTriangleContact.after.count!==0)throw Error('True original photographed material response not source/contact verified');
  return {...result,sourceClothLight06:optical};
 };
 window.ccShirtFlow07=fraction=>{
  const result=window.ccShirtFlow06(fraction),detail=app.getState().outfit.shirt;
  const folds=detail?.sourceWeightedFolds07;
  if(!flowEnabled()||new URLSearchParams(location.search).get('foldFlow')!=='after'||!folds?.realPhotographedSourceTriangleFolds||
    !folds.originalSourcePanelUVAndSkinPreserved||detail.poseTriangleContact.after.count!==0)
    throw Error('Source photographed real 3D fabric folds not independently BVH approved');
  return {...result,sourceWeightedFolds07:folds};
 };
 window.ccShirtFlow08=fraction=>{
  const result=window.ccShirtFlow07(fraction),detail=app.getState().outfit.shirt;
  const hem=detail?.sourceHemSwing08;
  if(!flowEnabled()||new URLSearchParams(location.search).get('hemFlow')!=='after'||
    !hem?.realOriginalSourcePhotographedHemSwing||!hem.originalSourcePhotoUVAndSkinPreserved||
    detail.poseTriangleContact.after.count!==0)
    throw Error('Original true skinned shirt weighted hem not source or BVH verified');
  return {...result,sourceHemSwing08:{...hem,bodyContactCountVerifiedAfterFit:true}};
 };
 window.ccShirtFlowPlay02=()=>{
  if(!ready||closed||!flowEnabled()||new URLSearchParams(location.search).get('smoothFlow')!=='after')
   throw Error('Smooth preview not authorized');
  assertVerifiedShirtPose01(app.getState(),shirt?.sourceSHA256);
  stopArms();let index=0;armTimer=setInterval(()=>{
   if(document.hidden){stopArms();return;}
   try{(new URLSearchParams(location.search).get('fabricFlow')==='after'?window.ccShirtFlow08:window.ccShirtFlow02)((index++%17)/16);}
   catch(e){stopArms();status('Arm preview stopped: '+e.message);}
  },100);
  return {sampledPoseCount:17,continuousFabricPhysicsCertified:false,releaseAuthorized:false};
 };
 $('arm-smooth-play')?.addEventListener('click',()=>window.ccShirtFlowPlay02());
 $('arm-smooth-stop')?.addEventListener('click',()=>{stopArms();});
 $('arm-progress')?.addEventListener('input',e=>{
  if(!e.isTrusted)return;stopArms();
  try{window.ccShirtFlow02(Number(e.target.value)/16);}
  catch(error){status('Arm motion blocked: '+error.message);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopArms();});
 if(new URLSearchParams(location.search).has('fit59'))window.cc59InspectTorso=(angle)=>{
  if(!ready||app.getState().outfit.mode!=='shirt-pants')throw Error('Original reviewed genuine photo shirt + denim required');
  app.inspectTorso(angle);update();return app.getState();
 };
 if(new URLSearchParams(location.search).has('move56'))window.cc56InspectSleeves=(angle)=>{
  if(!ready||app.getState().outfit.mode!=='shirt-pants')throw Error('Reviewed real original outfit required');
  app.inspectSleeves(angle);update();return app.getState();
 };
 // Localhost, explicit research opt-in only. The source-photo review gate
 // and actual original garment/rig loading must already be completed.
 if(new URLSearchParams(location.search).get('sweep')==='after')window.cc43SetPose=(pose)=>{
  if(!ready||!['source','blend-25','blend-50','blend-75','relaxed'].includes(pose))throw Error('Original licensed outfit or approved research pose unavailable');
  const state=app.getState();if(state.outfit?.mode!=='shirt-pants'||!state.outfit?.shirt?.poseTriangleContact)throw Error('Original reviewed shirt/jeans with independent pose solver required');
  app.setPose(pose);update();return app.getState();
 };
window.addEventListener('pagehide',()=>{closed=true;stopArms();app.stop();urls.forEach(u=>URL.revokeObjectURL(u));});
}
start().catch(e=>{status('Provisional image preview blocked: '+e.message);$('review').disabled=true;$('photo').disabled=true;$('full').disabled=true;console.error(e);});
