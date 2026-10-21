// Public, maintainers-only trend research freshness audit. Never rewrite curated trend data.
// May be scheduled on main after code review; a check does not verify a live product or price.
import {readFileSync,appendFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {normalizeTrendLibrary,safeTrendURL}=require('../public/trend-library.js');

const day=86400000;
const isoDate=value=>{
 const t=Date.parse(value);return Number.isFinite(t)?t:null;
};
const host=url=>{
 try{return new URL(url).hostname.toLowerCase().replace(/^www\./,'');}
 catch{return '';}
};
const days=(ms)=>Math.max(0,Math.ceil(ms/day));
export const WATCH_MARKER='<!-- closet-current-weekly-trend-editorial-watch -->';

export function auditTrendResearch(data,now=new Date()){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('Invalid audit clock.');
 const errors=[],warnings=[];
 let normalized=null;
 try{normalized=normalizeTrendLibrary(data);}catch(error){errors.push('Catalog schema or safe-link validation failed: '+error.message);}
 const updated=isoDate(data?.updated_at),due=isoDate(data?.next_refresh_at);
 if(updated===null)errors.push('Missing or invalid updated_at time.');
 if(due===null)errors.push('Missing or invalid next_refresh_at time.');
 if(updated!==null&&updated>now.getTime()+day)errors.push('Catalog verification time is in the future.');
 if(updated!==null&&due!==null&&(due-updated<6*day||due-updated>8*day))
  errors.push('Next refresh date must follow the last review by approximately one week.');
 const sourceRows=Array.isArray(data?.sources)?data.sources:[];
 const productRows=Array.isArray(data?.products)?data.products:[];
 const directions=Array.isArray(data?.directions)?data.directions:[];
 const publications=new Set(sourceRows.map(x=>host(x?.url)).filter(Boolean));
 const merchants=new Set(productRows.map(x=>host(x?.url)).filter(Boolean));
 if(sourceRows.length<6||publications.size<6)warnings.push('Fewer than six independent fashion publication websites.');
 if(productRows.length<6||merchants.size<6)warnings.push('Fewer than six independent retailer websites.');
 const sourceIDs=new Set();
 for(const source of sourceRows){
  if(!source||typeof source.id!=='string'||!source.id.trim()){errors.push('Fashion source is missing a stable ID.');continue;}
  if(sourceIDs.has(source.id))errors.push('Duplicate fashion source ID: '+source.id);
  sourceIDs.add(source.id);
  if(!safeTrendURL(source.url))errors.push('A fashion source URL is unsafe or invalid.');
  const checked=isoDate(source.checked_at);
  if(checked===null)warnings.push('Research source '+source.id+' lacks an explicit verification timestamp.');
  else if(updated!==null&&(checked<updated-8*day||checked>updated+day))warnings.push('Research source '+source.id+' has an out-of-window verification timestamp.');
  if(source.published_at){
   const published=isoDate(source.published_at+'T00:00:00Z');
   if(published===null||published>now.getTime()+day)warnings.push('Publication date needs review: '+source.id);
  }
 }
 const types=new Set(productRows.map(p=>p?.type).filter(Boolean));
 for(const product of productRows){
  if(!safeTrendURL(product?.url))errors.push('A retailer link is unsafe or invalid.');
  const checked=isoDate(product?.checked_at);
  if(checked===null||updated!==null&&(checked<updated-8*day||checked>updated+day))
   warnings.push('A product example lacks a recent verified check timestamp.');
 }
 for(const direction of directions)
  if(!sourceIDs.has(direction?.source_id))errors.push('Trend direction is not backed by a recorded source: '+(direction?.id||'unknown'));
 if(normalized&&normalized.sources.length!==sourceRows.length)errors.push('Some source records were excluded by the public trend parser.');
 if(normalized&&normalized.products.length!==productRows.length)errors.push('Some product records were excluded by the public trend parser.');
 const overdue=due!==null&&now.getTime()>due;
 if(overdue)warnings.push('Weekly fashion research refresh is overdue.');
 const report={
  schema:'closet-current-trend-audit-v1',auditAt:now.toISOString(),
  updatedAt:updated!==null?new Date(updated).toISOString():null,
  nextRefreshAt:due!==null?new Date(due).toISOString():null,
  overdue,overdueDays:overdue?days(now.getTime()-due):0,
  counts:{sources:sourceRows.length,publicationSites:publications.size,
   products:productRows.length,retailerSites:merchants.size,directions:directions.length},
  errors:[...new Set(errors)],warnings:[...new Set(warnings)],
  needsAttention:errors.length>0||overdue,
  automaticPublication:false,linksLiveChecked:false,
  actualProductAvailabilityVerified:false,
  sourceRotationVerifiedAgainstPriorWeeks:false
 };
 return report;
}
export function trendWatchIssue(report){
 if(!report?.needsAttention)return null;
 const issues=report.errors.map(x=>'- '+x).join('\n')||'- The catalog is past its reviewed next-refresh date.';
 const counts=report.counts||{};
 const body=[
  WATCH_MARKER,
  '## Closet Current — weekly trend research needs review',
  '',
  'This is a **maintainer action**, not an automatic publication or a verified retailer availability report.',
  '',
  '**Last reviewed:** '+(report.updatedAt||'unknown'),
  '**Next review due:** '+(report.nextRefreshAt||'invalid/missing'),
  '**Days overdue:** '+(report.overdueDays||0),
  '**Catalog coverage:** '+(counts.publicationSites||0)+' publication websites, '+(counts.retailerSites||0)+' retailer websites.',
  '',
  '### Why review is needed',
  issues,
  '',
  '### Editorial checklist',
  '- Read and independently check current fashion articles from a **rotating set of publications**, not only the previous week’s websites.',
  '- Check actual retailer product pages, availability and any prices before claiming they are current.',
  '- Confirm every recommended outfit direction references a genuine matching source and every product link is safe.',
  '- Update \`public/trend-data.json\` with real \`checked_at\` times, \`updated_at\` and \`next_refresh_at\` approximately seven days later **only after** completing the research.',
  '- Run the catalog schema test and full CI in a separate PR; do not silently publish unreviewed links or guesses.',
  '',
  'This automation does not modify customer wardrobes, deploy code, make purchases or approve production changes.'
 ].join('\n');
 return {title:'Closet Current: weekly fashion research refresh required',body};
}

const invokedDirectly=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1];
if(invokedDirectly){
 const catalog=JSON.parse(readFileSync('public/trend-data.json','utf8'));
 const report=auditTrendResearch(catalog);
 const issue=trendWatchIssue(report);
 const json=JSON.stringify({report,issue},null,2)+'\n';
 if(process.argv.includes('--json'))process.stdout.write(json);
 else{
  process.stdout.write(JSON.stringify(report)+'\n');
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   '### Closet Current trend research audit\n\n'+
   '- Reviewed: '+(report.updatedAt||'invalid')+'\n'+
   '- Next due: '+(report.nextRefreshAt||'invalid')+'\n'+
   '- Overdue: '+(report.overdue?'YES':'no')+'\n'+
   '- Sites: '+report.counts.publicationSites+' publications / '+report.counts.retailerSites+' retailers\n'+
   '- Customer recommendations changed: **no**\n'+
   '- Links checked live: **no**\n'+
   '- Issues requiring attention: '+report.errors.concat(report.warnings).join('; ')+'\n');
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,
   'needs_attention='+(report.needsAttention?'true':'false')+'\n');
  if(process.env.GITHUB_WORKSPACE){
   const {writeFileSync}=require('node:fs');
   writeFileSync('trend-editorial-watch-report.json',json);
  }
 }
 if(report.errors.length)process.exitCode=1;
}
