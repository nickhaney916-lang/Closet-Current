/**
 * MAIN1054 M39 — trusted native ownerScope adapter for the isolated M38
 * original-photo/2D-only viewer gate. NO 3D or display authorization.
 *
 * A lexical original application caller supplies its currently signed auth
 * object, private DB object, capture-operation epoch and owner-lease checker.
 * The adapter never discovers accounts from window globals, accepts public
 * owner claims, saves a wardrobe/outfit, logs original photos or returns an
 * approved WebGL capability. All private records stay inside preflight.
 */
const fail=why=>{throw Error('MAIN39 '+why);};
const okId=x=>typeof x==='string'&&x.length>0&&x.length<=128&&
 x.trim()===x&&!x.includes('/');
const validRevision=x=>Number.isSafeInteger(x)&&x>=0;

export function createTrustedNativeOwnerScope39({
  consumer,authRef,privateDbRef,
  getActualOperationEpoch,readActualOwnerItems,
  assertOwnerLive
}={}){
 if(typeof assertOwnerLive!=='function'||
    typeof getActualOperationEpoch!=='function'||
    typeof readActualOwnerItems!=='function'||
    !authRef||typeof authRef.assertCurrent!=='function'||
    !privateDbRef||typeof privateDbRef.name!=='string'||
    !consumer||typeof consumer.readOnlyWardrobeRevision93!=='function'||
    typeof consumer.readOnlySnapshot!=='function'||
    typeof consumer.view!=='function')
   fail('trusted-original-owner-dependencies-required');

 // Pin original object identity and capture epoch when the authenticated
 // app mounts the actual native controller. A same-ID logout/re-login cannot
 // revive this particular adapter.
 const capturedEpoch=getActualOperationEpoch();
 const capturedOwner=authRef.user?.id;
 if(!validRevision(capturedEpoch)||!okId(capturedOwner)||
    privateDbRef.name!=='closet-current-user-'+capturedOwner)
   fail('initial-original-session-invalid');

 function live(){
  assertOwnerLive();
  authRef.assertCurrent();
  if(authRef.user?.id!==capturedOwner||
     getActualOperationEpoch()!==capturedEpoch||
     privateDbRef.name!=='closet-current-user-'+capturedOwner||
     consumer.status?.().active!==true||consumer.status().dirty===true)
   fail('owner-session-or-private-draft-changed');
  const index=consumer.selected;
  const saved=consumer.readOnlySnapshot()?.saved;
  if(!Array.isArray(saved)||!Number.isInteger(index)||
     index<0||index>=saved.length||
     saved[index]?.ownerId!==undefined&&saved[index].ownerId!==capturedOwner)
   fail('selected-saved-outfit-not-current');
  return {ownerId:capturedOwner,authenticated:true,epoch:capturedEpoch,
   operationEpoch:capturedEpoch,authRef,privateDbRef,
   privateDbName:privateDbRef.name};
 }
 // M34 expects a content/version string stable across its async source reads.
 // The entire-roster byte-exact SHA/transaction check is the authoritative
 // cross-tab consistency guard; this version includes the native controller's
 // monotonic source refresh number and exact signed-session generation.
 function version(){
  live();
  const x=consumer.readOnlyWardrobeRevision93();
  if(x?.ownerId!==capturedOwner||!validRevision(x.generation)||
     !validRevision(x.revision)||x.revision<1)
   fail('native-owner-wardrobe-revision-unavailable');
  return 'm39-'+capturedEpoch+'-'+x.generation+'-'+x.revision;
 }
 const getSession=()=>Object.freeze(live());
 const getRevision=()=>version();
 const getBoard=()=>{
  live();
  const candidate=consumer.view();
  if(!candidate||typeof candidate!=='object'||!candidate.slots||
    typeof candidate.slots!=='object'||Array.isArray(candidate.slots)||
    Object.keys(candidate.slots).length===0)
   fail('native-owner-board-missing');
  return candidate;
 };
 const readOwnerItems=async proof=>{
  const before=live(),revision=version();
  if(!proof||typeof proof.assertCurrent!=='function'||
     proof.ownerId!==capturedOwner||proof.authRef!==authRef||
     proof.privateDbRef!==privateDbRef||proof.privateDbName!==privateDbRef.name)
   fail('untrusted-roster-read-proof');
  proof.assertCurrent();
  const rows=await readActualOwnerItems(proof);
  proof.assertCurrent();
  const after=live();
  if(after.ownerId!==before.ownerId||
     version()!==revision||!Array.isArray(rows)||
     rows.some(row=>row?.ownerId!==capturedOwner))
   fail('owner-revision-or-private-rows-changed');
  return rows; // M34 only, NEVER exposed to public UI or viewer verdict.
 };
 return Object.freeze({getSession,getRevision,getBoard,readOwnerItems});
}
