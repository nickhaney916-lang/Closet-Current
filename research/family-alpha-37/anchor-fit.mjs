// Offline research only. Landmarks must be supplied and reviewed by a human.
// This planner does not render, fetch, persist, approve, or modify source pixels.
const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const mid = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const fallback = reason => Object.freeze({mode:'original-cutout',label:'Original cutout — fitting needs review',reason});

/** Calculate one similarity transform from source shoulders or waistband to body.
 * A third independently reviewed landmark is a guard, not a fitting target.
 * Coordinates are in the same normalized avatar frame. No automatic review claim.
 */
export function proposeFit({source,body,reviewed=false,frame={width:1,height:1},bounds}={}) {
 if(reviewed!==true) return fallback('Landmarks require human review');
 if(!source||!body||!['left','right','check'].every(k=>finitePoint(source[k])&&finitePoint(body[k]))) return fallback('Missing landmarks');
 if(!frame||!Number.isFinite(frame.width)||!Number.isFinite(frame.height)||frame.width<=0||frame.height<=0||!bounds||!['left','right','top','bottom'].every(k=>Number.isFinite(bounds[k]))||bounds.left>=bounds.right||bounds.top>=bounds.bottom) return fallback('Invalid image bounds');
 const sw=distance(source.left,source.right),bw=distance(body.left,body.right);
 if(sw<.02||bw<.02) return fallback('Degenerate anchor pair');
 const scale=bw/sw;
 const angle=Math.atan2(body.right.y-body.left.y,body.right.x-body.left.x)-Math.atan2(source.right.y-source.left.y,source.right.x-source.left.x);
 if(scale<.78||scale>1.22||Math.abs(angle)>Math.PI/18) return fallback('Excessive scale or rotation');
 const s=mid(source.left,source.right), b=mid(body.left,body.right), c=Math.cos(angle), n=Math.sin(angle);
 const map=p=>({x:b.x+scale*(c*(p.x-s.x)-n*(p.y-s.y)),y:b.y+scale*(n*(p.x-s.x)+c*(p.y-s.y))});
 const check=map(source.check);
 if(distance(check,body.check)>.08) return fallback('Independent landmark mismatch');
 const corners=[{x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.left,y:bounds.bottom},{x:bounds.right,y:bounds.bottom}].map(map);
 if(corners.some(p=>p.x<0||p.y<0||p.x>frame.width||p.y>frame.height)) return fallback('Fit would clip source');
 return Object.freeze({mode:'rigid-proposal',label:'Landmark proposal — visual review required',scale,angle,sourceCenter:s,targetCenter:b,checkError:distance(check,body.check),sourcePixelsChanged:false});
}
