/**
 * Exactly comparable offline shadow-color benchmark.
 * Ground truth is the synthetic paint colors below, not human labels or AI.
 * 7 clothing categories × [well lit, heavy shadow, scene background].
 * Old = unchanged PhotoColor.maskedPalette; New = isolated source-region gate.
 */
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {evaluateOriginalRegionColor} from '../research/original-color/shadow-corroborated-color.mjs';
const C=createRequire(import.meta.url)('../public/photo-color.js');
const cases=[
 ['Tops','T-shirt','Red',[220,30,30],[42,7,10]],
 ['Bottoms','Jeans','Blue',[30,75,210],[14,24,50]],
 ['Bottoms','Shorts','Green',[30,200,65],[9,50,20]],
 ['Bottoms','Skirt','Purple',[135,40,180],[34,8,46]],
 ['Dresses','Dress','Pink',[220,60,160],[55,8,40]],
 ['Outerwear','Jacket','Orange',[230,100,24],[52,23,5]],
 ['Shoes','Sneakers','Yellow',[220,195,20],[55,50,5]]
];
const variants=['full-light','heavy-shadow','shadow+background'],rows=[];
for(const [category,type,expected,lit,shade]of cases)for(const variant of variants){
 const width=64,height=64,data=new Uint8ClampedArray(width*height*4);
 const mask=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,j=i*4;
  const garment=variant!=='shadow+background'||x>=11&&x<51&&y>=3&&y<61;
  mask[i]=garment?1:0;
  const bright=variant==='full-light'||x<(variant==='heavy-shadow'?16:22);
  const rgb=garment?(bright?lit:shade):[25,95,230];
  data.set([...rgb,255],j);
 }
 // The old palette can optionally receive a mask through transparency, like
 // the existing outfit segmentation consumer. It sees the identical source.
 const masked=data.slice();
 for(let i=0;i<mask.length;i++)if(!mask[i])masked[i*4+3]=0;
 const baseline=C.maskedPalette(masked,width,height);
 const after=evaluateOriginalRegionColor({width,height,channels:4,data},{
  family:C.family,mask,sourceRole:'original-instance'});
 rows.push({category,type,variant,expected,previous:baseline?.primary||'Unknown',
  current:after.color,previousCorrect:baseline?.primary===expected,currentCorrect:after.status==='verified-color'&&after.color===expected,
  shadowPixelsRecovered:after.shadowRecoveredPixels,review:after.status==='review',
  sourceUnchanged:data.every((v,i)=>v===(garmentPixelAt(i,width,height,variant,lit,shade)))}); // verification below
}
function garmentPixelAt(index,width,height,variant,lit,shade){
 const i=Math.floor(index/4),component=index%4,x=i%width,y=Math.floor(i/width);
 const garment=variant!=='shadow+background'||x>=11&&x<51&&y>=3&&y<61;
 const bright=variant==='full-light'||x<(variant==='heavy-shadow'?16:22);
 return component===3?255:(garment?(bright?lit:shade):[25,95,230])[component];
}
const stat=records=>({
 count:records.length,beforeCorrect:records.filter(x=>x.previousCorrect).length,
 afterCorrect:records.filter(x=>x.currentCorrect).length,
 beforeAccuracyPercent:+(100*records.filter(x=>x.previousCorrect).length/records.length).toFixed(2),
 afterAccuracyPercent:+(100*records.filter(x=>x.currentCorrect).length/records.length).toFixed(2),
 userReviewCount:records.filter(x=>x.review).length
});
const report={
 protocol:'predefined solid synthetic RGB patches with original-source alpha/instance mask; NO trained model or real-photo inference',
 baseline:'unchanged public/photo-color.js maskedPalette',
 policy:'isolated research/original-color/shadow-corroborated-color.mjs',
 total:stat(rows),
 byCategory:Object.fromEntries([...new Set(cases.map(x=>x[0]))].map(category=>[category,stat(rows.filter(x=>x.category===category))])),
 byType:Object.fromEntries(cases.map(x=>[x[1],stat(rows.filter(z=>z.type===x[1]))])),
 pixelsRetained:rows.filter(x=>x.sourceUnchanged).length,
 observations:rows,realPhotosEvaluated:0,paidCalls:0,
 limitation:'Color classification of 21 deliberately constructed patches only. Numbers cannot be generalized to actual garments, recognition, segmentation or model accuracy.'
};
mkdirSync('artifacts/original-shadow',{recursive:true});
writeFileSync('artifacts/original-shadow/synthetic-color-comparison.json',JSON.stringify(report,null,2)+'\n');
console.log('SHADOW_COLOR_SYNTHETIC_COMPARISON '+JSON.stringify({total:report.total,byCategory:report.byCategory,pixelsRetained:report.pixelsRetained}));
if(report.pixelsRetained!==rows.length||report.total.afterCorrect<report.total.beforeCorrect)
 throw Error('No safe synthetic improvement');
