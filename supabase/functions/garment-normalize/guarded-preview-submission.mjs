// Private preview submission sequence; unconnected to a deployed endpoint.
// Input original bytes are hashed BEFORE a 1-credit DB reservation, then:
// reserve once -> atomically claim once -> one provider submission -> bind job.
// Even a provider failure cannot permit replay; the claim remains consumed.
// No customer-owned source image, JWT, key or generated image is persisted.
import {validateNormalizeCandidate,planEdit} from './protocol.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function submitGuardedGarmentPreview({
 candidate,owner,consent,requestId,ledger,transportFactory,enabled=false
}={}){
 if(enabled!==true||!ledger||typeof ledger.reserve!=='function'||
    typeof ledger.claim!=='function'||typeof ledger.bind!=='function'||
    typeof transportFactory!=='function'||owner?.verifiedBySupabase!==true||
    !UUID.test(owner?.id||'')||!UUID.test(requestId||''))
  throw Error('Private AI pilot is disabled or not server authenticated');
 const v=validateNormalizeCandidate(candidate);
 if(consent?.verifiedByServer!==true||consent?.granted!==true||
    consent?.purpose!=='external-ai-garment-preview'||
    consent.ownerId!==owner.id||consent.itemId!==v.itemId||
    consent.sourceSha256!==v.photoSha256||
    consent.expiresAt<=Date.now()||consent.expiresAt>Date.now()+15*60*1000)
  throw Error('Explicit, verified photo-sharing consent required');
 // Hash actual uploaded source bytes; do not accept a client-provided digest
 // without this check. This is NOT a garment-fidelity inspection.
 const match=v.garmentImage.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match)throw Error('Invalid source encoding');
 const decoded=Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0));
 if(decoded.length<24||decoded.length>5_500_000)throw Error('Unsafe source size');
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',decoded));
 const sourceSha256=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
 if(sourceSha256!==v.photoSha256)throw Error('Original source image hash mismatch');
 const context={owner,requestId,sourceSha256,category:v.category};
 // ledger client must be created server-side with service-role credentials.
 const reservation=await ledger.reserve(context);
 if(reservation?.approved!==true||reservation.costCredits!==1||
    reservation.durableDbReservation!==true||
    reservation.ownerId!==owner.id||reservation.requestId!==requestId||
    reservation.sourceSha256!==sourceSha256)
  throw Error('No valid pilot credit reservation');
 if(!await ledger.claim({owner,requestId,sourceSha256}))
  throw Error('Pilot credit already used or reservation expired');
 // If submission fails, the reservation is intentionally consumed.
 const transport=transportFactory(reservation);
 if(!transport||typeof transport.submit!=='function')
  throw Error('No server-only image editor configured');
 const job=await transport.submit(planEdit(candidate));
 if(!job||typeof job.jobId!=='string')throw Error('Invalid private provider job');
 if(!await ledger.bind({owner,requestId,jobId:job.jobId}))
  throw Error('Cannot bind provider job to reserved user');
 return {jobId:job.jobId,status:'pending',previewOnly:true,
  originalPhotoPreserved:true,sourceSha256,
  creditsReserved:1,canAutoSave:false,
  garmentIdentityVerified:false,photoUploadedToProvider:true,
  userVisualReviewRequired:true};
}
export const GARMENT_PREVIEW_SUBMISSION_ENABLED=false;
