// Verify only fixed HTTPS Auth callback targets and preserve no-unreviewed-cutover.
// This file never calls Supabase APIs, sends emails or changes live settings.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const LEGACY='https://nickhaney916-lang.github.io/Closet-Current/';
export const CLOUDFLARE='https://closet-current.pages.dev/';
export function inspect(source,{approvedCutover=false}={}){
 const matches=[...source.matchAll(/const APP_URL='([^']+)'/g)];
 assert.equal(matches.length,1,'Exactly one literal APP_URL is required for live audit');
 const target=matches[0][1];
 assert.ok(target===LEGACY||target===CLOUDFLARE,
  'Unexpected or unreviewed Auth email callback destination');
 const parsed=new URL(target);
 assert.equal(parsed.protocol,'https:');
 assert.equal(parsed.username,'');assert.equal(parsed.password,'');
 assert.equal(parsed.search,'');assert.equal(parsed.hash,'');
 assert.ok(source.includes("const EMAIL_REDIRECT='?redirect_to='+encodeURIComponent(APP_URL);"),
  'All email requests must use one fixed, encoded callback destination');
 for(const endpoint of ['signup','recover','resend'])
  assert.ok(source.includes("'"+endpoint+"'+EMAIL_REDIRECT"),
   endpoint+' no longer uses guarded callback path');
 if(target===CLOUDFLARE&&!approvedCutover)
  throw Error('Cloudflare cutover blocked until dashboard redirect allowlist, backups and owner sign-off are verified');
 return {target,sharedOrigin:CLOUDFLARE,
  crossOriginOnSharedSite:target!==CLOUDFLARE,
  cutoverVerified:false,liveSmtpVerified:false,liveInboxVerified:false,
  physicalPhonesVerified:false,productionReleaseApproved:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const raw=await readFile('public/auth.js','utf8');
 const result=inspect(raw);
 console.log('AUTH_CUTOVER_GUARD '+JSON.stringify(result));
}
