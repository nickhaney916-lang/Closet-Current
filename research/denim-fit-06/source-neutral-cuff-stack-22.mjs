/**
 * P22: opt-in modeled diagonal cuff stacking for genuine photographed jeans.
 * Geometry only on prevalidated independently sewn source-neutral side/rear
 * panels. Original source alpha hem/knee ratios and real 163-bone ankle/knee
 * radial orientation determine fold width, diagonal tilt, and ease.
 * A source FRONT photograph cannot authenticate an unseen back fold.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function sourceNeutralCuffStack22(phase,radialX,radialZ,hemOverKneeRatio,side){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Number.isFinite(radialX)||!Number.isFinite(radialZ)||
  Math.abs(Math.hypot(radialX,radialZ)-1)>.025||
  !Number.isFinite(hemOverKneeRatio)||hemOverKneeRatio<.26||hemOverKneeRatio>2.5||
  !Number.isInteger(side)||(side!==0&&side!==1))
  throw Error('P22 requires real 163-bone skinned leg radial orientation, finite phase and source SHA-linked original hem/knee ratio');
 if(phase===0||phase===1)return Object.freeze({outwardMeters:0,modeledUnphotographedFold:true});
 // Source-width informed: a tapered photograph supports a slightly stronger
 // hem stack, while the broad original cutout is allowed to hang loose.
 const widthEase=clamp(1.09-.29*Math.max(0,hemOverKneeRatio-1),.68,1.09);
 // Slant the local cuff stack by the REAL leg panel's circumferential
 // direction, creating a single diagonal fold rather than a horizontal ring
 // or procedurally repeated fabric/wrinkles.
 const diagonal=clamp(phase+.12*radialX*(side===0?1:-1),0,1);
 const shoulder=smooth(.12,.27,diagonal)*(1-smooth(.39,.57,diagonal));
 const perimeterEase=.71+.29*Math.abs(radialZ);
 return Object.freeze({
  outwardMeters:.0063*widthEase*perimeterEase*shoulder,
  modeledUnphotographedFold:true
 });
}
