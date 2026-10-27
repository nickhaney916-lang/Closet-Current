import {assert41HOLD,OUTPUT as PARENT} from './build-family-alpha-41-original-jpeg-hold.mjs';
import {readFile,writeFile,cp,rm,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
/** Offline only. Preserve every inherited source except exact private app and photo checker. */
export const OUTPUT='dist-family-alpha-42-photo-advice-HOLD';
const APP='app.js',CHECK='photo-check.js',MARKER='alpha42-photo-advice-HOLD-manifest.json';
const PARENT_SHA='c093dff392a6c1021f7cc072a37f6e106992c1e0';
const hash=t=>createHash('sha256').update(t).digest('hex');
function once(s,a,b){
 if(s.split(a).length!==2)throw Error('Reviewed source drift '+a.slice(0,80));
 return s.replace(a,b);
}
export function patchCheck(original,advice){
 if(!advice.startsWith('/** Work #39')||!advice.includes('function alphaCaptureAdvice('))
  throw Error('Untrusted or duplicate advisory function');
 const from=" const pixels=ctx.getImageData(0,0,16,16).data;return {...photoQuality(pixels),colorEstimate:window.PhotoColor?.estimate(pixels,16,16)||null,aspect:decoded.width/decoded.height};";
 const into=[
 " const pixels=ctx.getImageData(0,0,16,16).data;",
 " let captureAdvice=null;",
 " try{",
 "  const factor=Math.min(1,128/Math.max(decoded.width,decoded.height));",
 "  const sample=document.createElement('canvas');",
 "  sample.width=Math.max(3,Math.round(decoded.width*factor));",
 "  sample.height=Math.max(3,Math.round(decoded.height*factor));",
 "  const c=sample.getContext('2d',{willReadFrequently:true});",
 "  if(c){c.drawImage(decoded,0,0,sample.width,sample.height);",
 "   captureAdvice=alphaCaptureAdvice({width:decoded.width,height:decoded.height,",
 "    sampleWidth:sample.width,sampleHeight:sample.height,",
 "    rgba:c.getImageData(0,0,sample.width,sample.height).data});",
 "  }",
 " }catch{/* Optional advice cannot block recognition or source review. */}",
 " return {...photoQuality(pixels),colorEstimate:window.PhotoColor?.estimate(pixels,16,16)||null,",
 "  aspect:decoded.width/decoded.height,captureAdvice};"
 ].join('\n');
 return once(original,from,into)+'\n'+advice+'\n';
}
export function patchApp(original){
 let s=once(original,
  "const recognitionState={phase:'idle',percent:null,activeId:null};",
  [
   "const recognitionState={phase:'idle',percent:null,activeId:null};",
   "let photoAdvisories=new WeakMap();",
   "if(typeof window!=='undefined'&&window.addEventListener){",
   " window.addEventListener('closet:alpha-session-changed',()=>{photoAdvisories=new WeakMap();});",
   " window.addEventListener('pagehide',()=>{photoAdvisories=new WeakMap();});",
   "}"
  ].join('\n'));
 s=once(s,
  "  const adjust=node('button','Adjust','secondary');adjust.type='button';adjust.onclick=()=>adjustPhoto(item);body.append(adjust,cropButton(item));",
  [
   "  // Local optional advice never saves, rejects, uploads, or alters clothing.",
   "  const advisory=typeof photoAdvisories!=='undefined'?photoAdvisories.get(item):null;",
   "  if(!saved&&advisory?.source===(item.recognitionPhoto?.image||item.image)&&advisory.hint?.text){",
   "   body.append(node('p','Photo tip: '+advisory.hint.text,'fine capture-photo-advice'));",
   "   const retake=node('button','Take a clearer photo','secondary');retake.type='button';",
   "   retake.onclick=()=>switchView('scan'); // Existing photo remains available.",
   "   body.append(retake);",
   "  }",
   "  const adjust=node('button','Adjust','secondary');adjust.type='button';adjust.onclick=()=>adjustPhoto(item);body.append(adjust,cropButton(item));"
  ].join('\n'));
 s=once(s,
  "  const quality=await checkPhoto(item.recognitionPhoto?.image||item.image);\n  if(!batch.some(x=>x.id===item.id))return;",
  [
   "  const checkedOriginal=item.recognitionPhoto?.image||item.image;",
   "  const quality=await checkPhoto(checkedOriginal);",
   "  if(!batch.some(x=>x.id===item.id))return;",
   "  if(typeof photoAdvisories!=='undefined'&&checkedOriginal===(item.recognitionPhoto?.image||item.image)){",
   "   if(quality.captureAdvice?.hint)photoAdvisories.set(item,{source:checkedOriginal,hint:quality.captureAdvice.hint});",
   "   else photoAdvisories.delete(item);",
   "   render();",
   "  }"
  ].join('\n'));
 if(!s.includes('queueAutomatic(item);')||!s.includes('function captureTick(')||
    !s.includes('function takePhoto(')||!s.includes('async function recognizeItem('))
  throw Error('Recognized source or capture cadence was lost');
 return s;
}
async function files(dir,prefix=''){
 const out=[];
 for(const e of await readdir(dir,{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Symlink in private candidate');
  const name=prefix+e.name;
  if(e.isDirectory())out.push(...await files(join(dir,e.name),name+'/'));
  else if(e.isFile())out.push(name);
  else throw Error('Unsafe output type');
 }
 return out.sort();
}
async function expected(){
 const advice=await readFile('research/family-alpha-42/photo-advice-classic.js','utf8');
 return {
  [APP]:patchApp(await readFile(join(PARENT,APP),'utf8')),
  [CHECK]:patchCheck(await readFile(join(PARENT,CHECK),'utf8'),advice)
 };
}
export async function assert42HOLD(){
 await assert41HOLD();
 const [before,after,targets,raw]=await Promise.all([
  files(PARENT),files(OUTPUT),expected(),readFile(join(OUTPUT,MARKER),'utf8')
 ]);
 assert.deepEqual(after,[...before,MARKER].sort());
 const manifest=JSON.parse(raw);
 assert.equal(manifest.releaseGate,'HOLD');assert.equal(manifest.parentPin,PARENT_SHA);
 assert.equal(manifest.optionalAdviceOnly,true);
 for(const k of ['automaticPhotoDiscard','serverPhotoUpload','originalJpegModified',
  'stagingDeployed','ownerVisualApproved','physicalPhoneApproved'])
  assert.equal(manifest[k],false);
 for(const path of before){
  const actual=await readFile(join(OUTPUT,path));
  if(path===APP||path===CHECK){
   assert.equal(actual.toString('utf8'),targets[path]);
   assert.equal(manifest.overlays[path],hash(actual));
  }else assert.equal(hash(actual),hash(await readFile(join(PARENT,path))),
   'Unauthorized camera, wardrobe, JWT, source photo, mask or styling change '+path);
 }
 return manifest;
}
export async function build42HOLD(){
 await assert41HOLD();
 const targets=await expected();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 for(const [path,body]of Object.entries(targets))await writeFile(join(OUTPUT,path),body);
 const manifest={
  releaseGate:'HOLD',parentPin:PARENT_SHA,
  overlays:Object.fromEntries(Object.entries(targets).map(([p,v])=>[p,hash(v)])),
  optionalAdviceOnly:true,automaticPhotoDiscard:false,
  serverPhotoUpload:false,originalJpegModified:false,
  stagingDeployed:false,ownerVisualApproved:false,physicalPhoneApproved:false,
  autoCaptureCadenceUnchanged:true,recognitionUsesOriginalBeforeCutout:true
 };
 await writeFile(join(OUTPUT,MARKER),JSON.stringify(manifest,null,2)+'\n');
 return assert42HOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_42_ADVICE_HOLD',JSON.stringify(await build42HOLD()));
