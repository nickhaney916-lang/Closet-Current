import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Compare model-exclusive pixels specifically near footwear's lower silhouette.
// Counts are observational; neither model is independently known to be correct.
export function lowerFootwearDisagreement(segformer,modnet,{lowerFraction=.35}={}){
 if(segformer.width!==modnet.width||segformer.height!==modnet.height||segformer.sourceSha256!==modnet.sourceSha256)throw Error('Source or dimensions differ');
 if(!Number.isFinite(lowerFraction)||lowerFraction<=0||lowerFraction>1)throw Error('Invalid lowerFraction');
 const a=decodeReferenceMask(segformer),b=decodeReferenceMask(modnet),w=modnet.width,h=modnet.height;
 let min=h,max=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b[y*w+x]){min=Math.min(min,y);max=Math.max(max,y);}
 if(max<0)return {startingRow:null,modnetOnly:0,segformerOnly:0,shared:0,reviewOnly:true};
 const start=Math.floor(min+(max-min)*(1-lowerFraction));let modnetOnly=0,segformerOnly=0,shared=0;
 for(let i=start*w;i<a.length;i++){if(a[i]&&b[i])shared++;else if(b[i])modnetOnly++;else if(a[i])segformerOnly++;}
 return {startingRow:start,modnetOnly,segformerOnly,shared,reviewOnly:true};
}
