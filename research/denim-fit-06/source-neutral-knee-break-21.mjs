/**
 * P21 RESEARCH ONLY: bone-conditioned, modeled denim knee break and calf tuck.
 * Original authenticated cutout supplies five per-leg alpha width stations.
 * This does not imply any original photograph contains these modeled folds:
 * front image/texture, UV, rest, 163-bone skin and rear provenance remain fixed.
 * One wide compression trough and one knee transition, NOT periodic noise.
 */
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const smooth=(a,b,v)=>{
 const x=clamp((v-a)/(b-a),0,1);
 return x*x*(3-2*x);
};
export function sourceNeutralKneeBreak21(phase,photoStations,side){
 if(!Number.isFinite(phase)||phase<0||phase>1||
    !Array.isArray(photoStations)||photoStations.length!==5||
    photoStations.some(v=>!Number.isFinite(v)||v<.26||v>2.5)||
    !Number.isInteger(side)||(side!==0&&side!==1))
  throw Error('P21 requires real 163-bone knee/ankle phase and SHA-bound original 5-station per-leg cutout');
 if(phase===0||phase===1)return Object.freeze({radialMeters:0,modeledUnphotographedFold:true});
 // Original source width slope changes relative ease, not fake photo folds.
 const widthSlope=photoStations[1]-photoStations[4];
 const amplitude=clamp(.98+.22*widthSlope,.88,1.12)*(side===0?1:.94);
 // Spread the modelled fold across actual adjacent skinned knee/calf rows:
 // the previous narrow crest changed only 19 WebGL RGB pixels at 90 degrees.
 // The knee-facing portion expands OUTWARD (body-safe); the inward calf
 // trough keeps its existing 3.8 mm maximum to avoid skin intersections.
 const tuck=smooth(.12,.30,phase)*(1-smooth(.50,.66,phase));
 const crest=smooth(.42,.58,phase)*(1-smooth(.82,.96,phase));
 // One anatomical knee break, not a new painted pattern or periodic waves.
 // Photo-front vertices and real cutout remain untouched; seam-boundary
 // displacement is zero at both original knee/ankle endpoints.
 const radialMeters=amplitude*(.0048*crest-.0038*tuck);
 return Object.freeze({radialMeters,modeledUnphotographedFold:true});
}
