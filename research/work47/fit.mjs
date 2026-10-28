import {inPiece,sourceAssignment} from '../work48/panel-geometry.mjs';
import {attenuateReviewedFringeAlpha} from './edge-fringe.mjs';
import {inspectReviewedCutoutAlpha,requireIsolatedCutoutForPreview} from './cutout-integrity.mjs';
/** Offline fitting of actual source pixels. No mask creation, owner approval,
 * storage, requests or fabric synthesis. Callers must verify their source. */
export const BODY=Object.freeze({shoulders:[[115,145],[245,145]],waist:[[142,286],[218,286]]});
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function similarity(source,target){
 if(!Array.isArray(source)||!Array.isArray(target)||source.length!==2||target.length!==2||![...source,...target].every(point))throw Error('Two source and body anchors required');
 const [a,b]=source,[u,v]=target,dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
 if(d<16)throw Error('Anchor pair is too small');
 const A=((v[0]-u[0])*dx+(v[1]-u[1])*dy)/d,B=((v[1]-u[1])*dx-(v[0]-u[0])*dy)/d;
 return [A,B,-B,A,u[0]-A*a[0]+B*a[1],u[1]-B*a[0]-A*a[1]];
}
export const mapPoint=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function rotationAt(m,p,degrees){
 if(!Number.isFinite(degrees)||Math.abs(degrees)>35)throw Error('Sleeve rotation exceeds review limit');
 const [x,y]=mapPoint(m,p),c=Math.cos(degrees*Math.PI/180),s=Math.sin(degrees*Math.PI/180);
 return [c*m[0]-s*m[1],s*m[0]+c*m[1],c*m[2]-s*m[3],s*m[2]+c*m[3],x+c*(m[4]-x)-s*(m[5]-y),y+s*(m[4]-x)+c*(m[5]-y)];
}
export function planGarmentFit(width,height,profile,adjust={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<16||height<16||width*height>8e6)throw Error('Invalid source size');
 if(!profile||!['top','layer','bottom','dress'].includes(profile.slot)||!Array.isArray(profile.anchors)||profile.anchors.length!==2||!profile.anchors.every(p=>point(p)&&p.every(n=>n>=0&&n<=1)))throw Error('Reviewed source landmarks required');
 const {dx=0,dy=0,scale=1,tilt=0,leftSleeve=0,rightSleeve=0}=adjust;
 if(![tilt,leftSleeve,rightSleeve].every(Number.isFinite)||Math.abs(tilt)>8||Math.abs(leftSleeve)>25||Math.abs(rightSleeve)>25)throw Error('Sleeve or shoulder angle exceeds review limit');
 if(![dx,dy,scale].every(Number.isFinite)||Math.abs(dx)>30||Math.abs(dy)>48||scale<.8||scale>1.2)throw Error('Unsafe fit adjustment');
 const base=profile.target||(profile.slot==='bottom'?BODY.waist:BODY.shoulders);
 if(!Array.isArray(base)||base.length!==2||!base.every(p=>point(p)&&p[0]>=80&&p[0]<=280&&p[1]>=120&&p[1]<=340))throw Error('Invalid body target');
 const target=base.map(([x,y])=>[180+(x-180)*scale+dx,base[0][1]+(y-base[0][1])*scale+dy]);
 const src=profile.anchors.map(([x,y])=>[x*width,y*height]);
 let m=similarity(src,target);
 if(tilt)m=rotationAt(m,[(src[0][0]+src[1][0])/2,(src[0][1]+src[1][1])/2],tilt);
 const angle=Math.atan2(m[1],m[0]);if(Math.abs(angle)>Math.PI/6)throw Error('Source pose is not front facing');
 const panels=profile.panels||[{polygon:[[0,0],[1,0],[1,1],[0,1]]}];
 if(!panels.length||panels.length>4)throw Error('Invalid panel count');
 const pieces=panels.map(p=>{
  if(!p||!Array.isArray(p.polygon)||p.polygon.length<3||p.polygon.length>32||!p.polygon.every(v=>point(v)&&v.every(n=>n>=0&&n<=1)))throw Error('Invalid garment panel');
  const delta=p.side==='left'?leftSleeve:p.side==='right'?rightSleeve:0;
  const degrees=(p.rotate||0)+delta;
  if(degrees&&(!point(p.pivot)||!p.pivot.every(n=>n>=0&&n<=1)))throw Error('Reviewed sleeve pivot required');
  const convert=poly=>{if(!Array.isArray(poly)||poly.length<3||poly.length>32||!poly.every(v=>point(v)&&v.every(n=>n>=0&&n<=1)))throw Error('Invalid source exclusion');return poly.map(([x,y])=>[x*width,y*height]);};
  if(p.exclude&&(!Array.isArray(p.exclude)||p.exclude.length>2))throw Error('Invalid source exclusions');
  const matrix=degrees?rotationAt(m,[p.pivot[0]*width,p.pivot[1]*height],degrees):m;
  return {matrix,polygon:convert(p.polygon),exclude:(p.exclude||[]).map(convert),side:p.side,body:p.body===true,pivot:p.pivot?.map((v,i)=>v*(i?height:width)),underarm:p.underarm?.map((v,i)=>v*(i?height:width))};
 });
 return {pieces,source:src,target,exclusivePanels:profile.exclusivePanels===true,sourceRGBModified:false,mode:pieces.length>1?'rigid-panels':'rigid-anchors'};
}
// Guard against a plausible but blank or severely truncated garment fit.
// Only alpha pixel occupancy is checked. This cannot grade visual realism.
const insidePanel=(x,y,poly)=>{
 let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [a,b]=poly[i],[c,d]=poly[j];
  if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;
 }
 return yes;
};
export function measureVisiblePanelCoverage(pixels,sampleWidth,sampleHeight,plan,sourceWidth,sourceHeight){
 if(!ArrayBuffer.isView(pixels)||!Number.isSafeInteger(sampleWidth)||!Number.isSafeInteger(sampleHeight)||
    sampleWidth<1||sampleHeight<1||pixels.length!==sampleWidth*sampleHeight*4||
    !Number.isSafeInteger(sourceWidth)||!Number.isSafeInteger(sourceHeight)||
    sourceWidth<16||sourceHeight<16||!Array.isArray(plan?.pieces)||!plan.pieces.length)
  throw Error('Invalid alpha coverage evidence');
 let opaque=0,retained=0;
 for(let y=0;y<sampleHeight;y++)for(let x=0;x<sampleWidth;x++){
  if(pixels[(y*sampleWidth+x)*4+3]<128)continue;
  opaque++;
  const sourcePixel=[(x+.5)*sourceWidth/sampleWidth,(y+.5)*sourceHeight/sampleHeight];
  let included=false;
  for(const piece of plan.pieces){
   if(!inPiece(sourcePixel,piece))continue;
   included=true;
   const [u,v]=mapPoint(piece.matrix,sourcePixel);
   if(u<0||u>360||v<0||v>600)
    throw Error('Fit would crop visible garment; adjust landmarks or reduce size');
  }
  if(included)retained++;
 }
 return {opaque,retained,ratio:opaque?retained/opaque:0};
}
export function requireVisiblePanelCoverage(coverage){
 if(!coverage||!Number.isSafeInteger(coverage.opaque)||!Number.isSafeInteger(coverage.retained)||
    coverage.opaque<32||coverage.retained<32||
    !Number.isFinite(coverage.ratio)||coverage.ratio<0.60||
    coverage.retained>coverage.opaque)
  throw Error('Reviewed garment panels discard too many visible pixels; use original-photo fallback and recheck cutout');
 return coverage;
}
export function paintGarmentFit(canvas,image,profile,adjust={}){
 if(typeof adjust.edgeCleanup!=='undefined'&&typeof adjust.edgeCleanup!=='boolean')
  throw Error('Edge cleanup must be an explicit boolean');
 const plan=planGarmentFit(image.naturalWidth,image.naturalHeight,profile,adjust);
 // Refuse fitting that would silently crop visible garment fabric. Sample only
 // for this guard; the actual garment is drawn from the native source image.
 const sample=canvas.ownerDocument.createElement('canvas');
 const ratio=Math.min(1,240/Math.max(image.naturalWidth,image.naturalHeight));
 sample.width=Math.ceil(image.naturalWidth*ratio);sample.height=Math.ceil(image.naturalHeight*ratio);
 const probe=sample.getContext('2d',{willReadFrequently:true});probe.drawImage(image,0,0,sample.width,sample.height);
 const pixels=probe.getImageData(0,0,sample.width,sample.height).data;
 const cutoutIntegrity=requireIsolatedCutoutForPreview(inspectReviewedCutoutAlpha(pixels,sample.width,sample.height));
 const coverage=requireVisiblePanelCoverage(measureVisiblePanelCoverage(pixels,sample.width,sample.height,plan,image.naturalWidth,image.naturalHeight));
 const assignment=sourceAssignment(pixels,sample.width,sample.height,plan,image.naturalWidth,image.naturalHeight);
 if(plan.exclusivePanels&&(assignment.coveredRatio<.995||assignment.duplicateRatio>.003))throw Error('Sleeve outlines overlap or leave fabric unassigned; reset and recheck the source');
 let drawable=image;
 let fringe={changed:0,eligible:0,mode:'off',ownerApproved:false};
 if(adjust.edgeCleanup===true){
  // Prepare a separate, temporary display derivative, never change the
  // decoded original, the user's JPEG, the reviewed mask, or accepted cutout.
  const temp=canvas.ownerDocument.createElement('canvas');
  temp.width=image.naturalWidth;temp.height=image.naturalHeight;
  const tc=temp.getContext('2d',{willReadFrequently:true});
  tc.drawImage(image,0,0);
  const data=tc.getImageData(0,0,temp.width,temp.height);
  fringe=attenuateReviewedFringeAlpha(data.data,temp.width,temp.height);
  if(fringe.changed){
   tc.putImageData(data,0,0);
   drawable=temp;
  }
 }
 const paint=(ctx,p)=>{ctx.save();ctx.transform(...p.matrix);ctx.beginPath();p.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();for(const poly of p.exclude){ctx.beginPath();ctx.rect(0,0,image.naturalWidth,image.naturalHeight);poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip('evenodd');}ctx.drawImage(drawable,0,0);ctx.restore();};
 // Verify the actual rasterized sleeve/torso contact before replacing any fit.
 const body=plan.pieces.find(p=>p.body),joins=[];
 if(body){const c=canvas.ownerDocument.createElement('canvas');c.width=360;c.height=600;paint(c.getContext('2d'),body);const alpha=c.getContext('2d').getImageData(0,0,360,600).data;
  for(const piece of plan.pieces.filter(p=>p.side))for(const [kind,q]of [['shoulder',piece.pivot],['underarm',piece.underarm]]){
   if(!q||!q.every(Number.isFinite))throw Error('Sleeve attachment landmarks required');
   const [x,y]=mapPoint(piece.matrix,q);let nearest=Infinity;
   for(let yy=Math.max(0,Math.floor(y)-12);yy<=Math.min(599,Math.ceil(y)+12);yy++)for(let xx=Math.max(0,Math.floor(x)-12);xx<=Math.min(359,Math.ceil(x)+12);xx++)if(alpha[(yy*360+xx)*4+3]>=96)nearest=Math.min(nearest,Math.hypot(xx+.5-x,yy+.5-y));
   joins.push({side:piece.side,kind,distance:nearest});
   if(nearest>8)throw Error('Sleeve separates from torso; reduce its angle or recheck the shoulder/underarm outline');
  }
 }
 const silhouette=canvas.ownerDocument.createElement('canvas');silhouette.width=360;silhouette.height=600;const sc=silhouette.getContext('2d');for(const piece of plan.pieces)paint(sc,piece);const raster=sc.getImageData(0,0,360,600).data;let faceOverlap=0;
 for(let y=28;y<116;y++)for(let x=146;x<214;x++)if(((x+.5-180)/34)**2+((y+.5-72)/44)**2<1&&raster[(y*360+x)*4+3]>=128)faceOverlap++;
 if(faceOverlap>4)throw Error('Garment overlaps the face; lower it or recheck the shoulder landmarks');
 canvas.width=720;canvas.height=1200;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(const p of plan.pieces)paint(ctx,p);
 return {...plan,fringe,coverage,assignment,joins,faceOverlap,cutoutIntegrity};
}
