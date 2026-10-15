'use strict';
(function(root){
 function family(r,g,b){const max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,delta=max-min,s=max?delta/max:0;if(max<.22)return 'Black';if(s<.13)return max>.84?'White':'Gray';let h=delta?max===r/255?60*((g-b)/255/delta%6):max===g/255?60*((b-r)/255/delta+2):60*((r-g)/255/delta+4):0;if(h<0)h+=360;if(h>=12&&h<=65&&s<.42&&max>=.55)return 'Beige';if(h>=8&&h<=60&&max<.62)return 'Brown';if(h<18||h>=345)return max>.75&&s<.55?'Pink':'Red';if(h<45)return 'Orange';if(h<70)return 'Yellow';if(h<175)return 'Green';if(h<250)return 'Blue';if(h<290)return 'Purple';return 'Pink';}
 function estimate(pixels,width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||pixels.length!==width*height*4)throw Error('Invalid color sample');const counts=new Map(),zones=Array.from({length:4},()=>new Map());let total=0;const left=Math.floor(width*.2),right=Math.ceil(width*.8),top=Math.floor(height*.2),bottom=Math.ceil(height*.8);for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const i=(y*width+x)*4;if(pixels[i+3]<250)continue;const color=family(pixels[i],pixels[i+1],pixels[i+2]),zone=(x<width/2?0:1)+(y<height/2?0:2);counts.set(color,(counts.get(color)||0)+1);zones[zone].set(color,(zones[zone].get(color)||0)+1);total++;}if(total<32)return null;const ranked=[...counts].sort((a,b)=>b[1]-a[1]),[color,n]=ranked[0],support=n/total;const agrees=zones.filter(z=>[...z].sort((a,b)=>b[1]-a[1])[0]?.[0]===color).length;
  if(support>=.55&&agrees>=3)return {color,source:'photo-estimate',support:+support.toFixed(3)};
  const chromatic=ranked.filter(([name,n])=>!['Black','White','Gray','Beige','Brown'].includes(name)&&n/total>=.12);if(chromatic.length>=2&&support<.55&&chromatic.reduce((sum,[,n])=>sum+n/total,0)>=.65)return {color:'Multicolor',source:'photo-estimate',support:+chromatic.reduce((sum,[,n])=>sum+n/total,0).toFixed(3)};return {color:support>=.6?color:'Multicolor',source:'photo-estimate',support:+support.toFixed(3),needsConfirmation:true};
 }

 // Mask-aware palette: ignore transparent background and low-alpha antialias edges.
 // Keep uncertain colors for review instead of silently assigning them.
 function maskedPalette(pixels,width,height,{minimumAlpha=224,minimumShare=.12}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||!pixels||pixels.length!==width*height*4)throw Error('Invalid masked color sample');
  const counts=new Map();let total=0;
  for(let i=0;i<pixels.length;i+=4){
   if(pixels[i+3]<minimumAlpha)continue;
   const name=family(pixels[i],pixels[i+1],pixels[i+2]);
   counts.set(name,(counts.get(name)||0)+1);total++;
  }
  if(total<32)return null;
  const ranked=[...counts].sort((a,b)=>b[1]-a[1]);
  const colors=ranked.filter(([,n])=>n/total>=minimumShare).map(([color,n])=>({color,share:+(n/total).toFixed(3)}));
  const primary=ranked[0][0],confidence=ranked[0][1]/total;
  return {primary,secondary:colors.find(x=>x.color!==primary)?.color||null,colors,coverage:+(total/(width*height)).toFixed(3),needsConfirmation:confidence<.6||total<100};
 }
 const api={family,estimate,maskedPalette};root.PhotoColor=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
