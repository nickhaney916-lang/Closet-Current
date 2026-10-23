/**
 * Issue #238 OFFLINE research-only trend quality gate.
 * Not loaded by the customer app. Never fetches or crawls sites.
 * The caller supplies dates, fixture documents and optional synthetic probe.
 */
const DAY=86_400_000;
const SLOT_TYPES=Object.freeze({
 top:['T-shirt','Polo','Sweater','Button-down shirt','Blouse','Hoodie','Tank top','Tunic','Casual dress','Shirt dress','Formal dress','Sweatshirt'],
 bottom:['Trousers','Jeans','Shorts','Skirt','Joggers','Leggings'],
 layer:['Jacket','Coat','Sweater','Cardigan','Blazer','Vest','Raincoat','Hoodie','Sweatshirt','Button-down shirt'],
 shoes:['Sneakers','Loafers','Flats','Sandals','Ankle boots','Boots','Heels','Kitten heel pumps'],
 bag:['Bag','Backpack','Tote'],
 accessory:['Jewelry','Sunglasses'],
 finish:['Scarf','Belt','Hat']
});
const allTypes=new Set(Object.values(SLOT_TYPES).flat());
const badRedirectFields=new Set(['url','redirect','redirect_url','redirect_uri','return','returnurl','return_url','next','continue','dest','destination','target','goto','to','out','u']);
const safeText=(v,n=200)=>String(typeof v==='string'?v:'').trim().slice(0,n);
const iso=(v,now,{allowFuture=false,required=true}={})=>{
 if(!v){if(required)throw Error('Missing verification timestamp');return null;}
 if(typeof v!=='string'||!/(?:Z|[+-]\d\d:\d\d)$/.test(v))throw Error('Verification timestamp must include timezone');
 const ms=Date.parse(v);
 if(!Number.isFinite(ms)||ms<0||(!allowFuture&&ms>now+DAY))throw Error('Invalid verification timestamp');
 return new Date(ms).toISOString();
};
export function safeExternalLink(raw){
 if(typeof raw!=='string'||!raw.trim()||raw.length>4096)return null;
 let url;
 try{url=new URL(raw);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||!(url.port===''||url.port==='443'))return null;
 const hostname=url.hostname.toLowerCase().replace(/\.$/,'');
 if(!hostname.includes('.')||hostname.endsWith('.localhost')||hostname.endsWith('.local')||hostname.endsWith('.internal')||hostname.endsWith('.test')||hostname.endsWith('.invalid')||hostname.endsWith('.example')||
    hostname==='localhost'||hostname.startsWith('[')||/^\d+\.\d+\.\d+\.\d+$/.test(hostname)||/^[\d.]+$/.test(hostname)||/[^\x00-\x7f]/.test(hostname))return null;
 // An apparently safe outer URL must not smuggle an unsafe redirect target.
 for(const [key,value] of url.searchParams){
  if(!badRedirectFields.has(key.toLowerCase()))continue;
  if(!value)continue;
  // Any redirect parameter has unknown server behavior; disallow it rather
  // than trying to predict single/double URL decoding or destination safety.
  return null;
 }
 url.hash='';
 return url.href;
}
export function typeFitsSlot(type,slot){return Boolean(SLOT_TYPES[slot]?.includes(type));}
export function normalizeQualityLibrary(payload,{now=Date.now(),maxAgeDays=8,minPublicationSites=2}={}){
 if(!payload||payload.schema_version!==1||!Array.isArray(payload.sources)||!Array.isArray(payload.products)||!Array.isArray(payload.directions))throw Error('Invalid trend library schema');
 const updatedAt=iso(payload.updated_at,now),refreshAt=iso(payload.next_refresh_at,now,{allowFuture:true,required:false});
 const ageDays=Math.max(0,(now-Date.parse(updatedAt))/DAY);
 const diagnostics={ageDays:+ageDays.toFixed(2),updatedAt,refreshAt,stale:ageDays>maxAgeDays,excluded:{sources:[],products:[],directions:[],retailers:[]},warnings:[]};
 if(!refreshAt)diagnostics.warnings.push('Next refresh timestamp missing');
 else if(Date.parse(refreshAt)<Date.parse(updatedAt))diagnostics.warnings.push('Next refresh precedes verification');
 else if(Date.parse(refreshAt)<now)diagnostics.warnings.push('Scheduled refresh overdue');
 const sources=[],ids=new Set(),urls=new Set(),siteSet=new Set();
 for(const x of payload.sources.slice(0,30)){
  const url=safeExternalLink(x?.url),id=safeText(x?.id,60),title=safeText(x?.title,150);
  if(!id||!title||!url||ids.has(id)||urls.has(url)){diagnostics.excluded.sources.push({id:id||null,reason:!url?'unsafe-or-invalid-url':'duplicate-or-missing-source'});continue;}
  let checkedAt,publishedAt=null;
  try{checkedAt=iso(x.checked_at,now);if(x.published_at){
    const pub=Date.parse(x.published_at);
    if(!Number.isFinite(pub)||pub>now+DAY)throw Error('Invalid published date');
    publishedAt=new Date(pub).toISOString();
  }}catch{diagnostics.excluded.sources.push({id,reason:'invalid-or-missing-checked-date'});continue;}
  const host=new URL(url).hostname;
  ids.add(id);urls.add(url);siteSet.add(host);
  if(!publishedAt)diagnostics.warnings.push('Publication date missing: '+id);
  sources.push({id,title,publication:safeText(x.publication,80),url,publishedAt,checkedAt,host});
 }
 if(siteSet.size<minPublicationSites)diagnostics.warnings.push('Insufficient independent publication sites');
 const sourceIds=new Set(sources.map(s=>s.id));
 const directions=[],dirIds=new Set();
 for(const x of payload.directions.slice(0,100)){
  const id=safeText(x?.id,60),slot=x?.slot,type=safeText(x?.type,60);
  if(!id||dirIds.has(id)||!sourceIds.has(x.source_id)||!typeFitsSlot(type,slot)){
   diagnostics.excluded.directions.push({id:id||null,reason:!typeFitsSlot(type,slot)?'wrong-clothing-category-or-type':'duplicate-or-missing-valid-source'});continue;
  }
  dirIds.add(id);
  directions.push({id,slot,type,label:safeText(x.label||type,80),reason:safeText(x.reason,300),sourceId:x.source_id,
   audiences:(Array.isArray(x.audiences)?x.audiences:['All']).filter(y=>['All','Women','Men'].includes(y)),
   seasons:(Array.isArray(x.seasons)?x.seasons:[]).filter(y=>['Spring','Summer','Fall','Winter'].includes(y)),
   occasions:(Array.isArray(x.occasions)?x.occasions:[]).filter(y=>['Casual','Work','Dinner','Active'].includes(y)),color:safeText(x.color||'neutral',40)});
 }
 const products=[],productUrls=new Set();
 for(const x of payload.products.slice(0,100)){
  const url=safeExternalLink(x?.url),type=safeText(x?.type,60);
  if(!url||!allTypes.has(type)||!safeText(x.name)||x.available===false||productUrls.has(url)){
   diagnostics.excluded.products.push({url:x?.url||null,reason:x?.available===false?'explicitly-unavailable':'unsafe-duplicate-or-wrong-type'});continue;
  }
  let checkedAt;
  try{checkedAt=iso(x.checked_at,now);}catch{diagnostics.excluded.products.push({url,reason:'missing-or-invalid-checked-date'});continue;}
  if(now-Date.parse(checkedAt)>maxAgeDays*DAY){diagnostics.excluded.products.push({url,reason:'price-and-availability-verification-overdue'});continue;}
  productUrls.add(url);
  products.push({url,type,name:safeText(x.name,150),retailer:safeText(x.retailer,80),audience:['All','Women','Men'].includes(x.audience)?x.audience:'All',
   checkedAt,priceAtCheck:Number.isFinite(x.price_at_check)&&x.price_at_check>=0?x.price_at_check:null});
 }
 const retailers=[],retailerKeys=new Set();
 for(const x of (Array.isArray(payload.retailers)?payload.retailers:[]).slice(0,50)){
  const url=safeExternalLink(x?.url),name=safeText(x?.name,80),types=(Array.isArray(x.types)?x.types:[]).filter(t=>allTypes.has(t));
  const audience=['All','Women','Men'].includes(x?.audience)?x.audience:'All',key=(url||'')+'|'+audience+'|'+types.slice().sort().join(',');
  if(!url||!name||retailerKeys.has(key)||(!types.length&&Array.isArray(x.types)&&x.types.length)){
   diagnostics.excluded.retailers.push({url:x?.url||null,reason:'duplicate-unsafe-or-invalid-category'});continue;
  }
  retailerKeys.add(key);
  retailers.push({url,name,types,audience});
 }
 // Mark a link unverified when it has not been checked in the last eight days.
 const staleProducts=products.filter(x=>now-Date.parse(x.checkedAt)>maxAgeDays*DAY).length;
 const staleSources=sources.filter(x=>now-Date.parse(x.checkedAt)>maxAgeDays*DAY).length;
 if(staleProducts)diagnostics.warnings.push(staleProducts+' product check timestamps overdue');
 if(staleSources)diagnostics.warnings.push(staleSources+' source check timestamps overdue');
 const complete=sources.length>=2&&directions.length>=3&&siteSet.size>=minPublicationSites;
 const fresh=complete&&!diagnostics.stale&&staleSources===0;
 return {library:{updatedAt,refreshAt,sources,products,directions,retailers},diagnostics,
  status:!complete?'invalid':fresh?'current':'stale',canUseAsCurrentResearch:fresh,
  publicationSites:siteSet.size,retailerSites:new Set(products.map(p=>new URL(p.url).hostname)).size};
}
export function chooseTrendResearch({remote=null,cached=null,embedded=null}={},options={}){
 const evaluated=[],warnings=[];
 for(const [origin,data] of Object.entries({remote,cached,embedded})){
  if(data===null)continue;
  try{const result=normalizeQualityLibrary(data,options);evaluated.push({origin,...result});}
  catch(error){warnings.push(origin+': '+error.message);}
 }
 // A malformed, stale or offline source never overwrites fresh available data.
 const current=evaluated.filter(x=>x.status==='current').sort((a,b)=>Date.parse(b.library.updatedAt)-Date.parse(a.library.updatedAt));
 if(current.length)return {mode:'verified-research',...current[0],warnings};
 return {mode:'general-styling-only',origin:null,library:null,
  fallbackUpdatedAt:evaluated.sort((a,b)=>Date.parse(b.library.updatedAt)-Date.parse(a.library.updatedAt))[0]?.library.updatedAt||null,
  warnings:[...warnings,'No sufficiently current, diverse verified trend library available; use owned-clothing styling or generic clearly labeled ideas.']};
}
export function shoppingForSlot(library,slot,{audience='All',limit=12}={}){
 if(!library||!SLOT_TYPES[slot])return {directions:[],products:[],retailers:[]};
 const matches=a=>a==='All'||audience==='All'||a===audience;
 const directions=library.directions.filter(x=>x.slot===slot&&(!x.audiences.length||x.audiences.some(matches)));
 const allowed=new Set(directions.map(x=>x.type));
 const products=library.products.filter(x=>allowed.has(x.type)&&matches(x.audience)).slice(0,limit);
 const retailers=library.retailers.filter(x=>matches(x.audience)&&x.types.some(t=>allowed.has(t))).slice(0,limit);
 return {directions,products,retailers};
}
/**
 * Link availability is only as trustworthy as a supplied probe. Never issue
 * network requests from this module. 403/429 and offline are UNVERIFIED,
 * not evidence a destination is broken. Any redirection requires review.
 */
export async function inspectExternalLink(raw,probe){
 const url=safeExternalLink(raw);
 if(!url)return {status:'unsafe',url:null};
 if(typeof probe!=='function')return {status:'unverified',url,reason:'no-network-probe'};
 try{
  const reply=await probe(url);
  if(!reply||!Number.isInteger(reply.status))return {status:'unverified',url,reason:'unknown-response'};
  const destination=reply.url?safeExternalLink(reply.url):url;
  if(!destination)return {status:'unsafe',url,reason:'redirect-to-unsafe-location'};
  if(reply.redirected||destination!==url||reply.status>=300&&reply.status<400)return {status:'review-redirect',url,destination};
  if(reply.status===404||reply.status===410)return {status:'broken',url,httpStatus:reply.status};
  if(reply.status>=200&&reply.status<300)return {status:'reachable',url,httpStatus:reply.status,availabilityUnconfirmed:true};
  return {status:'unverified',url,httpStatus:reply.status};
 }catch{return {status:'unverified',url,reason:'probe-error-or-offline'};}
}
/** Shopping links cannot be selected as owned garments. No mutation. */
export function ownedOnlyOutfitView(candidate,ownedItems,shoppingIdeas=[]){
 if(!candidate||!candidate.board||!candidate.board.slots||!Array.isArray(ownedItems)||!Array.isArray(shoppingIdeas))throw Error('Owned outfit inputs required');
 const ownedById=new Map();
 for(const item of ownedItems){
  if(!item||typeof item.id!=='string'||!item.id||ownedById.has(item.id))throw Error('Ambiguous owned garment identity');
  ownedById.set(item.id,item);
 }
 const slots=Object.create(null);
 for(const [slot,id] of Object.entries(candidate.board.slots)){
  if(!ownedById.has(id))throw Error('Shopping or missing item cannot enter owned outfit');
  slots[slot]=id;
 }
 const own=new Set(Object.values(slots));
 if(own.size!==Object.keys(slots).length)throw Error('Duplicate slot garment');
 return {ownedSlots:slots,ownedGarments:Object.values(slots).map(id=>ownedById.get(id)),
  shoppingInspiration:shoppingIdeas.map(x=>({name:safeText(x.name),type:safeText(x.type),url:safeExternalLink(x.url)})) .filter(x=>x.name&&x.url),
  shoppingItemsCountAsOwned:false};
}
