// Independent OFFLINE preflight. No HTTP requests, scraping, prices refreshed,
// live-availability claims, or changes to customer recommendations occur here.
import fs from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const sandbox={URL};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../public/outfit-matcher.js',import.meta.url),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(new URL('../public/taxonomy.js',import.meta.url),'utf8')+'\nglobalThis.types=clothingSchema.types;',sandbox);
const day=86400000,audiences=new Set(['All','Women','Men']);
const slots={top:['Tops','Dresses'],bottom:['Bottoms'],layer:['Tops','Outerwear'],shoes:['Shoes'],bag:['Accessories'],accessory:['Accessories'],finish:['Accessories']};
const accessories={bag:['Bag'],accessory:['Jewelry','Sunglasses'],finish:['Belt','Scarf','Hat']};
const typeCategory=type=>type==='Kitten heel pumps'?'Shoes':Object.entries(sandbox.types).find(([,v])=>type!=='Other'&&v.includes(type))?.[0];
export function canonicalTrendLink(value){
 const safe=sandbox.safeInspirationUrl(value);if(!safe||!safe.startsWith('https:'))return '';
 const u=new URL(safe);u.hash='';u.hostname=u.hostname.replace(/^www\./,'');
 for(const key of [...u.searchParams.keys()])if(/^utm_/i.test(key)||/^(?:fbclid|gclid)$/i.test(key))u.searchParams.delete(key);
 u.searchParams.sort();return u.href;
}
function timestamp(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return NaN;
 const [year,month,date]=value.slice(0,10).split('-').map(Number),calendar=new Date(Date.UTC(year,month-1,date));
 if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==date)return NaN;
 return Date.parse(value);
}
// Observations are explicitly SYNTHETIC evidence. A 200 response alone cannot
// prove product identity, stock, a current price, a real article or no soft 404.
export function assessSyntheticLinkObservation(url,observation,{now}={}){
 const time=timestamp(now);if(!Number.isFinite(time))throw Error('Explicit ISO audit time required');
 const first=canonicalTrendLink(url);if(!first)return 'unsafe-url';
 if(!observation)return 'unverified';
 const checked=timestamp(observation.checked_at);
 if(!Number.isFinite(checked)||checked>time||time-checked>day)return 'invalid-or-stale-observation';
 if(['offline','timeout','network-error'].includes(observation.error))return observation.error;
 if(!Array.isArray(observation.chain)||!observation.chain.length||observation.chain.length>4)return 'invalid-chain';
 let expected=first;const seen=new Set();
 for(let i=0;i<observation.chain.length;i++){
  const step=observation.chain[i],current=canonicalTrendLink(step?.url);
  if(!current||current!==expected||seen.has(current))return 'unsafe-or-mismatched-redirect';seen.add(current);
  if([301,302,303,307,308].includes(step.status)){
   if(typeof step.location!=='string'||!step.location.trim())return 'unsafe-or-mismatched-redirect';
   let destination;try{destination=new URL(step.location,step.url).href;}catch{return 'unsafe-or-mismatched-redirect';}
   const next=canonicalTrendLink(destination);
   if(!next||new URL(next).hostname!==new URL(first).hostname)return 'unsafe-or-mismatched-redirect';
   if(i===observation.chain.length-1)return 'incomplete-redirect';expected=next;
  }else{
   if(i!==observation.chain.length-1)return 'invalid-chain';
   if(step.status!==200)return 'http-'+(Number.isInteger(step.status)?step.status:'invalid');
   if(!/^text\/html(?:;|$)/i.test(step.content_type||''))return 'unexpected-content-type';
   return 'synthetic-pass';
  }
 }
 return 'invalid-chain';
}
export function auditTrendLibrary(value,{now,observations={}}={}){
 const time=timestamp(now);if(!Number.isFinite(time))throw Error('Explicit ISO audit time required');
 if(!observations||typeof observations!=='object'||Array.isArray(observations))throw Error('Invalid synthetic observations');
 const issues=[],add=(path,code,severity='error')=>issues.push({path,code,severity});
 const fresh=(date,path,maxAge=7*day)=>{const t=timestamp(date);if(!Number.isFinite(t)){add(path,'missing-or-invalid-timestamp');return false;}if(t>time){add(path,'future-timestamp');return false;}if(time-t>maxAge){add(path,'stale');return false;}return true;};
 const rows=(key,max)=>{if(!Array.isArray(value?.[key])){add(key,'invalid-array');return [];}if(value[key].length>max)add(key,'too-many-rows');return value[key].slice(0,max);};
 if(value?.schema_version!==1)add('schema_version','unsupported-schema');
 const libraryFresh=fresh(value?.updated_at,'updated_at'),next=timestamp(value?.next_refresh_at),updated=timestamp(value?.updated_at);
 if(!Number.isFinite(next)||next<=updated||next-updated>8*day)add('next_refresh_at','invalid-weekly-refresh-deadline');
 else if(next<=time)add('next_refresh_at','refresh-overdue');
 const sources=rows('sources',30),products=rows('products',100),directions=rows('directions',100),retailers=rows('retailers',50);
 const linked=(row,path)=>{
  const key=canonicalTrendLink(row?.url);if(!key){add(path+'.url','unsafe-url');return '';}
  const observation=Object.hasOwn(observations,key)?observations[key]:undefined;
  const result=assessSyntheticLinkObservation(row.url,observation,{now});
  if(result==='unverified')add(path+'.url','live-link-not-verified','notice');
  else if(result!=='synthetic-pass')add(path+'.url',result);
  return key;
 };
 const goodSources=new Set(),sourceIds=new Map(),sourceURLs=new Set(),sourceHosts=new Set();
 for(const s of sources)if(s&&typeof s.id==='string')sourceIds.set(s.id,(sourceIds.get(s.id)||0)+1);
 sources.forEach((s,i)=>{
  const path='sources['+i+']',key=linked(s,path),checked=fresh(s?.checked_at,path+'.checked_at');
  if(key)sourceHosts.add(new URL(key).hostname);
  const unique=key&&!sourceURLs.has(key);if(key&&!unique)add(path,'duplicate-source-url');if(key)sourceURLs.add(key);
  if(typeof s?.id!=='string'||!s.id||sourceIds.get(s.id)!==1)add(path+'.id','missing-or-duplicate-source-id');
  if(!s?.title||typeof s.title!=='string'||!s?.publication||typeof s.publication!=='string')add(path,'missing-source-label');
  if(!s?.published_at)add(path+'.published_at','publication-date-unknown','notice');
  else {const published=Date.parse(s.published_at);if(!/^\d{4}-\d{2}-\d{2}$/.test(s.published_at)||!Number.isFinite(published)||new Date(published).toISOString().slice(0,10)!==s.published_at||published>time)add(path+'.published_at','invalid-publication-date');}
  if(key&&unique&&checked&&sourceIds.get(s?.id)===1&&!issues.some(x=>x.severity==='error'&&(x.path===path||x.path.startsWith(path+'.'))))goodSources.add(s.id);
 });
 if(sourceHosts.size<2)add('sources','insufficient-publication-host-diversity');
 const productURLs=new Set(),retailerHosts=new Set(),retailerNames=new Set();let usableProducts=0;
 products.forEach((p,i)=>{
  const path='products['+i+']',key=linked(p,path),checked=fresh(p?.checked_at,path+'.checked_at');
  if(key){retailerHosts.add(new URL(key).hostname);if(productURLs.has(key))add(path,'duplicate-product-url');productURLs.add(key);}
  if(!typeCategory(p?.type))add(path+'.type','unknown-garment-type');
  if(!audiences.has(p?.audience))add(path+'.audience','invalid-audience');
  if(p?.available===false)add(path,'unavailable-product');
  if(!p?.name||typeof p.name!=='string'||!p?.retailer||typeof p.retailer!=='string')add(path,'missing-product-label');
  if(p?.price_at_check!==null&&(!Number.isFinite(p?.price_at_check)||p.price_at_check<0))add(path+'.price_at_check','invalid-price');
  if(key&&checked&&!issues.some(x=>x.severity==='error'&&(x.path===path||x.path.startsWith(path+'.'))))usableProducts++;
 });
 const retailerURLs=new Set();retailers.forEach((r,i)=>{
  const path='retailers['+i+']',key=linked(r,path);
  // Do not invent retailer-check evidence by inheriting the payload timestamp.
  fresh(r?.checked_at,path+'.checked_at');
  if(key){if(retailerURLs.has(key))add(path,'duplicate-retailer-url');retailerURLs.add(key);}
  if(typeof r?.name==='string')retailerNames.add(r.name.trim().toLowerCase());else add(path,'missing-retailer-name');
  if(!audiences.has(r?.audience)||!Array.isArray(r?.types)||!r.types.length||r.types.some(t=>!typeCategory(t)))add(path,'invalid-retailer-category');
 });
 const directionIds=new Set();let usableDirections=0;
 directions.forEach((d,i)=>{
  const path='directions['+i+']',category=typeCategory(d?.type);
  if(!d?.id||typeof d.id!=='string'||directionIds.has(d.id))add(path+'.id','missing-or-duplicate-direction-id');else directionIds.add(d.id);
  if(!Object.hasOwn(slots,d?.slot)||!slots[d.slot].includes(category)||Object.hasOwn(accessories,d?.slot)&&!accessories[d.slot].includes(d?.type))add(path,'slot-type-mismatch');
  if(!goodSources.has(d?.source_id))add(path+'.source_id','unverified-or-stale-source');
  if(!Array.isArray(d?.audiences)||!d.audiences.length||d.audiences.some(a=>!audiences.has(a)))add(path+'.audiences','invalid-audience');
  if(!issues.some(x=>x.severity==='error'&&(x.path===path||x.path.startsWith(path+'.'))))usableDirections++;
 });
 return {format:'closet-current-issue238-independent-offline-audit',auditedAt:now,
  structuralPassed:!issues.some(x=>x.severity==='error'),libraryFresh,
  counts:{sources:sources.length,publicationHosts:sourceHosts.size,products:products.length,productHosts:retailerHosts.size,retailerRows:retailers.length,namedRetailers:retailerNames.size,usableProducts,usableDirections},issues,
  liveLinkVerification:false,currentPricesVerified:false,stockVerified:false,sourceContentSemanticallyVerified:false,
  customerDataUsed:false,networkRequests:0,productionPromotionApproved:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,now,output]=process.argv.slice(2);if(!input||!now)throw Error('Usage: node scripts/issue238-independent-trend-gate.mjs LIBRARY_JSON ISO_TIME [OUTPUT_JSON]');
 const report=auditTrendLibrary(JSON.parse(fs.readFileSync(input,'utf8')),{now});
 const json=JSON.stringify(report,null,2)+'\n';if(output)fs.writeFileSync(output,json);else process.stdout.write(json);
 // Audit completion is not source approval. Findings are explicit in the report.
}
