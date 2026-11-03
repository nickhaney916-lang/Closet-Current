/**
 * DENIM-SIGNED-TAPER-19 (research only).
 * The original SHA-reviewed front alpha silhouette can say whether jeans
 * taper inward or flare outward from knee to hem. It CANNOT reveal rear
 * photographs, dye, true cloth depth, or unseen texture.
 * Returns a small signed adjustment to P18's neutral modeled side/rear
 * surface; only the caller may apply it within the existing 24 mm budget.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{
 const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);
};
export function sourcePhotoSignedCalf19(phase,stations){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Array.isArray(stations)||stations.length!==5||
  stations.some(x=>!Number.isFinite(x)||x<.26||x>2.5)||
  Math.abs(stations[0]-1)>.025)
  throw Error('P19 requires five actual normalized original photo width stations and a real calf phase');
 // Two neighboring measured stations at each end reduce one-row mask noise.
 const knee=.7*stations[0]+.3*stations[1];
 const hem=.7*stations[4]+.3*stations[3];
 const observedTaper=hem-knee; // <0: tapered, >0: wide/boot-cut
 // Tiny neutral side/rear adjustment; no fabricated original photo pixels.
 return clamp(observedTaper*.09,-.006,.0115)*
  smooth(.02,.20,phase)*(1-smooth(.68,.98,phase));
}
