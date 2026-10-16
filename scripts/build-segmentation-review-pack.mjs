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
 '1. Extract the ZIP and open START-REVIEW.html to rate all six cutouts.',
 '2. For shoe and boot reference outlines, see FOOTWEAR-OUTLINE-REVIEW.txt.',
 '3. Open annotate-garment.html in a modern browser.',
 '4. Load a photo from photos/ and the matching experimental mask from predictions/.',
 '5. Correct all shoe pixels and exclude flooring, shadows, mannequin and other objects.',
 '6. Export a draft annotation JSON. The editor works at an annotated canvas resolution (up to 768px), not the full source resolution.',
 '7. Have a separate reviewer inspect each full-resolution original and draft before approval.',
 '8. Only independently reviewed, approved outlines may be scored. Ratings alone are NOT ground truth.',
 '',
 'Images and AI predictions are experimental. No customer-facing changes.',
 'Source list and expected checksums are in manifest.json.'
 ].join('\n'));
console.log('REVIEW_PACK '+JSON.stringify({cases:manifest.cases.length,folder:root}));
