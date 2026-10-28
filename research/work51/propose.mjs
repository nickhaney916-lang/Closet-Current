/** Source-derived, review-only cleanup, using the unchanged portable recipe
 * operations. Never replace the source cutout or a user's existing edit history.
 * No model, network, storage, RGB recoloring, generated fabric or approval.
 */
import {applyMaskRefinement} from '../work49/refine-engine.mjs';
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
const inside=(x,y,p)=>{let on=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)on=!on;}return on;};
export function proposeIsolationCleanup(base,{category='Tops',existingEdits=[]}={}){
 const {width:w,height:h,rgba}=base||{},n=w*h;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<32||h<32||n>8e6||!(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray)||rgba.length!==n*4||!Array.isArray(existingEdits))throw Error('Invalid original cutout');
 const empty=reason=>({edits:[],reason,requiresHumanReview:true,autoAccepted:false,ownerApproved:false,canonicalBaseUnchanged:true});
 if(existingEdits.length)return empty('existing-corrections-preserved');
 if(!['Tops','Dresses','Outerwear'].includes(category))return empty('no-safe-support-evidence-for-category');
 let l=w,t=h,r=-1,b=-1,visible=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>=128){visible++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 if(visible<64||visible>n*.95)return empty('unisolated-or-empty-source');
 const bw=r-l+1,bh=b-t+1,samples=[[],[],[]];
 for(let y=Math.floor(t+bh*.36);y<t+bh*.76;y+=Math.max(1,Math.floor(h/180)))for(let x=Math.floor(l+bw*.28);x<l+bw*.72;x+=Math.max(1,Math.floor(w/180))){const i=(y*w+x)*4;if(rgba[i+3]>=128)for(let c=0;c<3;c++)samples[c].push(rgba[i+c]);}
 if(!samples[0].length)return empty('missing-core-evidence');const core=samples.map(median);
 // Warm neutral supports above strongly contrasting dark cloth only. Pale and
 // similarly colored clothing cannot be distinguished safely and is retained.
 if(Math.max(...core)>105)return empty('pale-or-similar-clothing-preserved');
 const color=i=>[rgba[i*4],rgba[i*4+1],rgba[i*4+2]],gap=c=>Math.max(...c.map((v,k)=>Math.abs(v-core[k])));
 const y0=Math.max(0,Math.floor(t-bh*.28)),y1=Math.min(h,Math.ceil(t+bh*.32)),x0=Math.max(0,l),x1=Math.min(w,r+1);
 const eligible=i=>{const c=color(i);return Math.min(...c)>=70&&Math.max(...c)<=248&&c[0]-c[1]>=2&&c[1]-c[2]>=2&&c[0]-c[2]<=65&&gap(c)>=80;};
 let firstDarkSourceY=-1;const runNeeded=Math.max(3,Math.round(bw*.006));
 for(let y=y0;y<y1&&firstDarkSourceY<0;y++){let run=0;for(let x=Math.floor(l+bw*.2);x<l+bw*.8;x++){run=gap(color(y*w+x))<=60?run+1:0;if(run>=runNeeded){firstDarkSourceY=y;break;}}}
 if(firstDarkSourceY<0)return empty('no-contrasting-source-boundary');
 const seen=new Uint8Array(n),queue=new Int32Array((x1-x0)*(y1-y0));let chosen=null;
 // Exterior source pixels remain available in RGBA even when alpha is zero.
 // Select a meaningful top/central SOURCE component, not arbitrary beige cloth.
 for(let y=y0;y<Math.min(y1,t+bh*.15);y+=3)for(let x=Math.floor(l+bw*.32);x<l+bw*.72;x+=3){const start=y*w+x;if(seen[start]||!eligible(start))continue;let head=0,tail=1;queue[0]=start;seen[start]=1;let left=w,right=-1,top=h,bottom=-1;
  while(head<tail){const i=queue[head++],xx=i%w,yy=Math.floor(i/w);left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);for(const [a,z]of [[xx-1,yy],[xx+1,yy],[xx,yy-1],[xx,yy+1]]){if(a<x0||a>=x1||z<y0||z>=y1)continue;const j=z*w+a;if(seen[j])continue;seen[j]=1;if(eligible(j))queue[tail++]=j;}}
  if(top>=firstDarkSourceY-Math.max(2,bh*.015)||tail<Math.max(32,visible*.001)||left<=x0||right>=x1-1||bottom>=y1-1||right-left>bw*.55)continue;
  if(!chosen||tail>chosen.count)chosen={pixels:queue.slice(0,tail),count:tail,left,right,top,bottom};
 }
 if(!chosen||chosen.right-chosen.left<bw*.08)return empty('no-distinct-source-support');
 const rows=new Map();for(const i of chosen.pixels){const y=Math.floor(i/w),x=i%w,p=rows.get(y)||[w,-1];p[0]=Math.min(p[0],x);p[1]=Math.max(p[1],x);rows.set(y,p);}
 // Trace dark cloth from the garment core, independently of support color.
 // This protects connected seams and silhouettes when support material has
 // dark weave/shadows. Only the original cutout supplies foreground seeds.
 const cloth=new Uint8Array(n),cq=new Int32Array(n);let ch=0,ct=0;
 const pushCloth=i=>{if(cloth[i]||rgba[i*4+3]===0||gap(color(i))>80)return;cloth[i]=1;cq[ct++]=i;};
 for(let y=Math.floor(t+bh*.35);y<t+bh*.8;y+=Math.max(1,Math.floor(h/100)))for(let x=l;x<=r;x+=Math.max(1,Math.floor(w/100)))pushCloth(y*w+x);
 while(ch<ct){const i=cq[ch++],x=i%w,y=Math.floor(i/w);if(x)pushCloth(i-1);if(x+1<w)pushCloth(i+1);if(y)pushCloth(i-w);if(y+1<h)pushCloth(i+w);}
 const edits=[];let planned=0;const changed=new Uint8Array(n);
 // Follow the source component's left/right contour with small polygons. Every
 // rasterized removal must pass the independent original-color safety gate.
 // Failed spans are subdivided, never stretched across uncertain cloth/trim.
 function span(first,last){if(edits.length>=32||first>last)return;const points=[],ys=[];const step=Math.max(1,Math.ceil((last-first+1)/9));for(let y=first;y<=last;y+=step)ys.push(y);if(ys.at(-1)!==last)ys.push(last);
  for(const y of ys){const row=rows.get(y);if(!row){if(first<last){const m=Math.floor((first+last)/2);span(first,m);span(m+1,last);}return;}points.push({x:row[0]/w,y:y/h});}
  const end=rows.get(last);points.push({x:end[0]/w,y:(last+1)/h},{x:(end[1]+1)/w,y:(last+1)/h});
  for(const y of [...ys].reverse()){const row=rows.get(y);points.push({x:(row[1]+1)/w,y:y/h});}
  let remove=0,unsafe=false;const pending=[];const minX=Math.max(0,Math.floor(Math.min(...points.map(p=>p.x))*w)),maxX=Math.min(w-1,Math.ceil(Math.max(...points.map(p=>p.x))*w));
  for(let y=first;y<=last;y++)for(let x=minX;x<=maxX;x++){const i=y*w+x;if(rgba[i*4+3]<128||changed[i]||!inside((x+.5)/w,(y+.5)/h,points))continue;const c=color(i);
   // Neutral highlights inside the support are allowed; white garment piping
   // is protected by proximity to dark cloth at the actual source boundary.
   if(cloth[i]||Math.max(...c)-Math.min(...c)>65)unsafe=true;
   const reach=Math.max(1,Math.round(Math.min(w,h)*.0015));
   if(c[0]-c[1]<2||c[1]-c[2]<2){for(const [dx,dy]of [[reach,0],[-reach,0],[0,reach],[0,-reach]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&cloth[yy*w+xx])unsafe=true;}}
   pending.push(i);remove++;
  }
  if(unsafe||planned+remove>visible*.12){if(last>first){const m=Math.floor((first+last)/2);span(first,m);span(m+1,last);}return;}
  if(remove<4)return;edits.push({action:'remove',kind:'polygon',points});planned+=remove;for(const i of pending)changed[i]=1;
 }
 const chunk=Math.max(6,Math.round(Math.min(w,h)*.025));for(let y=chosen.top;y<=chosen.bottom&&edits.length<32;y+=chunk)span(y,Math.min(chosen.bottom,y+chunk-1));
 if(!edits.length)return empty('support-boundary-uncertain');
 const replay=applyMaskRefinement(base,edits);if(replay.removedPixels!==planned)throw Error('Proposal replay mismatch');
 return {...empty('automatic-support-proposal-needs-review'),edits,metrics:{removedPixels:planned,visiblePixels:visible,sourceRGBChanged:0,garmentCore:core,supportSourcePixels:chosen.count,fullGarmentTruthAvailable:false,maskIoU:null,manualSeedPlacements:0}};
}
