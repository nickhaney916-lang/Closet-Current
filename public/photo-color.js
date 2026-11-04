'use strict';
(function(root){
 function family(r,g,b){const max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,delta=max-min,s=max?delta/max:0;if(max<.22)return 'Black';if(s<.13)return max>.84?'White':'Gray';let h=delta?max===r/255?60*((g-b)/255/delta%6):max===g/255?60*((b-r)/255/delta+2):60*((r-g)/255/delta+4):0;if(h<0)h+=360;if(h>=12&&h<=65&&s<.42&&max>=.55)return 'Beige';if(h>=8&&h<=60&&max<.62)return 'Brown';if(h<18||h>=345)return max>.75&&s<.55?'Pink':'Red';if(h<45)return 'Orange';if(h<70)return 'Yellow';if(h<175)return 'Green';if(h<250)return 'Blue';if(h<290)return 'Purple';return 'Pink';}
 function estimate(pixels,width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||pixels.length!==width*height*4)throw Error('Invalid color sample');const counts=new Map(),zones=Array.from({length:4},()=>new Map());let total=0;const left=Math.floor(width*.2),right=Math.ceil(width*.8),top=Math.floor(height*.2),bottom=Math.ceil(height*.8);for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const i=(y*width+x)*4;if(pixels[i+3]<250)continue;const color=family(pixels[i],pixels[i+1],pixels[i+2]),zone=(x<width/2?0:1)+(y<height/2?0:2);counts.set(color,(counts.get(color)||0)+1);zones[zone].set(color,(zones[zone].get(color)||0)+1);total++;}if(total<32)return null;const ranked=[...counts].sort((a,b)=>b[1]-a[1]),[color,n]=ranked[0],support=n/total;const agrees=zones.filter(z=>[...z].sort((a,b)=>b[1]-a[1])[0]?.[0]===color).length;
  // A whole-photo 16x16 canvas samples clothing AND background. Two real
    // browser engines previously disagreed on automatic acceptance of neutral
    // colors near the old 0.55 cut-off. Reserve automatic indexing for strong
    // evidence and route uncertain hues to existing manual review instead.
    // Neutral/earth colors are especially vulnerable to backgrounds, skin
    // and browser JPEG smoothing, so require near-uniform support.
    const neutral=['Black','White','Gray','Beige','Brown'].includes(color);
    const minimumSupport=neutral ? 0.90 : 0.78;
    if(support>=minimumSupport&&agrees>=3)return {color,source:'photo-estimate',support:+support.toFixed(3)};
  const chromatic=ranked.filter(([name,n])=>!['Black','White','Gray','Beige','Brown'].includes(name)&&n/total>=.12);if(chromatic.length>=2&&support<.55&&chromatic.reduce((sum,[,n])=>sum+n/total,0)>=.65)return {color:'Multicolor',source:'photo-estimate',support:+chromatic.reduce((sum,[,n])=>sum+n/total,0).toFixed(3)};return {color:support>=.6?color:'Multicolor',source:'photo-estimate',support:+support.toFixed(3),needsConfirmation:true};
 }

 // A smooth frame edge is evidence of background, never a garment mask.
 // Only discard matching pixels connected to the edge. Repeated garment
 // colors inside the frame are retained when separated from the boundary.
 function sceneSuggestion(pixels,width,height,baseline){
  if(!baseline||!pixels||!Number.isInteger(width)||!Number.isInteger(height)||
    width<8||height<8||width*height>4096||pixels.length!==width*height*4)return baseline;
  const edges=[
   Array.from({length:width},(_,x)=>x),
   Array.from({length:width},(_,x)=>(height-1)*width+x),
   Array.from({length:height},(_,y)=>y*width),
   Array.from({length:height},(_,y)=>y*width+width-1)
  ];
  const border=edges.flat().filter(i=>pixels[i*4+3]>=250);
  const near=(a,b)=>{
   a*=4;b*=4;
   return Math.abs(pixels[a]-pixels[b])<=30&&Math.abs(pixels[a+1]-pixels[b+1])<=30&&
    Math.abs(pixels[a+2]-pixels[b+2])<=30;
  };
  let backdrop=-1,best=0;
  for(let k=0;k<border.length;k+=4){
   const sample=border[k];
   const support=border.filter(i=>near(i,sample)).length;
   if(support>best){best=support;backdrop=sample;}
  }
  const removed=new Uint8Array(width*height),queue=[];
  if(best>=.55*edges.flat().length&&edges.filter(edge=>
    edge.filter(i=>pixels[i*4+3]>=250&&near(i,backdrop)).length>=.4*edge.length).length>=3){
   const add=i=>{
    if(!removed[i]&&pixels[i*4+3]>=250&&near(i,backdrop)){removed[i]=1;queue.push(i);}
   };
   border.forEach(add);
   for(let k=0;k<queue.length;k++){
    const i=queue[k],x=i%width;
    if(x>0)add(i-1);
    if(x+1<width)add(i+1);
    if(i>=width)add(i-width);
    if(i+width<removed.length)add(i+width);
   }
  }
  const counts=new Map();
  let remaining=0,excluded=0;
  for(let y=Math.floor(height*.2);y<Math.ceil(height*.8);y++){
   for(let x=Math.floor(width*.2);x<Math.ceil(width*.8);x++){
    const index=y*width+x,i=index*4;
    if(pixels[i+3]<250)continue;
    if(removed[index]){excluded++;continue;}
    const name=family(pixels[i],pixels[i+1],pixels[i+2]);
    counts.set(name,(counts.get(name)||0)+1);
    remaining++;
   }
  }
  if(remaining<32||remaining<.2*(remaining+excluded))return baseline;
  const [[color,top],[,second=0]=[]]=[...counts].sort((a,b)=>b[1]-a[1]);
  const hasBackdrop=excluded>=.12*(remaining+excluded);
  const support=top/remaining,lead=(top-second)/remaining;
  if(color===baseline.color||!hasBackdrop||support<.72||lead<.12||
    (baseline.color!=='Multicolor'&&baseline.needsConfirmation))return baseline;
  // Full-scene heuristics can improve a suggestion or retract a conflicting
  // auto-fill. They cannot establish new automatic acceptance.
  return {color,source:'photo-estimate',support:+support.toFixed(3),needsConfirmation:true};
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
 const api={family,estimate,sceneSuggestion,maskedPalette};root.PhotoColor=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
