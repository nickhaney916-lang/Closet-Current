// Mission #88, strictly offline / PUBLIC already-exposed Fashionpedia research.
// YOLOv8n MIT ONNX 46 labels, ONLY 27 main Fashionpedia object classes accepted.
// Never import into consumer recognition, worker, Auth, closet or owner save.
import {accessoryBoxIoU88} from './exposed-threshold-probes-88.mjs';

export const FASHION_MAIN_LABELS88=Object.freeze([
 'shirt, blouse','top, t-shirt, sweatshirt','sweater','cardigan',
 'jacket','vest','pants','shorts','skirt','coat','dress','jumpsuit',
 'cape','glasses','hat','headband, head covering, hair accessory','tie',
 'glove','watch','belt','leg warmer','tights, stockings','sock','shoe',
 'bag, wallet','scarf','umbrella'
]);
export const FASHION_ACCESSORY_IDS88=Object.freeze([13,14,15,16,17,18,19,20,22,24,25,26]);
const accessories=new Set(FASHION_ACCESSORY_IDS88);
export function fashionBoxNms88(proposals,limit=0.50){
 if(!Array.isArray(proposals)||proposals.length>10000||
    !Number.isFinite(limit)||limit<=0||limit>1)throw Error('P88_FASHION_INVALID_NMS');
 const sorted=proposals.map(p=>{
  if(!Number.isInteger(p.category_id)||p.category_id<0||p.category_id>26||
    typeof p.score!=='number'||!Number.isFinite(p.score)||p.score<0||p.score>1)
     throw Error('P88_FASHION_INVALID_PROPOSAL');
  accessoryBoxIoU88(p.box,p.box);
  return p;
 }).sort((a,b)=>b.score-a.score||a.category_id-b.category_id||
   a.box.xmin-b.box.xmin||a.box.ymin-b.box.ymin);
 const retained=[];
 for(const p of sorted){
  if(!retained.some(q=>q.category_id===p.category_id&&
      accessoryBoxIoU88(q.box,p.box)>=limit))retained.push(p);
 }
 return retained;
}
export function decodeFashionYolo88(data,dims,srcWidth,srcHeight,geometry,{cutoff=.10}={}){
 if(!ArrayBuffer.isView(data)||!Array.isArray(dims)||dims.length!==3||
    dims[0]!==1||![dims[1],dims[2]].includes(50)||
    !Number.isInteger(srcWidth)||srcWidth<1||srcWidth>8192||
    !Number.isInteger(srcHeight)||srcHeight<1||srcHeight>8192||
    !geometry||[geometry.inputSize,geometry.width,geometry.height,
     geometry.padX,geometry.padY].some(x=>!Number.isInteger(x))||
    geometry.inputSize<128||geometry.inputSize>1280||
    geometry.width<1||geometry.height<1||
    geometry.padX<0||geometry.padY<0||
    geometry.padX+geometry.width>geometry.inputSize||
    geometry.padY+geometry.height>geometry.inputSize||
    !Number.isFinite(cutoff)||cutoff<0||cutoff>1)
   throw Error('P88_FASHION_INVALID_TENSOR');
 const channelFirst=dims[1]===50;
 const anchors=channelFirst?dims[2]:dims[1];
 if(!Number.isInteger(anchors)||anchors<=0||anchors>20000||
    data.length!==anchors*50)throw Error('P88_FASHION_INVALID_OUTPUT_SHAPE');
 const at=(channel,j)=>channelFirst?data[channel*anchors+j]:data[j*50+channel];
 const proposals=[];
 for(let j=0;j<anchors;j++){
  let id=0,score=-Infinity;
  for(let c=0;c<46;c++){
   const s=at(c+4,j);
   if(!Number.isFinite(s))throw Error('P88_FASHION_NONFINITE_LOGITS');
   if(s>score){score=s;id=c;}
  }
  if(score<cutoff||!accessories.has(id))continue;
  const [cx,cy,w,h]=[at(0,j),at(1,j),at(2,j),at(3,j)];
  if([cx,cy,w,h].some(x=>!Number.isFinite(x))||w<0||h<0)
   throw Error('P88_FASHION_INVALID_COORDS');
  const xscale=srcWidth/geometry.width,yscale=srcHeight/geometry.height;
  const xmin=Math.max(0,Math.min(srcWidth,(cx-w/2-geometry.padX)*xscale));
  const ymin=Math.max(0,Math.min(srcHeight,(cy-h/2-geometry.padY)*yscale));
  const xmax=Math.max(0,Math.min(srcWidth,(cx+w/2-geometry.padX)*xscale));
  const ymax=Math.max(0,Math.min(srcHeight,(cy+h/2-geometry.padY)*yscale));
  if(xmax<=xmin||ymax<=ymin)continue;
  proposals.push({category_id:id,score,box:{xmin,ymin,xmax,ymax}});
 }
 return fashionBoxNms88(proposals);
}
export function scoreFashionAccessory88(human,proposals,{iou=.5}={}){
 if(!Array.isArray(human)||!Array.isArray(proposals)||
    human.length>100||proposals.length>500||
    !Number.isFinite(iou)||iou<.1||iou>1)
   throw Error('P88_FASHION_INVALID_GROUND_TRUTH');
 for(const gt of human){
  if(!Number.isInteger(gt.category_id)||!accessories.has(gt.category_id))
   throw Error('P88_FASHION_UNSUPPORTED_HUMAN_ACCESSORY');
  accessoryBoxIoU88(gt.box,gt.box);
 }
 for(const p of proposals){
  if(!Number.isInteger(p.category_id)||!accessories.has(p.category_id)||
      !Number.isFinite(p.score)||p.score<0||p.score>1)
   throw Error('P88_FASHION_INVALID_ACCESSORY_PROPOSAL');
  accessoryBoxIoU88(p.box,p.box);
 }
 const edges=human.map(t=>proposals.map((p,j)=>({
  j,overlap:p.category_id===t.category_id?accessoryBoxIoU88(p.box,t.box):0
 })).filter(v=>v.overlap>=iou).sort((a,b)=>b.overlap-a.overlap||a.j-b.j));
 const matches=new Map();
 function assign(i,visited){
  for(const edge of edges[i]){
   if(visited.has(edge.j))continue;
   visited.add(edge.j);
   if(!matches.has(edge.j)||assign(matches.get(edge.j),visited)){
    matches.set(edge.j,i);return true;
   }
  }
  return false;
 }
 for(let i=0;i<human.length;i++)assign(i,new Set());
 const perCategory=Object.fromEntries(FASHION_ACCESSORY_IDS88.map(id=>{
  const truth=human.filter(x=>x.category_id===id).length;
  const predicted=proposals.filter(x=>x.category_id===id).length;
  const matched=Array.from(matches.entries()).filter(([p,t])=>
   human[t].category_id===id&&proposals[p].category_id===id).length;
  return [FASHION_MAIN_LABELS88[id],{categoryId:id,human:truth,matched,proposed:predicted}];
 }));
 return {human:human.length,proposals:proposals.length,matched:matches.size,
  unmatchedProposals:proposals.length-matches.size,
  missedHuman:human.length-matches.size,perCategory,
  boxIoUOnly:true,alreadyExposedNotBlind:true,noOwnerSave:true};
}
