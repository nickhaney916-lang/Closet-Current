/**
 * Portable, manually downloaded edit RECIPE only. No image bytes, filenames,
 * account identifiers, localStorage, IndexedDB, or network. Never grants review.
 *
 * Each recipe is bound to EXACT current original JPEG + reviewed source RGBA.
 * This does not authenticate a user: the host must still require active owner
 * session, source permission and explicit manual confirmation before saving.
 */
const FORMAT='closet-current-local-cutout-edits-v1';
const ACTIONS=new Set(['remove','restore','add','soften','connected']);
const exact=(v,fields)=>v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&
 fields.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>fields.includes(k));
const unit=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1;
const plainNumber=n=>typeof n==='number'&&Number.isFinite(n);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const fail=()=>{throw Error('Cutout edit recipe invalid or belongs to a different source; keep original photo and review again');};

export function normalizeCutoutEdits(edits){
 if(!Array.isArray(edits)||edits.length>40)fail();
 return edits.map(e=>{
  if(!e||typeof e!=='object'||!ACTIONS.has(e.action))fail();
  if(e.kind==='polygon'){
   if(!exact(e,['action','kind','points'])||
      !['remove','restore','add','soften'].includes(e.action)||
      !Array.isArray(e.points)||e.points.length<3||e.points.length>24)fail();
   return {action:e.action,kind:'polygon',points:e.points.map(p=>{
    if(!exact(p,['x','y'])||!unit(p.x)||!unit(p.y))fail();
    return {x:p.x,y:p.y};
   })};
  }
  const keys=e.action==='connected'?['action','x','y','radius','tolerance']:['action','x','y','radius'];
  if(!exact(e,keys)||!unit(e.x)||!unit(e.y)||
     !plainNumber(e.radius)||e.radius<.002||e.radius>.12)fail();
  if(e.action==='connected'&&(!plainNumber(e.tolerance)||e.tolerance<0||e.tolerance>24))fail();
  return e.action==='connected'
   ?{action:e.action,x:e.x,y:e.y,radius:e.radius,tolerance:e.tolerance}
   :{action:e.action,x:e.x,y:e.y,radius:e.radius};
 });
}
const digest=async(bytes)=>{
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw Error('Secure local digest not available; keep existing cutout');
 const data=await subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(data),b=>b.toString(16).padStart(2,'0')).join('');
};
async function binding({originalImage,maskFrame,category}){
 if(typeof originalImage!=='string'||!originalImage.startsWith('data:image/jpeg;base64,')||
    originalImage.length>18_000_000||originalImage.length<40||
    typeof category!=='string'||!/^[A-Za-z][A-Za-z ]{0,39}$/.test(category)||
    !Number.isSafeInteger(maskFrame?.width)||!Number.isSafeInteger(maskFrame?.height)||
    maskFrame.width<32||maskFrame.height<32||
    maskFrame.width*maskFrame.height>8_000_000||
    !(maskFrame.rgba instanceof Uint8Array||maskFrame.rgba instanceof Uint8ClampedArray)||
    maskFrame.rgba.length!==maskFrame.width*maskFrame.height*4)fail();
 const encoded=new TextEncoder().encode(originalImage);
 const [originalSHA256,maskSHA256]=await Promise.all([
  digest(encoded),digest(new Uint8Array(maskFrame.rgba.buffer,maskFrame.rgba.byteOffset,maskFrame.rgba.byteLength))
 ]);
 return {originalSHA256,maskSHA256,width:maskFrame.width,height:maskFrame.height,category};
}
export async function createPortableCutoutEditRecipe(source,edits){
 const safe=normalizeCutoutEdits(edits);
 const b=await binding(source);
 const recipe={format:FORMAT,...b,edits:safe,decision:'HOLD',ownerApproved:false,requiresReview:true};
 if(JSON.stringify(recipe).length>16000)fail();
 return recipe;
}
export async function restorePortableCutoutEditRecipe(source,json){
 if(typeof json!=='string'||json.length>16000)fail();
 let recipe;try{recipe=JSON.parse(json);}catch{fail();}
 const keys=['format','originalSHA256','maskSHA256','width','height','category','edits','decision','ownerApproved','requiresReview'];
 if(!exact(recipe,keys)||recipe.format!==FORMAT||!hex(recipe.originalSHA256)||!hex(recipe.maskSHA256)||
    recipe.decision!=='HOLD'||recipe.ownerApproved!==false||recipe.requiresReview!==true)fail();
 const b=await binding(source);
 if(Object.keys(b).some(k=>recipe[k]!==b[k]))fail();
 return normalizeCutoutEdits(recipe.edits);
}
