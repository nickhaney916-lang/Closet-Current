/** Closet Current 3D-67 — deterministic camera-space 360° rotation.
 * Never rotate the source glTF body group, skeleton, clothes or source pixels.
 * Use identical orbit geometry for manual presets and optional turntable.
 */
import * as THREE from 'three';
export const VIEW_DEGREES=Object.freeze([0,45,90,135,180,225,270,315,360]);
export function normalizedView(degrees){
 if(!Number.isFinite(degrees))throw Error('Finite viewing angle required');
 const n=((degrees%360)+360)%360;
 return Math.abs(n)<1e-10||Math.abs(n-360)<1e-10?0:n;
}
export function cameraOrbitPoint(degrees,radius=4.25,target=new THREE.Vector3(0,1.04,0),heightOffset=0){
 if(!Number.isFinite(radius)||radius<1.25||radius>15)throw Error('Anatomical 3D viewing distance invalid');
 if(!Number.isFinite(heightOffset)||Math.abs(heightOffset)>3)throw Error('Viewing elevation invalid');
 const a=normalizedView(degrees)*Math.PI/180;
 return new THREE.Vector3(target.x+Math.sin(a)*radius,target.y+heightOffset,target.z+Math.cos(a)*radius);
}
export function viewAngleFromCamera(camera,target){
 const dx=camera.position.x-target.x,dz=camera.position.z-target.z;
 if(Math.hypot(dx,dz)<.01)throw Error('Camera cannot orbit inside anatomical human');
 return normalizedView(THREE.MathUtils.radToDeg(Math.atan2(dx,dz)));
}
export function setAnatomicalCameraView(camera,controls,degrees,{radius=null,elevation=null}={}){
 if(!camera?.isPerspectiveCamera||!controls?.target)throw Error('Real three-dimensional camera and orbit target required');
 const target=controls.target;
 const current=camera.position.clone().sub(target);
 const r=radius??Math.hypot(current.x,current.z);
 const rise=elevation??current.y;
 if(!Number.isFinite(rise))throw Error('Invalid camera elevation');
 // Zero is mathematically identical to 360 by construction: there is
 // one true front, with no cumulative yaw drift from multiple body rotations.
 camera.position.copy(cameraOrbitPoint(degrees,r,target,rise));
 camera.lookAt(target);
 controls.update();
 return {requested:degrees,normalized:normalizedView(degrees),
  actual:viewAngleFromCamera(camera,target),radius:r,position:camera.position.toArray()};
}
export function advanceAnatomicalTurntable(camera,controls,deltaSeconds,rateDegPerSecond=18){
 if(!Number.isFinite(deltaSeconds)||deltaSeconds<0||deltaSeconds>.2)
  throw Error('Time step for capped 3D humanoid turntable invalid');
 if(!Number.isFinite(rateDegPerSecond)||rateDegPerSecond<=0||rateDegPerSecond>60)
  throw Error('3D showroom auto-spin speed invalid');
 const next=viewAngleFromCamera(camera,controls.target)+deltaSeconds*rateDegPerSecond;
 return setAnatomicalCameraView(camera,controls,next);
}
