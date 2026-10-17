import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Diagnostic only: border-connected regions may be real clothing. Never remove them automatically.
export function borderConnectedForeground(prediction){
 const {width:w,height:h}=prediction,mask=decodeReferenceMask(prediction),seen=new Uint8Array(mask.length);
 const stack=[];for(let x=0;x<w;x++){stack.push(x,(h-1)*w+x);}for(let y=0;y<h;y++){stack.push(y*w,y*w+w-1);}
 let borderPixels=0;while(stack.length){const i=stack.pop();if(!mask[i]||seen[i])continue;seen[i]=1;borderPixels++;const x=i%w,y=(i/w)|0;
 if(x>0)stack.push(i-1);if(x<w-1)stack.push(i+1);if(y>0)stack.push(i-w);if(y<h-1)stack.push(i+w);
 }
 const allForeground=mask.reduce((a,b)=>a+b,0);
 return {borderConnectedPixels:borderPixels,foregroundPixels:allForeground,borderConnectedFraction:allForeground?borderPixels/allForeground:0,reviewOnly:true};
}
