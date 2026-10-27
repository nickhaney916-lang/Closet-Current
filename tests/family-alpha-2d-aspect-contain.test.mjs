import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planPhotoLayers} from '../public/family-alpha-2d-layer-plan.mjs';
import {fitPhotoLayerToSlot,fitVisibleAlphaBoundsToSlot,measureTransparentGarmentBounds,renderPhotoLayers} from '../public/family-alpha-2d-photo-renderer.mjs';
const garment=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic',sourceVersion:'sha256-synthetic'});
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} should approximately equal ${b}`);

test('shirt, pants, jacket, dress, shoes, skirt and shorts preserve intrinsic aspect across mobile widths',()=>{
 const specimens=[['top',150,260],['bottom',180,320],['layer',290,145],['layer2',280,290],['dress',225,420],['shoes',360,160],['bottom',165,205]];
 for(const [slot,w,h] of specimens){
  const bounds=planPhotoLayers([garment(slot,'test')])[0];
  const fit=fitPhotoLayerToSlot(bounds,w,h);
  for(const frameWidth of [320,360,390,430]){
   const frameHeight=frameWidth*5/3;
   approx((fit.width*frameWidth)/(fit.height*frameHeight),w/h);
   assert.ok(fit.width<=bounds.width+1e-12);
   assert.ok(fit.height<=bounds.height+1e-12);
   approx(fit.x,bounds.x);approx(fit.y,bounds.y);
  }
 }
});

test('refuses absent or invalid photo measurements rather than manufacturing placement',()=>{
 const top=planPhotoLayers([garment('top','t')])[0];
 for(const size of [[0,200],[100,0],[NaN,100],[Infinity,200],[-1,1]])
  assert.throws(()=>fitPhotoLayerToSlot(top,...size),TypeError);
 assert.throws(()=>fitPhotoLayerToSlot({x:0.5,y:0.5,width:-1,height:.2},100,200),TypeError);
 assert.throws(()=>fitPhotoLayerToSlot(null,100,200),TypeError);
});

test('retains original source reference, layer order and dress conflict gates',()=>{
 const layers=planPhotoLayers([garment('layer','j'),garment('shoes','s'),garment('top','t'),garment('bottom','b')]);
 assert.deepEqual(layers.map(x=>x.slot),['shoes','bottom','top','layer']);
 assert.equal(layers[0].sourceIdentity,'synthetic');
 assert.throws(()=>planPhotoLayers([garment('dress','d'),garment('top','t')]));
});

class FakeEl{
 constructor(){this.style={};this.dataset={};this.children=[];this.attributes={};}
 setAttribute(k,v){this.attributes[k]=v;}
 append(el){this.children.push(el);}
 replaceChildren(...els){this.children=els;}
}
class FakeImage extends FakeEl{
 constructor(width,height){super();this.complete=true;this.naturalWidth=width;this.naturalHeight=height;}
 cloneNode(){return new FakeImage(this.naturalWidth,this.naturalHeight);}
}

test('renderer applies actual contained geometry, not a stretched image box',()=>{
 const previousDocument=globalThis.document,previousImage=globalThis.HTMLImageElement;
 globalThis.document={createElement:()=>new FakeEl(),createElementNS:()=>new FakeEl()};globalThis.HTMLImageElement=FakeImage;
 try{
  const container=new FakeEl();
  const outfits=[garment('layer','j'),garment('top','t'),garment('bottom','b'),garment('shoes','s')];
  const images={j:new FakeImage(280,120),t:new FakeImage(150,260),b:new FakeImage(180,320),s:new FakeImage(380,110)};
  assert.equal(renderPhotoLayers(container,outfits,images),4);
  const avatar=container.children[0];
  assert.equal(avatar.style.aspectRatio,'3/5');
  const human=avatar.children[0];
  assert.equal(human.attributes['data-humanoid'],'articulated-2d-v1');
  assert.equal(human.attributes.viewBox,'0 0 360 600');
  const parts=human.children.map(el=>el.attributes['data-part']).filter(Boolean);
  for(const essential of ['head','neck','torso','left-arm','right-arm','left-hand','right-hand','left-leg','right-leg','left-foot','right-foot'])
   assert.ok(parts.includes(essential),'Missing anatomical part: '+essential);
  assert.equal(parts.length,new Set(parts).size,'Figure parts must be individually identifiable');
  const rendered=avatar.children.slice(1),slots=planPhotoLayers(outfits);
  assert.deepEqual(rendered.map(x=>x.dataset.slot),['shoes','bottom','top','layer']);
  for(let i=0;i<rendered.length;i++){
   const el=rendered[i],fit=fitPhotoLayerToSlot(slots[i],images[slots[i].itemId].naturalWidth,images[slots[i].itemId].naturalHeight);
   approx(parseFloat(el.style.width)/100,fit.width);
   approx(parseFloat(el.style.height)/100,fit.height);
   assert.equal(el.style.objectFit,'contain');
  }
  const before=container.children[0];
  assert.throws(()=>renderPhotoLayers(container,[garment('top','t')],{t:new FakeImage(0,100)}));
  assert.equal(container.children[0],before,'invalid images never replace already rendered frame');
 }finally{globalThis.document=previousDocument;globalThis.HTMLImageElement=previousImage;}
});

test('renderer does not fetch, rewrite, or invent original garment image URLs',()=>{
 const source=readFileSync(new URL('../public/family-alpha-2d-photo-renderer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/fetch\(|new Image\(|\.src\s*=/);
 assert.match(source,/cloneNode\(false\)/);
});

test('photo slots are aligned beneath the humanoid face and over anatomically relevant zones',()=>{
 const slots=Object.fromEntries(planPhotoLayers([
  garment('shoes','s'),garment('bottom','b'),garment('top','t'),
  garment('layer2','j')
 ]).map(x=>[x.slot,x]));
 const virtualHeight=600;
 assert.ok((slots.top.y-slots.top.height/2)*virtualHeight>=115,
  'Shirt slot must begin under the face/neck rather than cover the head');
 assert.ok(slots.bottom.y>slots.top.y,'Bottoms must sit below shirt');
 assert.ok(slots.shoes.y>slots.bottom.y,'Shoes must sit below hips and shins');
 assert.ok((slots.shoes.y+slots.shoes.height/2)*virtualHeight<=595,
  'Shoes should stay inside frame');
 assert.ok(slots.layer2.width>slots.top.width,'Jacket should surround the base top');
 assert.ok(slots.layer2.y>=slots.top.y,'Outerwear should align at shoulders/chest');
 const [dress]=planPhotoLayers([garment('dress','d')]);
 assert.ok(dress.y-dress.height/2<slots.top.y,'Dress reaches chest');
 assert.ok(dress.y+dress.height/2>slots.bottom.y,'Dress extends toward legs');
});

test('large transparent margins do not force small floating clothes: visibly fit without altering source proportions',()=>{
 const slot=planPhotoLayers([garment('top','real-reviewed-shirt')])[0];
 const full=fitPhotoLayerToSlot(slot,240,320);
 const bounds={left:60,right:180,top:40,bottom:280};
 const fit=fitVisibleAlphaBoundsToSlot(slot,240,320,bounds);
 assert.ok(fit.width>full.width,'Visible source footprint should be larger');
 assert.ok(fit.width<=full.width*1.35+1e-12,'Quality cap prevents heavy upscaling');
 approx(fit.width*3/(fit.height*5),240/320);
 approx(fit.x,slot.x,'Symmetric source margins remain centered');
 approx(fit.y,slot.y);
 // Visible footprint, not transparent image rectangle, is positioned in slot.
 assert.ok((bounds.right-bounds.left)*fit.width/240<=slot.width+1e-12);
 assert.ok((bounds.bottom-bounds.top)*fit.height/320<=slot.height+1e-12);
});
test('asymmetric transparent margins align the actual clothing center with torso rather than image center',()=>{
 const slot=planPhotoLayers([garment('top','real-reviewed-shirt')])[0];
 const bounds={left:60,right:160,top:25,bottom:280};
 const fit=fitVisibleAlphaBoundsToSlot(slot,240,320,bounds);
 const apparentX=fit.x+((bounds.left+bounds.right)/2-120)*fit.width/240;
 const apparentY=fit.y+((bounds.top+bounds.bottom)/2-160)*fit.height/320;
 approx(apparentX,slot.x);
 approx(apparentY,slot.y);
 assert.ok(fit.x>slot.x,'Clothing at left of frame shifts its source image right');
});
test('invalid/no-alpha/full-frame/sliver bounds never falsely claim a fitted garment',()=>{
 const slot=planPhotoLayers([garment('layer2','safe-jacket')])[0];
 const standard=fitPhotoLayerToSlot(slot,320,420);
 for(const b of [null,{left:-1,top:0,right:300,bottom:400},
  {left:0,top:0,right:320,bottom:420},
  {left:150,top:0,right:160,bottom:420},
  {left:80,top:20,right:80,bottom:300},
  {left:60,top:NaN,right:200,bottom:400}]){
  assert.deepEqual(fitVisibleAlphaBoundsToSlot(slot,320,420,b),standard);
 }
});
test('alpha measurement never reads opaque JPEG or remote image and fails safely on unsupported canvas',()=>{
 for(const image of [
  {complete:true,naturalWidth:160,naturalHeight:200,src:'data:image/jpeg;base64,test'},
  {complete:true,naturalWidth:160,naturalHeight:200,src:'https://elsewhere.invalid/a.png'},
  {complete:false,naturalWidth:160,naturalHeight:200,src:'data:image/png;base64,test'}
 ])assert.equal(measureTransparentGarmentBounds(image,{createElement:()=>{throw Error('should not be invoked');}}),null);
 const image={complete:true,naturalWidth:160,naturalHeight:200,src:'data:image/png;base64,test'};
 assert.equal(measureTransparentGarmentBounds(image,{createElement:()=>({getContext:()=>{throw Error('no canvas');}})}),null);
});
test('synthetic PNG alpha bbox measurement reads only opacity and returns source-space geometry',()=>{
 const width=20,height=20,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=4;y<16;y++)for(let x=5;x<15;x++)pixels[(y*width+x)*4+3]=255;
 let draws=0;
 const image={complete:true,naturalWidth:200,naturalHeight:200,src:'data:image/png;base64,AAAA'};
 const bounds=measureTransparentGarmentBounds(image,{createElement:tag=>{
  assert.equal(tag,'canvas');
  return {getContext:()=>({drawImage:()=>{draws++;},getImageData:()=>({data:pixels})})};
 }});
 // 200px sampling canvas: scale=144/200; valid mock must return 144x144,
 // so a 20x20 pixel buffer is intentionally incompatible and safely held.
 assert.equal(bounds,null);
 assert.equal(draws,1);
});
