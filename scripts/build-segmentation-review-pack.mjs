import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.argv[2]||'benchmark/review-pack';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
await mkdir(join(root,'photos'),{recursive:true});
await mkdir(join(root,'OPEN-IMAGES-ON-PHONE'),{recursive:true});
await mkdir(join(root,'predictions'),{recursive:true});
for(const item of manifest.cases){
 await copyFile(join('benchmark/photos',item.image),join(root,'photos',item.image));
 await copyFile(join('benchmark/modnet-predictions',item.id+'.modnet-prediction.json'),join(root,'predictions',item.id+'.modnet-prediction.json'));
}
for(const id of ['commons-0079','commons-0094']){
 await copyFile(join('benchmark/model-visual-comparison',id+'-three-way.png'),join(root,'OPEN-IMAGES-ON-PHONE',id+'-comparison.png'));
}
const labels={'commons-0035':'Orange shorts','commons-0049':'Beige dress','commons-0053':'Black dress','commons-0065':'Jacket','commons-0079':'Sneakers','commons-0094':'Boots'};
const reviewCases=[];
for(const item of manifest.cases){const prediction=JSON.parse(await readFile(join('benchmark/modnet-predictions',item.id+'.modnet-prediction.json'),'utf8'));const photo=await readFile(join('benchmark/photos',item.image));reviewCases.push({id:item.id,image:item.image,label:labels[item.id]||item.id,sourceSha256:item.sourceSha256,photo:'data:image/jpeg;base64,'+photo.toString('base64'),prediction:{width:prediction.width,height:prediction.height,runs:prediction.runs}});}
const template=await readFile('benchmark/mobile-review-template.html','utf8');
await writeFile(join(root,'START-REVIEW.html'),template.replace('__REVIEW_DATA__',JSON.stringify(reviewCases).replaceAll('<','\\u003c')));
const footwearCases=reviewCases.filter(item=>['commons-0079','commons-0094'].includes(item.id));
if(footwearCases.length!==2)throw Error('Footwear cases missing');
await writeFile(join(root,'START-FOOTWEAR-REVIEW.html'),template.replace('__REVIEW_DATA__',JSON.stringify(footwearCases).replaceAll('<','\\u003c')));
await copyFile('benchmark/annotate-garment.html',join(root,'annotate-garment.html'));
await copyFile('benchmark/annotate-shadow-polygons.html',join(root,'annotate-shadow-polygons.html'));
await copyFile('benchmark/review-shadow-outlines.html',join(root,'review-shadow-outlines.html'));
await copyFile('benchmark/ANNOTATION-REVIEW.md',join(root,'ANNOTATION-REVIEW.md'));
await copyFile('benchmark/FOOTWEAR-OUTLINE-REVIEW.txt',join(root,'FOOTWEAR-OUTLINE-REVIEW.txt'));
await copyFile('benchmark/segmentation-review-manifest.json',join(root,'manifest.json'));
await writeFile(join(root,'START-HERE.txt'),[
 'CLOSET CURRENT — SIX-PHOTO OUTLINE REVIEW PACK',
 '',
 '1. ON ANDROID: open OPEN-IMAGES-ON-PHONE/commons-0079-comparison.png and commons-0094-comparison.png first. These are regular pictures and work without JavaScript.',
 '2. Reply in ChatGPT with what is missing or what background remains. You can also attach these images.',
 '3. The optional HTML reviewer may not run in Android document-preview apps; do not use it if it stays on Loading garment.',
 '4. Extract the ZIP; optionally open START-FOOTWEAR-REVIEW.html in a full browser to record structured feedback.',
 '   Alternatively open START-REVIEW.html to rate all six cutouts.',
 '5. For independently reviewed GARMENT and SHADOW outlines: open annotate-shadow-polygons.html in a modern browser.',
 '   Choose the original photo from photos/ and its matching ID. Draw garment and cast-shadow regions separately, then export a DRAFT JSON.',
 '6. Have a DIFFERENT person open review-shadow-outlines.html in a modern browser, load the ORIGINAL verified photo and draft JSON,',
 '   inspect both outlines, provide reviewer identities and confirmations, then export a candidate approved JSON.',
 '7. Run repository shadow-annotation validation and mask-overlap scoring before treating it as verified benchmark ground truth.',
 '8. If you only need a garment silhouette (not shadow regions), annotate-garment.html creates a separate draft mask.',
 '   See ANNOTATION-REVIEW.md and FOOTWEAR-OUTLINE-REVIEW.txt for the independent-review criteria.',
 '9. Rating a picture or checking a box does NOT establish actual shadow-removal accuracy. Do not promote an experimental model automatically.',
 '',
 'Images and AI predictions are experimental. No customer-facing changes.',
 'Source list and expected checksums are in manifest.json.'
 ].join('\n'));
console.log('REVIEW_PACK '+JSON.stringify({cases:manifest.cases.length,folder:root}));
