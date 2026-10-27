export const isLocalGallery=loc=>loc.protocol==='http:'&&['127.0.0.1','localhost'].includes(loc.hostname);
export function validateGalleryManifest(manifest){
 if(manifest?.release!=='HOLD'||manifest.ownerVisuallyApproved!==false||manifest.diagnosticOnly!==true||manifest.physicalPhoneVerified!==false||manifest.unapprovedImages!==true||!Array.isArray(manifest.rows)||manifest.rows.length!==15)throw Error('Unapproved diagnostic HOLD manifest required');
 const seen=new Set();for(const r of manifest.rows){if(!/^commons-\d{4}$/.test(r.id)||seen.has(r.id)||!['PASS','REVIEW','FAIL'].includes(r.decision)||r.ownerApproved!==false||!r.reason||!/^[a-f0-9]{64}$/.test(r.sourceSHA256)||r.original!=='assets/'+r.id+'.jpg'||r.proposal!==(r.hasProposal?'assets/'+r.id+'.png':null)||(!r.hasProposal||r.priorClippingDecision==='FAIL')&&r.decision==='PASS')throw Error('Invalid, misleading or unbound visual row');seen.add(r.id);}return true;
}
