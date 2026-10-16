import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.argv[2]||'benchmark/review-pack';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
await mkdir(join(root,'photos'),{recursive:true});
await mkdir(join(root,'predictions'),{recursive:true});
for(const item of manifest.cases){
 await copyFile(join('benchmark/photos',item.image),join(root,'photos',item.image));
 await copyFile(join('benchmark/modnet-predictions',item.id+'.modnet-prediction.json'),join(root,'predictions',item.id+'.modnet-prediction.json'));
}
const labels={'commons-0035':'Orange shorts','commons-0049':'Beige dress','commons-0053':'Black dress','commons-0065':'Jacket','commons-0079':'Sneakers','commons-0094':'Boots'};
const reviewCases=[];
for(const item of manifest.cases){const prediction=JSON.parse(await readFile(join('benchmark/modnet-predictions',item.id+'.modnet-prediction.json'),'utf8'));const photo=await readFile(join('benchmark/photos',item.image));reviewCases.push({id:item.id,image:item.image,label:labels[item.id]||item.id,sourceSha256:item.sourceSha256,photo:'data:image/jpeg;base64,'+photo.toString('base64'),prediction:{width:prediction.width,height:prediction.height,runs:prediction.runs}});}
const template=await readFile('benchmark/mobile-review-template.html','utf8');
await writeFile(join(root,'START-REVIEW.html'),template.replace('__REVIEW_DATA__',JSON.stringify(reviewCases).replaceAll('<','\\u003c')));
await copyFile('benchmark/annotate-garment.html',join(root,'annotate-garment.html'));
await copyFile('benchmark/segmentation-review-manifest.json',join(root,'manifest.json'));
await writeFile(join(root,'START-HERE.txt'),[
 'CLOSET CURRENT — SIX-PHOTO OUTLINE REVIEW PACK',
 '',
 '1. Extract the ZIP and open START-REVIEW.html in a modern browser (works offline).',
 '2. Tap Original or AI cutout to compare full-resolution photographs.',
 '3. Tap Looks good or Needs work, then Save my feedback to download JSON.',
 '4. These are visual ratings ONLY, not ground-truth pixel accuracy.',
 '5. For expert pixel-boundary reviews, open annotate-garment.html.',
 '2. Load a photograph from photos/. The editor verifies its SHA-256.',
 '3. Load the matching predictions/<case-id>.modnet-prediction.json using "Load AI mask".',
 '4. Inspect the garment carefully; manually correct missing fabric and unwanted background.',
 '5. Export the JSON draft. Repeat for all six garments.',
 '6. Have an independent second reviewer verify each outline. AI masks are NEVER ground truth.',
 '7. Review/approval metadata and masks must be checked before benchmark scoring.',
 '',
 'Images and AI predictions are experimental. No customer-facing changes.',
 'Source list and expected checksums are in manifest.json.'
 ].join('\n'));
console.log('REVIEW_PACK '+JSON.stringify({cases:manifest.cases.length,folder:root}));
