/**
 * Pose-aware preview placement contract. Uses explicit validated body landmarks.
 * A placement approximation only: no cloth physics, fit, occlusion, or body scanning.
 */
const allowed=['top','bottom','dress','jacket','coat','shoes'];
function point(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}
function box(x,y,width,height){
 if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw new Error('Invalid pose geometry');
 return Object.freeze({x,y,width,height});
}
export function planPosePlacement({slot,pose,canvasWidth,canvasHeight}) {
 if(!allowed.includes(slot))throw new Error('Unsupported garment slot');
 if(!Number.isInteger(canvasWidth)||!Number.isInteger(canvasHeight)||canvasWidth<1||canvasHeight<1)throw new Error('Invalid canvas');
 const keys=['leftShoulder','rightShoulder','leftHip','rightHip','leftAnkle','rightAnkle'];
 if(!pose||keys.some(k=>!point(pose[k])))throw new Error('Missing body landmarks');
 if(keys.some(k=>pose[k].x<0||pose[k].x>canvasWidth||pose[k].y<0||pose[k].y>canvasHeight))throw new Error('Landmark outside canvas');
 const shoulderWidth=Math.abs(pose.rightShoulder.x-pose.leftShoulder.x);
 const hipWidth=Math.abs(pose.rightHip.x-pose.leftHip.x);
 const shoulderY=(pose.leftShoulder.y+pose.rightShoulder.y)/2;
 const hipY=(pose.leftHip.y+pose.rightHip.y)/2;
 const ankleY=(pose.leftAnkle.y+pose.rightAnkle.y)/2;
 const cx=(pose.leftShoulder.x+pose.rightShoulder.x+pose.leftHip.x+pose.rightHip.x)/4;
 if(shoulderWidth<2||hipWidth<2||hipY<=shoulderY||ankleY<=hipY)throw new Error('Unusable pose');
 const torso=hipY-shoulderY,legs=ankleY-hipY;
 let result;
 switch(slot){
  case 'top':result=box(cx-shoulderWidth*.62,shoulderY,shoulderWidth*1.24,torso*1.05);break;
  case 'jacket':result=box(cx-shoulderWidth*.72,shoulderY-torso*.06,shoulderWidth*1.44,torso*1.2);break;
  case 'coat':result=box(cx-shoulderWidth*.78,shoulderY-torso*.06,shoulderWidth*1.56,torso+legs*.42);break;
  case 'bottom':result=box(cx-hipWidth*.65,hipY,hipWidth*1.3,legs*.95);break;
  case 'dress':result=box(cx-shoulderWidth*.72,shoulderY,shoulderWidth*1.44,torso+legs*.64);break;
  case 'shoes':result=box(cx-hipWidth*.8,ankleY-legs*.08,hipWidth*1.6,legs*.18);break;
 }
 return Object.freeze({slot,targetBox:result,renderMode:'2d-pose-approximation',fitSimulation:false});
}
