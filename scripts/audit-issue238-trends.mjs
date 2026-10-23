/**
 * Reproducible OFFLINE main-data audit. Writes sanitized diagnostics only,
 * never fetches retailer pages, customer data or paid model APIs.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {normalizeQualityLibrary,shoppingForSlot} from '../research/trends/trend-quality-gate.mjs';
const seed=JSON.parse(await readFile('public/trend-data.json','utf8'));
const now=Date.parse('2026-10-23T19:00:00.000Z'); // fixed time for deterministic fixture proof
const evaluated=normalizeQualityLibrary(seed,{now});
if(evaluated.status!=='current'||evaluated.publicationSites<2)throw Error('Bundled trend data failed baseline offline gate');
const coverage=Object.fromEntries(['top','bottom','layer','shoes','bag','accessory','finish'].map(slot=>{
 const records=shoppingForSlot(evaluated.library,slot);
 return [slot,{directions:records.directions.length,products:records.products.length,retailers:records.retailers.length}];
}));
const productTypes=new Set(evaluated.library.products.map(x=>x.type));
const withoutProducts=evaluated.library.directions.filter(x=>!productTypes.has(x.type)).map(x=>({slot:x.slot,type:x.type,id:x.id}));
const report={
 audit:'issue238-offline-synthetic-bundled-trend-fixture',
 checkedAsOf:new Date(now).toISOString(),
 bundleUpdatedAt:evaluated.library.updatedAt,
 nextRefreshAt:evaluated.library.refreshAt,
 status:evaluated.status,
 publicationSites:evaluated.publicationSites,retailerSites:evaluated.retailerSites,
 counts:{sources:evaluated.library.sources.length,directions:evaluated.library.directions.length,products:evaluated.library.products.length,retailers:evaluated.library.retailers.length},
 shoppingCoverageBySlot:coverage,stylesWithoutMatchedProduct:withoutProducts,
 missingPublicationDates:evaluated.library.sources.filter(x=>!x.publishedAt).map(x=>x.id),
 checkedOnlyNotLive:{httpsURLs:true,reachableStatus:false,stock:false,priceCurrent:false,redirectChain:false},
 warnings:evaluated.diagnostics.warnings,
 excluded:evaluated.diagnostics.excluded
};
await mkdir('artifacts/issue238',{recursive:true});
await writeFile('artifacts/issue238/offline-trend-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('ISSUE238_OFFLINE_TREND_AUDIT '+JSON.stringify(report));
