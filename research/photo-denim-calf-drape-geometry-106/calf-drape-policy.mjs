/**
 * PHOTO106 — source-pose-relative posterior calf hang for actual licensed
 * source-denim skinned garments. Geometry-only bounded movement, NOT physics.
 * All inputs are original SHA-verified 163-bone anatomical and garment data.
 */
export function posteriorCalfDrapeDelta106({degrees,kneeY,ankleY,y,across,rear,sourceFront}={}){
 const values=[degrees,kneeY,ankleY,y,across,rear,sourceFront];
 if(values.some(x=>typeof x!=='number'||!Number.isFinite(x))||
  degrees<0||degrees>16||kneeY-ankleY<.22||
  Math.abs(across)>.35||rear<0||rear>1||sourceFront<0||sourceFront>1)
  throw Error('PHOTO106 requires exact finite source-knee/ankle data and independent angle 0..16');
 if(!degrees||sourceFront>=.16||rear<=0)return 0;
 const top=kneeY-.085,bottom=ankleY+.065;
 if(top-bottom<.13||y<=bottom||y>=top)return 0;
 const f=(y-bottom)/(top-bottom);
 // One broad calf-drape belly between real knee and hem, fading at both
 // edges to avoid making a crease/cuff discontinuity. Physical geometry
 // shift is at most 12 mm rearward and does not alter source front or UV.
 const envelope=Math.pow(Math.sin(Math.PI*f),1.35);
 const lateral=Math.max(0,1-.35*Math.pow(Math.abs(across)/.35,2));
 const sourceNeutral=Math.max(0,1-sourceFront/.16);
 const kneeWeight=Math.sin(degrees*Math.PI/32);
 const delta=-.012*kneeWeight*envelope*lateral*rear*sourceNeutral;
 if(!Number.isFinite(delta)||delta>0||delta<-.0120001)
  throw Error('PHOTO106 posterior calf shift exceeds source-only 12 mm envelope');
 return delta;
}
