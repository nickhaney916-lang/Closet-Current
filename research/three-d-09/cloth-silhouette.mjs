/**
 * 3D-09 — prototype, not cloth physics: a bounded extra stand-off from the
 * actual skinned CC0 anatomy. Low-amplitude folds are silhouette cues,
 * NEVER generated fabric photographs or user body measurements.
 */
export const RELAXED_SHIRT=Object.freeze({
 base:0.013,hem:0.045,upperSleeve:0.022,ripple:0.0025,
 maxDisplacement:0.085,view:'visual-comparison-only',
 physicallySimulated:false,tailoredFit:false,releaseAuthorized:false
});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const smooth=(a,b,x)=>{
 const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);
};
export function shellClearanceAt({x,y,z,relaxed=true}={}){
 if(![x,y,z].every(Number.isFinite)||Math.abs(x)>3||Math.abs(z)>3||
  y<-.5||y>3||typeof relaxed!=='boolean')
  throw Error('Unsupported model world coordinates');
 const hem=1-smooth(1.08,1.35,y);
 const sleeves=smooth(.30,.57,Math.abs(x))*(1-smooth(1.57,1.70,y));
 const ripples=Math.sin(y*21+x*18)*RELAXED_SHIRT.ripple*
  (1-smooth(1.38,1.62,y));
 const offset=relaxed?RELAXED_SHIRT.base+RELAXED_SHIRT.hem*hem+
  RELAXED_SHIRT.upperSleeve*sleeves+ripples:0;
 return clamp(offset,0,RELAXED_SHIRT.maxDisplacement);
}
/** GLSL declarations at shader scope; vertex modifier runs after skinning. */
export const CLOTH_VERTEX_DECLARATIONS='uniform float uRelaxedFit;\nvarying vec3 vSilhouetteShiftedWorld;';
export const CLOTH_VERTEX=[
 'vec3 ccWorldPoint=(modelMatrix*vec4(transformed,1.0)).xyz;',
 'float ccHem=1.0-smoothstep(1.08,1.35,ccWorldPoint.y);',
 'float ccSleeve=smoothstep(.30,.57,abs(ccWorldPoint.x))*',
 ' (1.0-smoothstep(1.57,1.70,ccWorldPoint.y));',
 'float ccRipple=.0025*sin(ccWorldPoint.y*21.0+ccWorldPoint.x*18.0)*',
 ' (1.0-smoothstep(1.38,1.62,ccWorldPoint.y));',
 'float ccOffset=clamp((.013+.045*ccHem+.022*ccSleeve+ccRipple)',
 ' *uRelaxedFit,0.0,.085);',
 '// A genuine world-space displacement changes the side silhouette.',
 'vec3 ccRadial=normalize(vec3(ccWorldPoint.x,0.,ccWorldPoint.z)+',
 ' vec3(.0001,0.,.0001));',
 'vSilhouetteShiftedWorld=ccWorldPoint+ccRadial*ccOffset;',
 'gl_Position=projectionMatrix*viewMatrix*vec4(vSilhouetteShiftedWorld,1.0);'
].join('\n');
