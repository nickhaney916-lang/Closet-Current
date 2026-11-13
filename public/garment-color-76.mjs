// Parallel #76 research-only garment color evidence. No wardrobe writes or owner approval.
// Operates on original decoded pixels AND an externally supplied garment mask; never estimates a mask.
const MAX_MASK_AREA=512*512,MAX_IMAGE_EDGE=3072,MAX_SAMPLE=1024;
const HEX_SHA=/^[a-f0-9]{64}$/;
const round=x=>Math.round(x*1000)/1000;
export const COLOR76_FLAG='color76';

export function family76(r,g,b){
 if(![r,g,b].every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid color channel');
 const R=r/255,G=g/255,B=b/255,v=Math.max(R,G,B),lo=Math.min(R,G,B),d=v-lo,s=v?d/v:0;
 let h=0;
 if(d){if(v===R)h=60*((G-B)/d%6);else if(v===G)h=60*((B-R)/d+2);else h=60*((R-G)/d+4);if(h<0)h+=360;}
 // Retain near-black chroma: navy and dark denim must not turn black merely
 // because a dark RGB channel falls below the original fixed brightness cutoff.
 if(v<.105||(v<.245&&s<.25))return 'Black';
 const warm=r>b+13&&r>=g&&g>b+3&&h>=16&&h<=68;
 if(v>.82&&s<.12)return warm?'Beige':'White';
 if(s<.105)return v<.27?'Black':'Gray';
 if(warm&&s<.29&&v>=.58)return 'Beige';
 if(h>=12&&h<=65&&s<.44&&v>=.57)return 'Beige';
 if(h>=8&&h<=62&&v<.62)return 'Brown';
 if(s<.18)return 'Gray';
 if(h<18||h>=345)return v>.67&&s<.57?'Pink':'Red';
 if(h<46)return 'Orange';
 if(h<70)return 'Yellow';
 if(h<175)return 'Green';
 if(h<250)return 'Blue';
 if(h<290)return 'Purple';
 return 'Pink';
}

function validMap(image,map,group){
 if(!image||!map||!group||![3,4].includes(image.channels)||
 !Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||
 image.width<1||image.height<1||image.width>MAX_IMAGE_EDGE||image.height>MAX_IMAGE_EDGE||
 !image.data||image.data.length!==image.width*image.height*image.channels||
 !Number.isInteger(map.width)||!Number.isInteger(map.height)||map.width<1||map.height<1||
 map.width*map.height>MAX_MASK_AREA||!group.selected||
 group.selected.length!==map.width*map.height)throw Error('Invalid source image or garment mask');
}
function interior(selected,i,w,h){
 const x=i%w,y=Math.floor(i/w);
 return x>0&&y>0&&x<w-1&&y<h-1&&
 selected[i-1]&&selected[i+1]&&selected[i-w]&&selected[i+w];
}
export function sampleMask76(image,map,group){
 validMap(image,map,group);
 const {selected}=group,{width:w,height:h}=map;
 let foreground=0,inside=0;
 for(let i=0;i<selected.length;i++)if(selected[i]){foreground++;if(interior(selected,i,w,h))inside++;}
 // Erode anti-aliased boundary when sufficient interior remains. A too-thin
 // garment returns uncertain evidence, not invented replacement foreground.
 const useInterior=inside>=96;
 const eligible=useInterior?inside:foreground,count=Math.min(MAX_SAMPLE,eligible);
 const pixels=new Uint8ClampedArray(count*4);
 if(count){
  let ordinal=0,j=0;
  for(let i=0;i<selected.length&&j<count;i++){
   if(!selected[i]||(useInterior&&!interior(selected,i,w,h)))continue;
   const target=Math.floor((j+.5)*eligible/count);
   if(ordinal++!==target)continue;
   const x=Math.min(image.width-1,Math.floor(((i%w)+.5)*image.width/w));
   const y=Math.min(image.height-1,Math.floor((Math.floor(i/w)+.5)*image.height/h));
   const at=(y*image.width+x)*image.channels,offset=j*4;
   pixels[offset]=image.data[at];pixels[offset+1]=image.data[at+1];pixels[offset+2]=image.data[at+2];
   pixels[offset+3]=image.channels===4?image.data[at+3]:255;j++;
  }
 }
 return {pixels,width:count,height:1,foreground,maskFraction:round(foreground/selected.length),
  boundaryFraction:foreground?round((foreground-inside)/foreground):1,eroded:useInterior,
  clipped:group.clipped===true};
}
function validBinding(b){
 return !!b&&typeof b.ownerId==='string'&&b.ownerId.length>0&&b.ownerId.length<=128&&
 typeof b.requestId==='string'&&b.requestId.length>0&&b.requestId.length<=128&&
 HEX_SHA.test(b.sourceSha256||'')&&HEX_SHA.test(b.maskSha256||'');
}
export function proposalMatches76(proposal,current){
 return !!proposal&&validBinding(proposal)&&validBinding(current)&&
 ['ownerId','requestId','sourceSha256','maskSha256'].every(k=>proposal[k]===current[k]);
}
export function analyzeColor76(sample,binding){
 const receipt={method:'mask-aware-color-v1',source:'photo-pixel-research',status:'abstain',
  proposedPrimary:null,proposedSecondary:null,multicolor:false,pixelSupport:0,candidates:[],
  validPixels:0,sampleCount:0,maskFraction:round(sample?.maskFraction||0),
  boundaryFraction:round(sample?.boundaryFraction??1),reasons:[]};
 if(!validBinding(binding)){receipt.reasons.push('unbound_photo_or_owner');return receipt;}
 for(const k of ['ownerId','requestId','sourceSha256','maskSha256'])receipt[k]=binding[k];
 if(!sample||!sample.pixels||!Number.isInteger(sample.width)||!Number.isInteger(sample.height)||
 sample.width<=0||sample.height<=0||sample.width*sample.height>MAX_SAMPLE||
 sample.pixels.length!==sample.width*sample.height*4){
  receipt.reasons.push('invalid_pixel_sample');return receipt;
 }
 receipt.sampleCount=sample.width*sample.height;
 const counts=new Map(),rawCounts=new Map(),lightness=[];
 let valid=0,black=0,white=0;
 for(let i=0;i<sample.pixels.length;i+=4){
  const r=sample.pixels[i],g=sample.pixels[i+1],b=sample.pixels[i+2],a=sample.pixels[i+3];
  if(a<224)continue;
  const name=family76(r,g,b),v=Math.max(r,g,b)/255,s=v?(Math.max(r,g,b)-Math.min(r,g,b))/255/v:0;
  rawCounts.set(name,(rawCounts.get(name)||0)+1);lightness.push(v);
  if(v<.14&&s<.22)black++;
  if(v>.96&&s<.10)white++;
  valid++;
 }
 receipt.validPixels=valid;
 if(valid<80){receipt.reasons.push('insufficient_garment_pixels');return receipt;}
 if(sample.foreground!==undefined&&sample.foreground<80){receipt.reasons.push('tiny_mask');return receipt;}
 if(sample.maskFraction!==undefined&&sample.maskFraction<.003){receipt.reasons.push('sparse_mask');return receipt;}
 if(sample.boundaryFraction>.75){receipt.reasons.push('thin_or_unsafe_edges');return receipt;}
 if(sample.clipped)receipt.reasons.push('clipped_garment');
 // Minimize isolated black shadows and white specular glare without deleting
 // legitimate all-black or all-white garments: downweight only when each is a
 // small minority and there is an independent non-neutral majority.
 const attenuateDark=black/valid<.35&&black/valid>.02;
 const attenuateGlare=white/valid<.35&&white/valid>.02;
 let weight=0;
 for(let i=0;i<sample.pixels.length;i+=4){
  const r=sample.pixels[i],g=sample.pixels[i+1],b=sample.pixels[i+2],a=sample.pixels[i+3];
  if(a<224)continue;
  const name=family76(r,g,b),v=Math.max(r,g,b)/255,s=v?(Math.max(r,g,b)-Math.min(r,g,b))/255/v:0;
  let w=1;
  if(attenuateDark&&v<.14&&s<.22)w=.25;
  if(attenuateGlare&&v>.96&&s<.10)w=.25;
  counts.set(name,(counts.get(name)||0)+w);weight+=w;
 }
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 receipt.candidates=ranked.slice(0,4).map(([color,n])=>({color,share:round(n/weight)}));
 const first=ranked[0],second=ranked[1],share=first[1]/weight;
 receipt.pixelSupport=round(share);
 receipt.proposedPrimary=first[0];
 receipt.proposedSecondary=second&&second[1]/weight>=.18?second[0]:null;
 const two=!!second&&second[1]/weight>=.25;
 const chromatic=c=>!['Black','White','Gray','Beige','Brown'].includes(c);
 const meaningful=two&&(chromatic(first[0])||chromatic(second[0])||
   (new Set([first[0],second[0]]).has('Black')&&new Set([first[0],second[0]]).has('White')));
 receipt.multicolor=meaningful;
 if(meaningful)receipt.reasons.push('meaningful_second_color');
 if(attenuateDark||attenuateGlare)receipt.reasons.push('shadow_or_highlight_attenuation');
 if(share<.54)receipt.reasons.push('ambiguous_dominant_color');
 if(lightness.length){
  lightness.sort((a,b)=>a-b);
  if(lightness[Math.floor(.9*(valid-1))]-lightness[Math.floor(.1*(valid-1))]>.58)receipt.reasons.push('large_brightness_spread');
 }
 // Every result requires an owner decision. These are relative pixel supports,
 // NOT calibrated confidence scores or independent photographic accuracy.
 receipt.status='review';
 return receipt;
}
