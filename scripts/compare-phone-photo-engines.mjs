#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {compareBrowserOriginalPhotos} from '../benchmark/phone-photo-engine-comparison.mjs';
const [chromium,webkit,out]=process.argv.slice(2);
if(!chromium||!webkit||!out)throw Error('Usage: node scripts/compare-phone-photo-engines.mjs chromium-results.json webkit-results.json output.json');
const [cr,wr]=await Promise.all([chromium,webkit].map(x=>readFile(x,'utf8')));
const report=compareBrowserOriginalPhotos(JSON.parse(cr),JSON.parse(wr),{
 chromiumJSON:cr,webkitJSON:wr});
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(report,null,2));
console.log('BROWSER_ORIGINAL_PHOTO_COMPARISON '+JSON.stringify({
 broadCategoryCorrectInBoth:report.broadCategoryCorrectInBoth,
 negativeRejectedInBoth:report.negativeRejectedInBoth,
 subtypeDifferences:report.typeDisagreements,
 actualPhysicalAndroidTested:false,actualPhysicalIPhoneTested:false,
 releaseApproved:false
}));
