// Deterministic offline inventory. No fetch, credentials, writes or hosting calls.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {checkStagingArtifactIntegrity} from './check-staging-artifact-integrity.mjs';
import {verifyStagingAssetSeal,SEAL_FILE} from './staging-asset-seal.mjs';
import {SUPPORT_PAGES} from './staging-support-navigation.mjs';
export async function auditStagingSupportRoutes(dir){
 const integrity=await checkStagingArtifactIntegrity(dir),seal=await verifyStagingAssetSeal(dir);
 const get=name=>readFile(resolve(dir,name),'utf8');
 const proof=JSON.parse(await get('staging-preflight.json'));
 assert.equal(proof.backendProjectRef,'fbnplztkbsteuzrmbgib','Wrong staging project');
 assert.equal(proof.stagingOrigin,'https://pilot-access-check.closet-current-staging.pages.dev/','Wrong staging alias');
 assert.equal(proof.paidAIHardBlocked,true);assert.equal(proof.productionReleaseApproved,false);
 const manifest=JSON.parse(await get(SEAL_FILE)),paths=new Set(manifest.files.map(x=>x.path));
 const required=['index.html',...SUPPORT_PAGES];
 for(const path of required)assert.ok(paths.has(path),'Missing root standalone page: '+path);
 const links=[];
 const resolveTarget=pathname=>{
  const raw=decodeURIComponent(pathname).replace(/^\//,'');
  return !raw?'index.html':paths.has(raw)?raw:paths.has(raw+'.html')?raw+'.html':raw.endsWith('/')&&paths.has(raw+'index.html')?raw+'index.html':null;
 };
 for(const entry of manifest.files.filter(x=>x.path.endsWith('.html'))){
  const html=await get(entry.path),page=new URL(entry.path,proof.stagingOrigin);
  assert.ok(!/<base\b/i.test(html),'Unexpected HTML base override');
  for(const tag of html.match(/<[a-z][^>]*>/gi)||[]){
   for(const match of tag.matchAll(/\b(?:href|src|poster)\s*=\s*(["'])(.*?)\1/gi)){
    const raw=match[2].replaceAll('&amp;','&');
    if(!raw||raw.startsWith('#'))continue;
    const target=new URL(raw,page);
    if(target.origin!==page.origin)continue;
    const path=resolveTarget(target.pathname);
    assert.ok(path,'Broken or wrong-case link in '+entry.path+': '+target.pathname);
    const v=target.searchParams.get('v');
    if(v!==null)assert.equal(v,proof.bundleFingerprint,'Stale versioned link in '+entry.path);
    links.push({from:entry.path,target:target.pathname+target.search,resolvesTo:path});
   }
  }
 }
 const index=await get('index.html');
 for(const path of SUPPORT_PAGES)assert.ok(links.some(x=>x.from==='index.html'&&x.resolvesTo===path),'Missing app support link: '+path);
 for(const page of SUPPORT_PAGES)assert.ok(links.some(x=>x.from===page&&x.resolvesTo==='index.html'),'Missing return link: '+page);
 const ai=await get('ai-tryon.js');
 assert.ok(ai.includes("throw Error('Paid AI is disabled for the restricted staging pilot.')"));
 for(const [file,marker] of [['auth.js',"const URL='https://fbnplztkbsteuzrmbgib.supabase.co'"],['cloud-backup.js',"BASE='https://fbnplztkbsteuzrmbgib.supabase.co'"]])
  assert.ok((await get(file)).includes(marker),'Incorrect staging runtime endpoint');
 return {format:'closet-current-staging-support-route-audit',version:1,
  bundleFingerprint:proof.bundleFingerprint,backendProjectRef:proof.backendProjectRef,stagingOrigin:proof.stagingOrigin,
  sealSha256:createHash('sha256').update(await get(SEAL_FILE)).digest('hex'),
  rootIndexPresent:true,requiredPages:manifest.files.filter(x=>required.includes(x.path)),
  htmlPages:manifest.files.filter(x=>x.path.endsWith('.html')).map(x=>x.path),
  links:links.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en')),
  integrity,seal,paidAIHardBlocked:true,hostedRoutesVerified:false,deployAuthorized:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(await auditStagingSupportRoutes(process.argv[2]||'staging-dist'),null,2));}
 catch{console.error('STAGING_SUPPORT_ROUTE_AUDIT_FAILED: inspect the sealed local bundle; no upload authorized.');process.exitCode=1;}
}
