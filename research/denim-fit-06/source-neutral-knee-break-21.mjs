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
 const tuck=smooth(.17,.34,phase)*(1-smooth(.45,.57,phase));
 const crest=smooth(.49,.66,phase)*(1-smooth(.77,.94,phase));
 // The lower trough tempers puffy calf; a single gentle knee crest preserves
 // the sewn leg's fabric volume. Seam anchors smoothly return to zero.
 const radialMeters=amplitude*(.0028*crest-.0038*tuck);
 return Object.freeze({radialMeters,modeledUnphotographedFold:true});
}
