/** 3D-66 physical iPhone research preview origin gate.
 * Never change default production routing. Existing localhost stays allowed.
 * Optional private Tailscale Serve HTTPS host is ONLY for audited original
 * licensed research photos with explicit phone66=after. Tailscale Serve is
 * private-to-tailnet; NEVER publish with Funnel or public staging.
 */
export function assertPrivateResearchOrigin(locationLike){
 const url=new URL(locationLike.href);
 const hostname=url.hostname.toLowerCase();
 const local=['localhost','127.0.0.1','[::1]','::1'].includes(hostname);
 if(local)return {local:true,privatePhoneQA:false,releaseAuthorized:false};
 const privateTailnet=/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+\.ts\.net$/.test(hostname);
 if(url.protocol==='https:'&&privateTailnet&&url.searchParams.get('phone66')==='after'){
  return {local:false,privatePhoneQA:true,releaseAuthorized:false};
 }
 throw Error('Research 3D only on local origin or explicitly enabled private Tailnet HTTPS; no public staging');
}
