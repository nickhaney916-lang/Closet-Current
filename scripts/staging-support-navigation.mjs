// Output-only compatibility with Pages' .html -> extensionless redirects.
// Never modifies customer source, changes Access or follows a network redirect.
import assert from 'node:assert/strict';
export const SUPPORT_PAGES=['pilot-data-notice.html','saved-closet-audit.html','phone-photo-check.html'];
function once(source,oldValue,replacement){
 assert.equal(source.split(oldValue).length-1,1,'Unexpected staging worker source layout');
 return source.replace(oldValue,replacement);
}
export function stagingSupportLinks(source){
 return source.replace(/<a\b[^>]*>/g,tag=>{
  const href=tag.match(/\bhref="([^"]+)"/)?.[1];
  return SUPPORT_PAGES.includes(href)?tag.replace(/\s+target="_blank"/,''):tag;
 });
}
export function stagingNavigationWorker(source){
 let result=once(source,'const home=',`// Only HTML paths already in this immutable release acquire clean aliases.
const stagingPageAliases=new Map();
for(const href of urls){
 const html=new URL(href);
 if(!html.pathname.endsWith('.html'))continue;
 const canonical=new URL(href);
 canonical.pathname=canonical.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'');
 stagingPageAliases.set(html.href,html.href);
 stagingPageAliases.set(canonical.href,html.href);
}
const home=`);
 result=once(result,'if(!isHome&&!allowed.has(url.href))return;',
  'if(!isHome&&!allowed.has(url.href)&&!stagingPageAliases.has(url.href))return;');
 result=once(result,'cache.match(isHome?index:event.request)',
  'cache.match(isHome?index:stagingPageAliases.get(url.href)||event.request)');
 return once(result,'if(saved)return saved;',`if(saved){
    if(!saved.redirected)return saved;
    // Access login/cross-origin/unexpected redirects must NOT become app HTML.
    const pageKey=isHome?index:stagingPageAliases.get(url.href);
    if(!pageKey)throw Error('Unexpected redirected release asset');
    const canonical=new URL(pageKey);
    canonical.pathname=canonical.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'');
    if(saved.type!=='basic'||saved.status!==200||saved.url!==canonical.href||
      !/^text\\/html(?:;|$)/i.test(saved.headers.get('Content-Type')||''))
     throw Error('Unexpected redirected release page');
    // Navigation requests use redirect=manual. Return the exact cached body,
    // status and headers in a fresh Response without its redirect URL history.
    return new Response(saved.body,{status:saved.status,statusText:saved.statusText,headers:saved.headers});
   }`);
}
