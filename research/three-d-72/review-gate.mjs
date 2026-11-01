/**
 * Closet Current 3D-72: evidence-only visual review contract.
 * Uses 3D-71 genuine WebGL screenshot manifest. A machine MUST NOT claim
 * that a moving real garment looks believable to a person.
 * No real closet, photographed jeans, production, account or deployment.
 */
export const WIDTHS=Object.freeze([320,390]);
export const KINDS=Object.freeze(['female','male']);
export const ANGLES=Object.freeze([0,45,90,135,180,225,270,315,360]);
export const RATINGS=Object.freeze(['improved','unchanged','worse','unclear']);
const suffix=a=>String(a).padStart(3,'0');
const pairs=()=>WIDTHS.flatMap(width=>KINDS.flatMap(kind=>ANGLES.map(angle=>({
  id:width+'-'+kind+'-'+suffix(angle),width,kind,angle,
  before:width+'-'+kind+'-before-'+suffix(angle)+'.png',
  after:width+'-'+kind+'-after-'+suffix(angle)+'.png'
}))));
export function createReviewManifest(source,verifiedImages){
 if(!source||source.researchOnly!==true||source.genuineWebGLImages!==72||
   source.real163JointSkinnedHumanoids!==true||source.trueCamera360!==true||
   source.humanVisualAcceptance!==false||source.phoneAndroidTested!==false||
   source.phoneIphoneTested!==false||source.releaseAuthorized!==false||
   source.familyAlpha!=='HOLD'||!Array.isArray(source.results)||source.results.length!==4)
  throw Error('3D72 requires original 3D71 no-deploy 72-frame WebGL HOLD evidence');
 if(!(verifiedImages instanceof Map)||verifiedImages.size!==72)
  throw Error('All 72 actual before/after PNG images required');
 const items=pairs();
 const seen=new Set();
 for(const result of source.results){
  const k=result.width+':'+result.kind;
  if(seen.has(k)||!WIDTHS.includes(result.width)||!KINDS.includes(result.kind)||
   result.originalBody163Bones!==true||result.originalCamera360True!==true||
   result.humanAestheticReviewed!==false||result.releaseAuthorized!==false)
   throw Error('Invalid, repeated or non-original 3D71 body evidence '+k);
  seen.add(k);
 }
 if(seen.size!==4)throw Error('Missing anatomical male/female mobile evidence');
 const out=items.map(item=>{
  const before=verifiedImages.get(item.before),after=verifiedImages.get(item.after);
  if(!before||!after||before.width!==after.width||before.height!==after.height||
     before.width<240||before.height<300||before.sha256===after.sha256&&
     ![0,45,90,135,180,225,270,315,360].includes(item.angle))
   throw Error('Missing or invalid matched real 3D72 evidence '+item.id);
  if(!/^[a-f0-9]{64}$/.test(before.sha256)||!/^[a-f0-9]{64}$/.test(after.sha256))
   throw Error('Screenshot evidence digest missing');
  return Object.freeze({...item,pixelWidth:before.width,pixelHeight:before.height,
    sha256Before:before.sha256,sha256After:after.sha256});
 });
 if(new Set(out.map(x=>x.id)).size!==36)throw Error('Repeated visual review viewpoint');
 return Object.freeze({title:'3D72 real CC0 male/female 360 neutral-garment human review',
  source:'3D71 true anatomical WebGL, not licensed photograph on clothing',
  caseCount:36,imageCount:72,widths:WIDTHS,kinds:KINDS,angles:ANGLES,
  comparisons:out,
  visualReviewStatus:'UNREVIEWED',humanAestheticApproved:false,
  realPersonalPhotoTo3DProven:false,photographedDenimImproved:false,
  authenticAndroidPhoneVerified:false,authenticIphoneVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false});
}
/** Explicit scores cannot change release state or conflate pixel delta and looks. */
export function evaluateHumanReview(manifest,ratings,reviewer=''){
 if(manifest?.caseCount!==36||manifest.comparisons?.length!==36||
    !Array.isArray(ratings))throw Error('Original 36 evidence pairs required');
 const known=new Set(manifest.comparisons.map(p=>p.id)),submitted=new Map();
 for(const r of ratings){
  if(!known.has(r?.id)||submitted.has(r.id)||!RATINGS.includes(r.rating)||
     typeof r.note!=='string'||r.note.length>2000)
   throw Error('Untrusted human view rating or duplicate');
  submitted.set(r.id,{id:r.id,rating:r.rating,note:r.note});
 }
 const complete=submitted.size===36&&String(reviewer).trim().length>=2;
 const totals=Object.fromEntries(RATINGS.map(v=>[v,[...submitted.values()].filter(x=>x.rating===v).length]));
 return Object.freeze({reviewer:String(reviewer).slice(0,100),
  status:complete?'SUBMITTED_FOR_MAIN_THREAD_REVIEW':'INCOMPLETE_HUMAN_REVIEW',
  rated:submitted.size,total:36,totals,ratings:[...submitted.values()],
  sourcePhotoIndexValidated:false,originalClothingFittedOnHumanoid:false,
  humanPhotorealismApproved:false,physicalAndroidVerified:false,
  physicalIphoneVerified:false,familyAlpha:'HOLD',releaseAuthorized:false});
}
