/** 3D66 real-device QA research-origin policy.
 * Local Android ADB reverse uses loopback HTTP. An actual iPhone Safari
 * requires an explicitly human-approved, privately provisioned HTTPS
 * research origin, entered on this isolated research branch only.
 * No HTTPS origin is approved by default. Never infer approval from a
 * user-controlled query parameter, subdomain wildcard, or UA.
 */
export const approvedPrivateIosOrigins=Object.freeze([]);
export function allowedResearchPhoneOrigin({protocol,hostname,origin},approved=approvedPrivateIosOrigins){
 const host=String(hostname||'').toLowerCase();
 const exact=String(origin||'');
 const local=protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(host);
 const privateHttps=protocol==='https:'&&Array.isArray(approved)&&approved.some(a=>
  typeof a==='string'&&a===exact&&a.startsWith('https://')&&!a.includes('*')
 );
 return local||privateHttps;
}
