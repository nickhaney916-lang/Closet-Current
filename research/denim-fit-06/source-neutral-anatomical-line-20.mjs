/**
 * DENIM-ANATOMICAL-LINE-20: opt-in source-neutral denim shape refinement.
 * Given REAL 163-bone knee/hip/ankle positions and already SHA-verified
 * original PHOTO per-leg hem widths, lower an over-rounded rear thigh
 * surface and remove a small lower-calf radial bulge. No photographed
 * front vertices, RGB, UVs, fabric labels or unseen back imagery changes.
 * These are bounded model-space contour adjustments, NOT captured rear facts.
 */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{
 const t=clamp((v-a)/(b-a),0,1);
 return t*t*(3-2*t);
};
export function sourceNeutralThighLine20(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('P20 requires authentic finite 163-bone hip/knee thigh phase');
 if(phase===0||phase===1)return Object.freeze({rearMeters:0,sideMeters:0});
 const w=smooth(.09,.32,phase)*(1-smooth(.66,.94,phase));
 return Object.freeze({rearMeters:.0045*w,sideMeters:.0018*w});
}
export function sourceNeutralCalfLine20(phase,hemOverKneeRatio){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Number.isFinite(hemOverKneeRatio)||hemOverKneeRatio<.26||
  hemOverKneeRatio>2.5)
  throw Error('P20 requires authenticated original per-leg hem/knee and 163-bone ankle/knee phase');
 if(phase===0||phase===1)return 0;
 // Do NOT erase a photographically broad boot-cut silhouette.
 // Tapered pants receive a slightly stronger rear/side radial cleanup.
 const strength=clamp(.0030-.002*Math.max(0,hemOverKneeRatio-1),.0007,.0030);
 return strength*smooth(.10,.32,phase)*(1-smooth(.65,.94,phase));
}
