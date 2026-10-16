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
await copyFile('benchmark/annotate-garment.html',join(root,'annotate-garment.html'));
await copyFile('benchmark/segmentation-review-manifest.json',join(root,'manifest.json'));
await writeFile(join(root,'START-HERE.txt'),[
 'CLOSET CURRENT — SIX-PHOTO OUTLINE REVIEW PACK',
 '',
 '1. Extract this ZIP to a folder, then open annotate-garment.html in a modern browser.',
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
