import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Diagnostic proposal only: candidates must be visually reviewed before mask changes.
export function footwearShadowCandidates(prediction,{bottomFraction=.3}={}){
 if(!Number.isFinite(bottomFraction)||bottomFraction<=0||bottomFraction>1)throw Error('Invalid bottomFraction');
 const {width:w,height:h}=prediction,mask=decodeReferenceMask(prediction);
 let first=0,last=h-1;const rowCount=new Uint32Array(h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)rowCount[y]+=mask[y*w+x];
 while(first<h&&!rowCount[first])first++;while(last>=0&&!rowCount[last])last--;
 if(first>=h)return {candidatePixels:0,rows:[],reviewOnly:true};
 const start=Math.floor(first+(last-first)*(1-bottomFraction));let candidatePixels=0,rows=[];
 for(let y=start;y<=last;y++){const occupancy=rowCount[y]/w; if(occupancy>0&&occupancy<.12){candidatePixels+=rowCount[y];rows.push({y,pixels:rowCount[y]});}}
 return {candidatePixels,rows,reviewOnly:true,note:'Sparse lower rows may contain real heels or soles; not automatically removable'};
}
