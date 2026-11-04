const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const Details=require('../public/clothing-details.js');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('function recognitionSourcePhoto(');
const end=source.indexOf('function cropClothingPhoto(',start);
assert.ok(start>0&&end>start,'Original-first editor helper and photo fields must exist');
function node(tag,label=null,cls=''){
 return {tag,className:cls,textContent:label||'',isConnected:true,children:[],
  append(...items){this.children.push(...items);},
  replaceChildren(...items){this.children=[...items];},
  setAttribute(k,v){this[k]=v;}};
}
function make(item){
 const checked=[],classified=[];
 const schema={types:{Tops:['T-shirt'],Shoes:['Sneakers'],Dresses:['Casual dress']},
  sleeve:['Unknown','Short sleeve','Long sleeve'],pattern:['Unknown','Solid'],fit:['Unknown','Regular'],
  seasons:['Summer','Winter']};
 const context={
  node,document:{createTextNode:s=>node('text',s)},
  categories:['Uncategorized','Tops','Dresses','Shoes'],clothingSchema:schema,items:[],
  normalizeClothing:x=>x,ClothingDetails:Details,localReady:true,
  async checkPhoto(image){checked.push(image);return {colorEstimate:{color:'Blue',source:'photo-estimate',support:.91}};},
  async localRequest(action,image,id,hint){classified.push({action,image,id,hint});
   return {strong:true,choices:[{category:'Tops',itemType:'T-shirt',label:'a T-shirt',sleeveLength:'Short sleeve'}],
    details:{color:'Blue',pattern:'Solid'}};},
  segmentationAllows:()=>true,
  applyLocalChoice(i,choice){i.category=choice.category;i.itemType=choice.itemType;},
  };
 // Same lightweight DOM structure as the edit card: no canvas, provider or
 // browser needed to exercise its actual initial check and button handler.
 context.field=(body,title,value,type='input')=>{
  const el=node(type,title);el.value=value||'';el.oninput=null;
  const parent=node('label',title);parent.append(el);body.append(parent);return el;
 };
 context.choice=(body,title,value,options)=>{
  const el=node('select',title);el.value=value;el.replaceChildren(...options.map(v=>node('option',v)));
  body.append(el);return el;
 };
 vm.createContext(context);
 vm.runInContext(source.slice(start,end),context);
 // The actual guarded photo-color helper is defined later in app.js.
 const colorStart=source.indexOf('function trustedAutomaticPhotoColor(');
 const colorEnd=source.indexOf('function queueAutomatic(',colorStart);
 assert.ok(colorStart>end&&colorEnd>colorStart);
 vm.runInContext(source.slice(colorStart,colorEnd),context);
 const original=structuredClone(item),body=node('form');
 context.clothingFields(body,item);
 function find(root,predicate){
  if(predicate(root))return root;
  for(const child of root.children){const found=find(child,predicate);if(found)return found;}
  return null;
 }
 const btn=find(body,n=>n.tag==='button'&&n.textContent==='Fill missing details from photo');
 assert.ok(btn,'Actual editor action is available');
 return {context,checked,classified,btn,item,original};
}
async function flush(){await new Promise(setImmediate);}
test('outfit color preview and Fill button use unmasked original RGB crop, not cleaned display or generated AI',async()=>{
 const h=make({id:'outfit',outfitSourceId:'captured-outfit',image:'display-mask-white-matte',
  recognitionPhoto:{image:'original-rgb-crop-before-matting'},
  originalPhoto:{image:'original-full-outfit'},
  normalizedPreview:{image:'AI-filled-prettified-image'},
  category:'Tops',itemType:'Unknown',color:'',seasons:[]});
 await flush(); // startup check must not infer garment color from room background
 assert.deepEqual(h.checked,['original-rgb-crop-before-matting']);
 assert.equal(h.item.color,'');
 await h.btn.onclick();
 assert.deepEqual(h.checked,['original-rgb-crop-before-matting','original-rgb-crop-before-matting']);
 assert.deepEqual(h.classified.map(x=>x.image),['original-rgb-crop-before-matting']);
 assert.equal(h.item.color,'Blue');assert.equal(h.item.itemType,'T-shirt');
 assert.equal(h.item.image,h.original.image);
 assert.equal(h.item.recognitionPhoto.image,h.original.recognitionPhoto.image);
 assert.equal(h.item.originalPhoto.image,h.original.originalPhoto.image);
 assert.equal(h.item.normalizedPreview.image,h.original.normalizedPreview.image);
});
test('single-garment source remains the original captured photo',async()=>{
 const h=make({id:'single',image:'uncropped-original-camera-rgb',
  normalizedPreview:{image:'AI-generated-clothing'},
  category:'Tops',itemType:'Unknown',color:'',seasons:[]});
 await flush();await h.btn.onclick();
 assert.deepEqual(h.checked,['uncropped-original-camera-rgb','uncropped-original-camera-rgb']);
 assert.equal(h.classified[0].image,'uncropped-original-camera-rgb');
 assert.equal(h.item.image,'uncropped-original-camera-rgb');
});
test('empty optional raw crop uses only source photo, not optional generated preview',()=>{
 const c={};vm.createContext(c);vm.runInContext(source.slice(start,source.indexOf('function clothingFields(',start)),c);
 assert.equal(c.recognitionSourcePhoto({image:'original',recognitionPhoto:{image:''},
  normalizedPreview:{image:'generated'}}),'original');
 assert.equal(c.recognitionSourcePhoto({image:'original',recognitionPhoto:{image:'rgb crop'},
  normalizedPreview:{image:'generated'}}),'rgb crop');
});
test('scanner and background review never read display cutout as their inference source',()=>{
 const scanner=source.slice(source.indexOf('async function recognizeItem('),source.indexOf('async function recognizeBatch('));
 assert.match(scanner,/const image=recognitionSourcePhoto\(item\)/);
 assert.match(scanner,/checkPhoto\(image\)/);
 assert.match(scanner,/localRequest\('classify',image/);
 const background=source.slice(source.indexOf('async function reviewRecognitionMemory('));
 assert.match(background,/image=recognitionSourcePhoto\(target\);if\(!image\)continue/);
 assert.match(background,/recognitionSourcePhoto\(current\)/);
 assert.match(background,/!recognitionSourcePhoto\(value\)/);
 assert.doesNotMatch(scanner,/(?:normalizedPreview|tryOnImage)/);
});

test('restored outfit without its raw crop cannot infer details from a display tile or whole scene',async()=>{
 for(const recognitionPhoto of [undefined,{image:''},{image:'   '},{image:42}]){
  const h=make({id:'restored',outfitSourceId:'outfit',image:'white-matted-display',
   recognitionPhoto,originalPhoto:{image:'whole-scene'},category:'Tops',
   itemType:'Unknown',color:'',seasons:[]});
  await flush();await h.btn.onclick();
  assert.deepEqual(h.checked,[]);assert.deepEqual(h.classified,[]);
  assert.equal(h.item.color,'');assert.equal(h.item.itemType,'Unknown');
  assert.equal(h.item.image,'white-matted-display');
  assert.equal(h.item.originalPhoto.image,'whole-scene');
 }
});
