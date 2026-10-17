const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../public/photo-color.js');
function photo({width=64,height=64,background=[246,246,246],foreground=[20,54,181],box={left:16,top:9,right:48,bottom:55},paint=null}={}){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const garment=x>=box.left&&x<box.right&&y>=box.top&&y<box.bottom;
  const color=paint?paint(x,y,garment):garment?foreground:background;
  pixels.set([...color,255],(y*width+x)*4);
 }
 return pixels;
}
test('foreground extraction recognizes real garment color while preserving every source pixel',()=>{
 const rgba=photo(),copy=rgba.slice();
 const output=C.uniformLightBackgroundPalette(rgba,64,64);
 assert.equal(output?.color,'Blue');
 assert.equal(output.method,'uniform-light-background');
 assert.ok(output.support>=.74);
 assert.ok(output.foregroundCoverage>.3);
 assert.deepEqual(rgba,copy,'color detection must never erase or mutate original clothing');
});
test('different supported garment families on white backdrop are recognized without a review screen',()=>{
 for(const [rgb,name] of [[[245,90,15],'Orange'],[[22,140,40],'Green'],[[20,20,20],'Black'],[[235,20,40],'Red']]){
  const result=C.uniformLightBackgroundPalette(photo({foreground:rgb}),64,64);
  assert.equal(result?.color,name);
 }
});
test('busy, colored, dark, and patterned backgrounds cannot be treated as reliable garment outlines',()=>{
 const dark=photo({background:[68,68,68]});
 assert.equal(C.uniformLightBackgroundPalette(dark,64,64),null);
 const varied=photo({paint:(x,y,isGarment)=>isGarment?[10,30,160]:x<32?[248,248,248]:[205,205,205]});
 assert.equal(C.uniformLightBackgroundPalette(varied,64,64),null);
 const tinted=photo({background:[220,180,140]});
 assert.equal(C.uniformLightBackgroundPalette(tinted,64,64),null);
});
test('pale items without reliable contrast remain pending rather than guessed',()=>{
 const light=photo({foreground:[235,238,231]});
 assert.equal(C.uniformLightBackgroundPalette(light,64,64),null);
 const small=photo({box:{left:28,right:34,top:28,bottom:34}});
 assert.equal(C.uniformLightBackgroundPalette(small,64,64),null);
});
test('fragmented patterns, multi-colored clothes and bare mask edges do not produce forced color labels',()=>{
 const split=photo({paint:(x,y,garment)=>garment?(x<32?[20,50,190]:[200,30,30]):[246,246,246]});
 assert.equal(C.uniformLightBackgroundPalette(split,64,64),null);
 const stripes=photo({paint:(x,y,garment)=>garment?(y%2===0?[25,50,190]:[246,246,246]):[246,246,246]});
 assert.equal(C.uniformLightBackgroundPalette(stripes,64,64),null);
});
test('foreground helper rejects invalid dimensions and malformed RGBA data',()=>{
 assert.throws(()=>C.uniformLightBackgroundPalette([],64,64),/Invalid/);
 assert.throws(()=>C.uniformLightBackgroundPalette(new Uint8ClampedArray(16*16*4),16,16),/Invalid/);
});
test('single-item camera color check keeps confident legacy readings and only uses verified foreground when uncertain',async()=>{
 const source=fs.readFileSync('public/photo-check.js','utf8');
 async function classify(primary,foreground){
  let sizes=[];
  const context={
   Image:class{width=120;height=120;set src(v){this._src=v;}async decode(){}},
   document:{createElement(){return {set width(value){this._w=value;},get width(){return this._w;},set height(value){this._h=value;},get height(){return this._h;},getContext(){return {drawImage(){},getImageData(){return {data:new Uint8ClampedArray(thisSize()*thisSize()*4)};}};},getPixels(){}};}},
   window:{PhotoColor:{estimate(){return primary;},uniformLightBackgroundPalette(){return foreground;}}},
   setTimeout,clearTimeout
  };
  let sampleSize=16,reads=0;
  function thisSize(){return sampleSize;}
  context.document.createElement=()=>({
   set width(v){this.w=v;sampleSize=v;},get width(){return this.w;},
   set height(v){this.h=v;},get height(){return this.h;},
   getContext(){return {drawImage(){},getImageData(){reads++;sizes.push(thisSize());return {data:new Uint8ClampedArray(thisSize()*thisSize()*4)};}};}
  });
  vm.createContext(context);vm.runInContext(source,context);
  const value=await context.checkPhoto('data:image/jpeg;base64,AA==');
  return {value,sizes};
 }
 const confident=await classify({color:'Blue',support:.95},{color:'Red'});
 assert.equal(confident.value.colorEstimate.color,'Blue');
 assert.deepEqual(confident.sizes,[16],'no extra foreground processing on already-confident labels');
 const uncertain=await classify({color:'Multicolor',needsConfirmation:true},{color:'Green',method:'uniform-light-background'});
 assert.equal(uncertain.value.colorEstimate.color,'Green');
 assert.deepEqual(uncertain.sizes,[16,64]);
 const noEvidence=await classify({color:'Brown',needsConfirmation:true},null);
 assert.equal(noEvidence.value.colorEstimate.color,'Brown');
 assert.equal(noEvidence.value.colorEstimate.needsConfirmation,true);
});
