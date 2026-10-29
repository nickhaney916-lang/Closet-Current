/**
 * 3D-26: conservative source-free mannequin basewear visibility treatment.
 * This only affects original CC0 body material in research dress mode.
 * Never hides or edits actual dress geometry, original photo or skin model.
 */
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function basewearUnderAnatomicalDress({x,y,dressActive=false}={}){
 if(!Number.isFinite(x)||!Number.isFinite(y)||typeof dressActive!=='boolean')
  throw Error('Only finite, explicit mannequin rest-coordinate inputs');
 const ax=Math.abs(x);
 const torso=smooth(1.10,1.14,y)*(1-smooth(1.64,1.67,y))*(1-smooth(.24,.29,ax));
 const shorts=smooth(.74,.78,y)*(1-smooth(1.10,1.14,y))*(1-smooth(.29,.38,ax));
 // Expose only generic clay *skin color*, not unclothed source textures:
 // upper armhole wings and modest neckline opening of a physically present,
 // source-verified anatomical sleeveless dress. Lower torso/shorts unchanged.
 const armhole=smooth(1.39,1.51,y)*smooth(.135,.205,ax);
 const neck=smooth(1.49,1.60,y)*(1-smooth(.12,.19,ax));
 const exposure=dressActive?Math.max(armhole,neck):0;
 const coverage=Math.max(0,Math.min(1,torso*(1-exposure)+shorts));
 return Object.freeze({coverage,exposure,torso,shorts,releaseAuthorized:false});
}
export function shouldRevealAnatomicalDressOpenings(outfit,{enabled=true}={}){
 return enabled===true&&outfit?.mode==='dress'&&
  outfit.dress?.anatomicalDress===true&&
  outfit.dress?.sourceId==='commons-0053'&&
  /^[a-f0-9]{64}$/.test(outfit.dress?.sourceSHA256||'')&&
  outfit.dress?.releaseAuthorized===false;
}
