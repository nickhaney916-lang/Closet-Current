import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flatlayContrastBoxes29,detectFlatlayFromImage29}
 from '../research/multi-garment-capture-01/flatlay-contrast-29.mjs';

function photo(w=200,h=150,bg=[237,237,237]){
 const data=new Uint8ClampedArray(w*h*4);
 const fill=(x0,y0,x1,y1,color)=>{
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=(y*w+x)*4;
   for(let c=0;c<3;c++)data[i+c]=color[c];
   data[i+3]=255;
  }
 };
 fill(0,0,w,h,bg);
 return {width:w,height:h,channels:4,data,fill};
}
const boxClose=(actual,expected,tol=.05)=>{
 assert.ok(Math.abs(actual.x-expected.x)<tol,'x mismatch '+JSON.stringify(actual));
 assert.ok(Math.abs(actual.y-expected.y)<tol,'y mismatch '+JSON.stringify(actual));
 assert.ok(Math.abs(actual.width-expected.width)<tol,'width mismatch '+JSON.stringify(actual));
 assert.ok(Math.abs(actual.height-expected.height)<tol,'height mismatch '+JSON.stringify(actual));
};
test('three separate contrasted unclassified flat-lay objects yield three crop suggestions',()=>{
 const p=photo(220,160,[241,241,238]);
 p.fill(25,25,78,85,[165,35,45]);
 p.fill(112,18,190,64,[30,55,128]);
 p.fill(130,100,190,145,[65,49,36]);
 const result=flatlayContrastBoxes29(p);
 assert.equal(result.eligible,true);
 assert.equal(result.boxes.length,3);
 const sorted=result.boxes.slice().sort((a,b)=>a.x-b.x);
 boxClose(sorted[0],{x:25/220,y:25/160,width:53/220,height:60/160});
 boxClose(sorted[1],{x:112/220,y:18/160,width:78/220,height:46/160});
 boxClose(sorted[2],{x:130/220,y:100/160,width:60/220,height:45/160});
 assert.equal(result.noTypeOrColorInferred,true);
 assert.equal(result.automaticSaveAllowed,false);
 assert.ok(result.boxes.every(b=>Object.keys(b).sort().join(',')==='height,width,x,y'));
});
test('uniform cream or black background works without interpreting the garment category',()=>{
 const a=photo(170,170,[252,250,246]);a.fill(35,30,115,120,[35,30,80]);
 assert.equal(flatlayContrastBoxes29(a).boxes.length,1);
 const b=photo(170,170,[24,24,25]);b.fill(35,30,115,120,[230,230,219]);
 assert.equal(flatlayContrastBoxes29(b).boxes.length,1);
});
test('textured and nonuniform backdrops do not yield confident machine-selected regions',()=>{
 const a=photo(200,150);
 a.fill(0,0,18,18,[200,0,0]);
 a.fill(182,0,200,18,[0,130,0]);
 a.fill(0,132,18,150,[0,0,200]);
 const r=flatlayContrastBoxes29(a);
 assert.equal(r.eligible,false);
 assert.match(r.reason,/nonuniform-corners/);
});
test('empty, nearly full foreground and invalid image sizes fail safely',()=>{
 const a=photo();
 assert.equal(flatlayContrastBoxes29(a).boxes.length,0);
 const b=photo();b.fill(20,10,190,145,[0,0,0]);
 assert.equal(flatlayContrastBoxes29(b).boxes.length,0,'near-full frame is not a separated garment');
 assert.equal(flatlayContrastBoxes29({data:new Uint8Array(1),width:400,height:300}).eligible,false);
 assert.equal(flatlayContrastBoxes29({data:new Uint8Array(512*512*4),width:513,height:512}).eligible,false);
 assert.equal(flatlayContrastBoxes29(photo(),{limit:99}).eligible,false);
});
test('threshold ignores tiny disconnected confetti and cannot pretend it found clothing',()=>{
 const a=photo();
 for(let y=15;y<140;y+=18)for(let x=15;x<190;x+=19)a.fill(x,y,x+2,y+2,[30,55,99]);
 const r=flatlayContrastBoxes29(a);
 assert.equal(r.boxes.length,0);
});
test('manual source review UI keeps original photos, requires reviewed crop and forbids automatic save',()=>{
 const code=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(code,/Suggest missed regions on a plain backdrop/);
 assert.match(code,/detectFlatlayFromImage29\(state\.decoded\)/);
 assert.match(code,/getOwner\(\)===state\.owner/);
 assert.match(code,/state\.proof\.sourceSHA256/);
 assert.match(code,/manual:true/);
 assert.match(code,/cropReviewed:false/);
 assert.match(code,/category:'Uncategorized'/);
 assert.match(code,/color:''/);
 assert.match(code,/confirmed:false/);
 assert.match(code,/piece\.image=photo\.image/);
 assert.match(code,/atomicSaveGarments24/);
 assert.match(code,/x\.cropReviewed!==true/);
 assert.doesNotMatch(code,/flatlay29:true,manual:false/);
 const helper=readFileSync('research/multi-garment-capture-01/flatlay-contrast-29.mjs','utf8');
 for(const s of ['fetch(','.postMessage(','indexedDB.open','window.localStorage','PhotoColor','category=','threeDReady:true'])
  assert.ok(!helper.includes(s),'flat lay helper must not infer/modify owner data');
});
test('bounded canvas analysis uses exact source image but cannot modify or retain input',()=>{
 const calls=[];
 const image={naturalWidth:800,naturalHeight:600};
 const globalDocument=globalThis.document;
 try{
  globalThis.document={createElement:tag=>{
   assert.equal(tag,'canvas');
   const obj={width:0,height:0,getContext:()=>({
    drawImage(...a){calls.push({size:[obj.width,obj.height],source:a[0]});},
    getImageData(){
     const image=photo(512,384);
     // Browser ImageData data/width/height are inherited read-only getters,
     // not enumerable own properties; a spread would silently drop them.
     return Object.create(null,{
      data:{get:()=>image.data},width:{get:()=>image.width},height:{get:()=>image.height}
     });
    }
   })};return obj;
  }};
  const r=detectFlatlayFromImage29(image);
  assert.equal(r.eligible,false,'blank uniform image is not evidence of clothing');
  assert.equal(r.reason,'foreground-coverage-unsafe','real ImageData getters must reach the image analyzer');
  assert.equal(r.boxes.length,0);
  assert.deepEqual(calls.map(x=>x.size),[[512,384]]);
  assert.equal(calls[0].source,image);
  assert.equal(image.naturalWidth,800);
 }finally{globalThis.document=globalDocument;}
});
