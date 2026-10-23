/**
 * Closet Current — synthetic research-only original-source color recovery.
 *
 * Recover dark/shadowed fabric COLOR only when original-source chromatic pixels
 * independently anchor the same hue. Never brighten, crop, replace, save or
 * mutate a customer's photograph. NOT wired into production/any paid model.
 * With no anchor, a dark hue remains uncertain instead of being fabricated.
 */
const FAMILIES=new Set(['Red','Orange','Yellow','Green','Blue','Purple','Pink','Brown','Beige','Black','White','Gray']);
const CHROMATIC=new Set(['Red','Orange','Yellow','Green','Blue','Purple','Pink']);
const clamp255=x=>Math.min(255,Math.max(0,Math.round(x)));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function reject(reason,coverage=0,raw=null){
 return {status:'review',reason,primary:null,secondary:null,color:'Unknown',indexingReady:false,
  needsConfirmation:true,coverage,baseline:raw,shadowRecoveredPixels:0,patternHint:'unverified'};
}
function validFrame({width,height,data,channels}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||
   ![3,4].includes(channels)||width*height>24_000_000||!data||
   data.length!==width*height*channels)throw Error('Invalid original photo pixel frame');
}
function dominant(counts){
 return [...counts].sort((a,b)=>b[1]-a[1])[0]||null;
}
function toRGBLabel(r,g,b,family){
 const max=Math.max(r,g,b),min=Math.min(r,g,b),diff=max-min,ratio=max?diff/max:0;
 const base=family(r,g,b);
 if(!FAMILIES.has(base))return {base,anchor:null,shadow:null,value:max,ratio};
 if(max>=80&&diff>=24&&ratio>=.37&&CHROMATIC.has(base))
  return {base,anchor:base,shadow:null,value:max,ratio};
 // Only use hue recovered by normalizing a dark chromatic source pixel.
 // Normalization does not change any actual image or color data.
 if(max<75&&max>=18&&diff>=13&&ratio>=.40){
  // Lift hue candidates above the existing palette's <.62 brown gate;
  // otherwise true orange/yellow shadows get wrongly normalized to Brown.
  const factor=210/max,recovered=family(clamp255(r*factor),clamp255(g*factor),clamp255(b*factor));
  if(CHROMATIC.has(recovered))return {base,anchor:null,shadow:recovered,value:max,ratio};
 }
 return {base,anchor:null,shadow:null,value:max,ratio};
}
export function evaluateOriginalRegionColor(frame,{
 family,baselinePalette=null,mask=null,sourceRole='original-instance',
 expectedSourceSHA=null,minimumAlpha=224,maxSamples=160_000
}={}){
 validFrame(frame);
 if(typeof family!=='function')throw Error('Existing shared photo-color family function is required');
 if(!['original-instance','original-whole'].includes(sourceRole))throw Error('Color sampling requires verified original-source role');
 if(expectedSourceSHA!==null&&!/^[a-f0-9]{64}$/.test(expectedSourceSHA))throw Error('Invalid original photo source version');
 if(!Number.isInteger(minimumAlpha)||minimumAlpha<180||minimumAlpha>255||
    !Number.isInteger(maxSamples)||maxSamples<512||maxSamples>500_000)throw Error('Invalid bounded color sampling configuration');
 if(mask!==null&&(!mask||mask.length!==frame.width*frame.height))throw Error('Invalid original instance mask');
 const total=frame.width*frame.height,stride=Math.max(1,Math.ceil(total/maxSamples));
 const baseCount=new Map(),anchorCount=new Map(),shadows=new Map(),neutralValue=[];
 let visible=0,seen=0,chromaticDark=0,neutralBright=0,neutralTotal=0;
 for(let offset=0;offset<total;offset+=stride){
  seen++;
  if(mask&&mask[offset]!==1)continue;
  const i=offset*frame.channels,alpha=frame.channels===4?frame.data[i+3]:255;
  if(alpha<minimumAlpha)continue;
  const r=frame.data[i],g=frame.data[i+1],b=frame.data[i+2];
  const {base,anchor,shadow,value,ratio}=toRGBLabel(r,g,b,family);
  if(!FAMILIES.has(base))continue;
  visible++;
  baseCount.set(base,(baseCount.get(base)||0)+1);
  if(anchor)anchorCount.set(anchor,(anchorCount.get(anchor)||0)+1);
  if(shadow){shadows.set(shadow,(shadows.get(shadow)||0)+1);chromaticDark++;}
  if(ratio<.14){neutralTotal++;neutralValue.push(value);if(value>=222)neutralBright++;}
 }
 const coverage=seen?visible/seen:0;
 const baseline=typeof baselinePalette==='function'?
   baselinePalette(frame,mask):null;
 if(visible<96||coverage<.08)return reject('insufficient-original-region-pixels',+coverage.toFixed(4),baseline);
 const votes=new Map(baseCount),foundAnchors=[...anchorCount].filter(([,n])=>n>=Math.max(12,Math.ceil(visible*.09)));
 let recovered=0;
 for(const [name,count] of shadows){
  if(foundAnchors.some(([color])=>color===name)){
   votes.set(name,(votes.get(name)||0)+count);
   const n=votes.get('Black')||0;
   votes.set('Black',Math.max(0,n-count));
   recovered+=count;
  }
 }
 // White fabric under grayscale shadow is distinguishable only if a substantial
 // original bright neutral anchor exists. Otherwise gray vs white is unresolved.
 const strongWhiteAnchor=neutralBright>=Math.max(16,visible*.24)&&
   neutralTotal/visible>=.85&&
   neutralValue.filter(v=>v>=67).length/Math.max(1,neutralValue.length)>=.95;
 let whiteRecovered=0;
 if(strongWhiteAnchor){
  whiteRecovered=votes.get('Gray')||0;
  votes.set('White',(votes.get('White')||0)+whiteRecovered);
  votes.set('Gray',0);
  recovered+=whiteRecovered;
 }
 const rows=[...votes].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 const [firstName,firstCount]=rows[0]||[],second=rows[1]||null;
 if(!firstName)return reject('no-color-evidence',+coverage.toFixed(4),baseline);
 const share=firstCount/visible,secondShare=second?second[1]/visible:0;
 // Completely shadowed chromatic fabric has no objective hue anchor.
 if((firstName==='Black'||firstName==='Gray')&&chromaticDark/visible>.48&&!foundAnchors.length)
  return reject('shadow-hue-unanchored',+coverage.toFixed(4),baseline);
 if((firstName==='Black'||firstName==='Gray')&&neutralBright/visible>.15&&!strongWhiteAnchor)
  return reject('neutral-lighting-ambiguous',+coverage.toFixed(4),baseline);
 const ambiguous=share<.58||secondShare>.34;
 if(ambiguous){
  // Multicolor is a valid recorded color, but requires a user-facing pattern/
  // color confirmation; never auto-label exact color or garment print.
  const multicolor=rows.filter(([,n])=>n/visible>=.17);
  if(multicolor.length>=2)return {
   status:'review',reason:'multiple-prominent-colors',primary:multicolor[0][0],
   secondary:multicolor[1][0],color:'Multicolor',indexingReady:false,
   needsConfirmation:true,coverage:+coverage.toFixed(4),baseline,
   shadowRecoveredPixels:recovered,patternHint:'multiple-colors-not-pattern-proof',
   colorShares:rows.slice(0,4).map(([color,n])=>({color,share:+(n/visible).toFixed(4)}))
  };
  return reject('weak-color-consensus',+coverage.toFixed(4),baseline);
 }
 // Guard against a few bright garment fragments painting a mostly black frame.
 if(recovered>0&&firstName!=='White'&&!foundAnchors.some(([name,n])=>name===firstName&&n>=Math.max(12,visible*.09)))
  return reject('insufficient-bright-hue-anchor',+coverage.toFixed(4),baseline);
 const result={
  status:'verified-color',reason:recovered?'shadow-corroborated':'original-color-consensus',
  primary:firstName,secondary:second&&secondShare>=.15?second[0]:null,
  color:firstName,indexingReady:true,needsConfirmation:false,
  coverage:+coverage.toFixed(4),support:+share.toFixed(4),sourceRole,
  shadowRecoveredPixels:recovered,whiteShadowRecoveredPixels:whiteRecovered,
  baseline,patternHint:second&&secondShare>=.15?'multiple-colors-not-pattern-proof':'no-pattern-inference'
 };
 if(expectedSourceSHA)result.sourceSHA=expectedSourceSHA;
 return result;
}
/**
 * A strict classification+color indexing boundary: secondary attributes are
 * optional, but every output has category, type and color; uncertain itemType
 * is explicitly "Unknown" and is NEVER an invented accurate subtype.
 */
export function composeOfflineGarmentIndex(classification,color,{sourceVersion=null,originalPhoto=null}={}){
 const type=classification?.choices?.[0]?.itemType,category=classification?.choices?.[0]?.category;
 const families=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
 const confirmed=classification?.strong===true||classification?.categoryConfirmed===true;
 if(!families.has(category)||!confirmed||!color||!color.indexingReady||
   typeof color.color!=='string'||!color.color||color.color==='Unknown')
  return {status:'review',category:'Uncategorized',itemType:'Unknown',
   color:color?.color||'Unknown',autoSave:false,reason:'core-identity-or-color-unverified'};
 const finalType=classification.strong===true&&typeof type==='string'&&type!=='Unknown'?type:'Unknown';
 return {status:finalType==='Unknown'?'category-color-only':'verified-core',
  category,itemType:finalType,color:color.color,colorSource:'original-photo-shadows-reviewed',
  indexingLevel:finalType==='Unknown'?'category-color':'specific-type',
  sourceVersion:sourceVersion&&/^[a-f0-9]{64}$/.test(sourceVersion)?sourceVersion:null,
  optionalAttributesDeferred:true,needsSubtypeReview:finalType==='Unknown',
  autoSave:false,originalPhoto:originalPhoto||null};
}
