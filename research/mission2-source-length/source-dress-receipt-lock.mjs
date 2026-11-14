/**
 * Mission 2 P2-C47 — small research-only single-use source-contact receipt
 * registry. No THREE, MeshBVH or browser side effects are needed to load the
 * ordinary optional source dress motion module.
 *
 * Registration is used ONLY by the real C46 geometry scanner. This is a
 * fail-closed consistency/lease control inside a trusted JS codebase, not a
 * security boundary against an attacker already executing arbitrary modules.
 */
const receipts=new WeakMap();
const fail=m=>{throw Error('M2 C47 source contact receipt '+m);};
const finitePositions=a=>
 (a instanceof Float32Array||a instanceof Float64Array)&&
 a.length>=3&&a.length%3===0&&a.every(Number.isFinite);
const same=(a,b)=>a.length===b.length&&a.every((value,i)=>value===b[i]);

export function registerSourceDressTemporalReceipt46({
 receipt,root,mesh,startPositions,endPositions
}={}){
 if(!receipt||typeof receipt!=='object'||!Object.isFrozen(receipt)||
    receipts.has(receipt)||receipt.schema!=='M2-source-dress-temporal-self-contact-v1'||
    !root?.isObject3D||!mesh?.isSkinnedMesh||
    !finitePositions(startPositions)||!finitePositions(endPositions)||
    startPositions.length!==endPositions.length)
  fail('C46 private original-source receipt registration requires full source data');
 receipts.set(receipt,{root,mesh,startPositions:startPositions.slice(),
  endPositions:endPositions.slice(),usedForMotion:false});
}

export function isAuthenticSourceDressTemporalReceipt46(receipt){
 return receipt!==null&&typeof receipt==='object'&&receipts.has(receipt);
}

/**
 * Bind the real geometry-audited source receipt to exactly the garment and
 * staged source XYZ for one research motion commit, not to caller-supplied
 * JSON flags. Never infer sewn-seam identity, unsampled-time safety or release.
 */
export function requireSourceDressTemporalReceipt47({
 receipt,root,dress,startPositions,endPositions
}={}){
 const source=isAuthenticSourceDressTemporalReceipt46(receipt)?
  receipts.get(receipt):null;
 if(!source||source.usedForMotion||source.root!==root||
    source.mesh!==dress?.mesh||
    !finitePositions(startPositions)||!finitePositions(endPositions)||
    !same(source.startPositions,startPositions)||
    !same(source.endPositions,endPositions))
  fail('C47 missing, reused or mismatched authentic garment/contact lease');
 // The research motion gate also checks every C46 result field. This local
 // assertion protects independent users of the lease against an incomplete
 // or contact-bearing genuine source receipt.
 if(receipt.originalSourceAndSkinVerified!==true||
    receipt.independentSkinnedClothPoseGrid!==true||
    receipt.completeUniformPoseGrid!==true||
    (receipt.poseSamples!==17&&receipt.poseSamples!==33)||
    receipt.posesChecked!==receipt.poseSamples||
    receipt.fullSequenceAudited!==true||
    receipt.stoppedAtFirstUnresolvedContact!==false||
    receipt.unresolvedContacts!==0||
    receipt.firstUnresolvedSampleIndex!==null||
    receipt.unresolvedKind!==null||
    !Number.isSafeInteger(receipt.originalSourceFaces)||
    receipt.originalSourceFaces<1||
    receipt.checkedOriginalFaces!==receipt.poseSamples*receipt.originalSourceFaces||
    !Number.isSafeInteger(receipt.sampledClothMoveIntervals)||
    receipt.sampledClothMoveIntervals<1||
    receipt.sampledClothMoveIntervals>=receipt.poseSamples||
    !Number.isFinite(receipt.maxObservedVertexStepMeters)||
    !Number.isFinite(receipt.maxAllowedVertexStepMeters)||
    receipt.maxObservedVertexStepMeters<0||
    receipt.maxAllowedVertexStepMeters<=0||
    receipt.maxAllowedVertexStepMeters>.1||
    receipt.maxObservedVertexStepMeters>receipt.maxAllowedVertexStepMeters+1e-7||
    receipt.disconnectedSeamsRemainUnresolved!==true||
    receipt.noOriginalPhotographOrSkinChanges!==true||
    receipt.actualContinuousSelfContactCertified!==false||
    receipt.inferredRearHumanVerified!==false||
    receipt.realClothPhysics!==false||
    receipt.releaseAuthorized!==false||
    receipt.familyAlpha!=='HOLD')
  fail('C47 partial or unsafe original-source cloth clearance refused');
 source.usedForMotion=true;
 return Object.freeze({
  sourceBoundSingleUseReceipt:true,researchOnly:true,
  continuousSelfContactNotCertified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
