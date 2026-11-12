/**
 * Closet Current Parallel #67 / M5: public original-photo candidate intake.
 *
 * Wikimedia Commons search result != confirmed clothing subtype != reliable
 * copyright permission != human ground truth. Output MUST remain quarantine:
 * never feed these candidates to train, tune or blind-acceptance pipelines.
 * Artist/source/license and real JPEG SHA need separate independent review.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export const P67_05_SEARCHES=Object.freeze([
 {target:'T-shirt',query:'t-shirt garment'},
 {target:'Sweatshirt',query:'sweatshirt clothing'},
 {target:'Blouse',query:'blouse clothing'},
 {target:'Tunic',query:'tunic clothing'},
 {target:'Sneakers',query:'sneakers shoes'},
 {target:'Boots',query:'ankle boots footwear'},
 {target:'Dress',query:'dress garment'},
 {target:'Skirt',query:'skirt garment'},
 {target:'nonclothing',query:'empty room interior'}
]);
const IMAGE_MIMES=new Set(['image/jpeg','image/png','image/webp']);
const licensedShortNames=/^(?:CC0(?: 1\.0)?|CC BY(?:-SA)? [234]\.0)$/i;
const uriAllowed=value=>{
 try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='upload.wikimedia.org';}
 catch{return false;}
};
function plain(value,max=320){
 if(typeof value!=='string'||value.length>max) return null;
 if(/[<>\r\n\u0000-\u001f]/.test(value))return null;
 return value;
}
const metadata=(row,key)=>row?.extmetadata?.[key]?.value;
const candidateKey=row=>String(row?.pageid||'');

export function inspectCommonsSearchResponse05(search,raw,known=new Set()){
 if(!P67_05_SEARCHES.some(x=>x.target===search?.target&&x.query===search.query))
  throw Error('P67-05: unexpected search target cannot be a clothing label');
 if(!raw||raw.error||!Array.isArray(raw.query?.pages))
  throw Error('P67-05: invalid untrusted Commons imageinfo response');
 const candidates=[],seen=new Set();
 for(const page of raw.query.pages){
  const info=page.imageinfo?.[0];
  const title=plain(page.title,450),license=plain(metadata(info,'LicenseShortName'),65);
  const licenseUrl=plain(metadata(info,'LicenseUrl'),450);
  const imageUrl=info?.thumburl||info?.url;
  let validLicense=false;
  try{
   const parsed=new URL(licenseUrl);
   validLicense=parsed.protocol==='https:'&&
    (parsed.hostname==='creativecommons.org'||parsed.hostname==='www.creativecommons.org');
  }catch{}
  const key=candidateKey(page),sha1=info?.sha1;
  if(!/^\d+$/.test(key)||seen.has(key)||known.has(title?.toLowerCase())||
     !title?.startsWith('File:')||!/\.(jpe?g|png|webp)$/i.test(title)||
     !IMAGE_MIMES.has(info?.mime)||!uriAllowed(imageUrl)||
     !/^[a-f0-9]{40}$/i.test(sha1||'')||
     !licensedShortNames.test(license||'')||!validLicense||
     !Number.isInteger(info?.size)||info.size<1024||info.size>20*1024*1024||
     !Number.isInteger(info?.width)||info.width<224||
     !Number.isInteger(info?.height)||info.height<224)
   continue;
  seen.add(key);
  // Searched-for term is recorded as an intent only. A title, category,
  // uploader's description or AI guess is NOT a human-confirmed garment label.
  candidates.push({
   intakeKey:'commons-page-'+key,
   source:'Wikimedia Commons',
   sourcePage:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),
   sourceTitle:title,
   commonsOriginalSha1:sha1.toLowerCase(),
   previewUrl:imageUrl,
   listedLicense:license,
   listedLicenseUrl:licenseUrl,
   licenseVerifiedByHuman:false,
   sourcePixelsSha256:null,
   targetSearchTerm:search.target,
   originalGarmentLabel:null,
   primaryColorHumanLabel:null,
   categoryHumanLabel:null,
   originalPhotographReviewed:false,
   reviewerA:null,reviewerB:null,
   consentAndPersonRightsReviewed:false,
   dataSplit:null,
   status:'quarantine_not_training_ground_truth'
  });
 }
 return candidates;
}
export function combineSourceCandidates05(items,originals){
 if(!Array.isArray(items)||!Array.isArray(originals))
  throw Error('P67-05: invalid source manifest');
 const existing=new Set(originals.map(x=>x?.attribution?.title?.toLowerCase()).filter(Boolean));
 const ids=new Set(),shas=new Set(),retained=[];
 for(const candidate of items){
  if(!candidate||candidate.status!=='quarantine_not_training_ground_truth'||
     candidate.originalGarmentLabel!==null||
     candidate.primaryColorHumanLabel!==null||
     candidate.categoryHumanLabel!==null||
     candidate.reviewerA!==null||candidate.reviewerB!==null||
     candidate.sourcePixelsSha256!==null||
     !candidate.intakeKey?.startsWith('commons-page-')||
     existing.has(candidate.sourceTitle?.toLowerCase()))
   throw Error('P67-05: unreviewed metadata cannot be promoted to a training label');
  if(ids.has(candidate.intakeKey)||shas.has(candidate.commonsOriginalSha1))continue;
  ids.add(candidate.intakeKey);shas.add(candidate.commonsOriginalSha1);
  retained.push(candidate);
 }
 return retained;
}

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function searchCommonsCandidates05(search,{fetchImpl=fetch,limit=14,maxAttempts=4}={}){
 if(!P67_05_SEARCHES.some(x=>x.target===search?.target&&x.query===search.query)||
    !Number.isInteger(limit)||limit<1||limit>20||
    !Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>5)
  throw Error('P67-05: invalid limited source query');
 const endpoint=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [key,value]of Object.entries({
  action:'query',format:'json',formatversion:'2',
  generator:'search',gsrsearch:search.query,gsrnamespace:'6',
  gsrlimit:String(limit),prop:'imageinfo',iiprop:'url|sha1|size|mime|extmetadata',
  iiurlwidth:'640',iiextmetadatafilter:'LicenseShortName|LicenseUrl',
 }))endpoint.searchParams.set(key,value);
 let error;
 for(let attempt=0;attempt<maxAttempts;attempt++){
  try{
   const response=await fetchImpl(endpoint,{
    headers:{'User-Agent':'ClosetCurrentResearch-Parallel67/1.0 (github.com/nickhaney916-lang/Closet-Current)','Accept':'application/json'},
    signal:AbortSignal.timeout(25000)
   });
   if(!response.ok){
    if(response.status===429||response.status>=500){error='rate-limit-or-server';}
    else throw Error('P67-05: license metadata request unavailable');
   }else{
    const raw=await response.json();
    return inspectCommonsSearchResponse05(search,raw);
   }
  }catch(e){error='connection-or-response-error';}
  if(attempt<maxAttempts-1)await pause(1000*(2**attempt));
 }
 throw Error('P67-05: source query unresolved: '+String(error||'unavailable'));
}
export async function buildQuarantinedSourcePool05({
 output='benchmark/p67-hard-confusion-source-candidates-05',fetchImpl=fetch
}={}){
 const current=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const candidates=[],counts={};
 for(const search of P67_05_SEARCHES){
  const results=await searchCommonsCandidates05(search,{fetchImpl});
  counts[search.target]=results.length;
  candidates.push(...results);
 }
 const distinct=combineSourceCandidates05(candidates,current);
 const report={
  schema:'closet-current-parallel67-unlabeled-public-source-quarantine/v1',
  requiresIndependentHumanClothingLabels:true,
  requiresSeparateCommercialImageRightsReview:true,
  dataForTraining:false,notBlindTest:true,
  canClaimAnyAccuracyImprovement:false,
  searchTerms:P67_05_SEARCHES.map(x=>x.target),
  candidateCount:distinct.length,bySearch:counts,
  sourceCorpusSha256:createHash('sha256').update(await readFile('benchmark/locked-photo-sources.json')).digest('hex'),
  candidates:distinct
 };
 await mkdir(resolve(output),{recursive:true});
 await writeFile(join(resolve(output),'unreviewed-candidates.json'),JSON.stringify(report,null,2)+'\n');
 console.log('P67_05_UNREVIEWED_LICENSE_SCREENED_CANDIDATES_NOT_TRAINING',JSON.stringify({
  count:distinct.length,bySearch:counts,
  humanAnnotations:0,verifiedPixelSha256:0,trainingEligible:0
 }));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await buildQuarantinedSourcePool05({output:process.argv[2]});
