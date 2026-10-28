/**
 * Local-only portable MANUAL fit recipe, never a cutout approval, image,
 * owner identity, account token, saved outfit or cloud backup.
 *
 * Binding is to the *exact decoded/reviewed PNG data URL* and size in the
 * currently active owner-scoped editing view. It does not authenticate a user:
 * the host must reject old sessions and require the usual source review.
 */
import {planGarmentFit} from './fit.mjs';
import {panelsFromSleeves,validateSleeveOutline} from '../work48/panel-geometry.mjs';

const FORMAT='closet-current-local-manual-fit-v1',LIMIT=9800;
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&
 Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
const FAIL='Fit recipe invalid or belongs to a different reviewed garment; keep current preview';
const fail=()=>{throw Error(FAIL);};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const unit=n=>finite(n)&&n>=0&&n<=1;
const hex=n=>typeof n==='string'&&/^[a-f0-9]{64}$/.test(n);
const SLOT=['top','bottom','dress','layer2','layer3','layer'];
const ADJUST=['dx','dy','scale','tilt','leftSleeve','rightSleeve','edgeCleanup','binaryEdgeReview'];
const META=['format','cutoutSHA256','width','height','slot','profile','adjust','traces','decision','ownerApproved','requiresReview'];
const normalizedSlot=s=>s.startsWith('layer')?'layer':s;
const normalizePoint=p=>{if(!Array.isArray(p)||p.length!==2||!p.every(unit))fail();return [...p];};
const normalizeTraces=t=>{
 if(!exact(t,[])&&!exact(t,['left'])&&!exact(t,['right'])&&!exact(t,['left','right']))fail();
 const result={};
 for(const side of ['left','right'])if(Object.hasOwn(t,side))result[side]=validateSleeveOutline(t[side]);
 return result;
};
function normalizeFit(record,slot,width,height){
 if(!exact(record,['profile','adjust','traces']))fail();
 const {profile,adjust,traces}=record;
 if(!exact(profile,['slot','anchors'])||profile.slot!==normalizedSlot(slot)||
    !Array.isArray(profile.anchors)||profile.anchors.length!==2)fail();
 const anchors=profile.anchors.map(normalizePoint);
 if(!exact(adjust,ADJUST)||!ADJUST.slice(0,6).every(k=>finite(adjust[k]))||
    typeof adjust.edgeCleanup!=='boolean'||typeof adjust.binaryEdgeReview!=='boolean'||
    (adjust.edgeCleanup&&adjust.binaryEdgeReview))fail();
 const t=normalizeTraces(traces);
 if((adjust.leftSleeve!==0&&!t.left)||(adjust.rightSleeve!==0&&!t.right))fail();
 const safeProfile={slot:profile.slot,anchors};
 if(Object.keys(t).length){
  safeProfile.panels=panelsFromSleeves(t);safeProfile.exclusivePanels=true;
 }
 const safeAdjust={...adjust};
 try{planGarmentFit(width,height,safeProfile,safeAdjust);}catch{fail();}
 return {profile:safeProfile,adjust:safeAdjust,traces:t};
}
async function fingerprint(source){
 if(!exact(source,['png','slot','width','height'])||
    typeof source.png!=='string'||!source.png.startsWith('data:image/png;base64,')||
    source.png.length<60||source.png.length>18000000||
    !SLOT.includes(source.slot)||
    !Number.isSafeInteger(source.width)||!Number.isSafeInteger(source.height)||
    source.width<16||source.height<16||source.width*source.height>8000000)fail();
 if(!globalThis.crypto?.subtle)throw Error('Secure local digest unavailable; fit not changed');
 const bytes=new TextEncoder().encode(source.png);
 const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 const cutoutSHA256=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 return {cutoutSHA256,width:source.width,height:source.height,slot:source.slot};
}
export async function createPortableFitRecipe(source,record){
 const binding=await fingerprint(source);
 if(!record||!record.profile||!record.adjust||typeof record.adjust!=='object'||
    Object.keys(record.adjust).some(k=>!ADJUST.includes(k)))fail();
 const defaults={dx:0,dy:0,scale:1,tilt:0,leftSleeve:0,rightSleeve:0,
  edgeCleanup:false,binaryEdgeReview:false};
 const safe=normalizeFit({
  profile:{slot:record.profile.slot,anchors:record.profile.anchors},
  adjust:{...defaults,...record.adjust},
  traces:record.traces||{}
 },binding.slot,binding.width,binding.height);
 const {profile,adjust,traces}=safe;
 const recipe={format:FORMAT,...binding,
  profile:{slot:profile.slot,anchors:profile.anchors},
  adjust,traces,decision:'HOLD',ownerApproved:false,requiresReview:true};
 if(JSON.stringify(recipe).length>LIMIT)fail();
 return recipe;
}
export async function restorePortableFitRecipe(source,json){
 if(typeof json!=='string'||json.length>LIMIT)fail();
 let raw;try{raw=JSON.parse(json);}catch{fail();}
 if(!exact(raw,META)||raw.format!==FORMAT||!hex(raw.cutoutSHA256)||
    raw.decision!=='HOLD'||raw.ownerApproved!==false||raw.requiresReview!==true)fail();
 const binding=await fingerprint(source);
 if(Object.keys(binding).some(k=>binding[k]!==raw[k]))fail();
 return normalizeFit({profile:raw.profile,adjust:raw.adjust,traces:raw.traces},
                     binding.slot,binding.width,binding.height);
}
