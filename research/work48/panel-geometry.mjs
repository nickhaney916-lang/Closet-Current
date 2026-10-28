/** Rigid photographed fabric sections: no nonuniform warp or texture generation. */
export function pointInPolygon(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
export const inPiece=(p,piece)=>pointInPolygon(...p,piece.polygon)&&!(piece.exclude||[]).some(poly=>pointInPolygon(...p,poly));
export function sourceAssignment(pixels,w,h,plan,sw,sh){let opaque=0,covered=0,duplicated=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(pixels[(y*w+x)*4+3]<128)continue;opaque++;const p=[(x+.5)*sw/w,(y+.5)*sh/h],n=plan.pieces.filter(piece=>inPiece(p,piece)).length;if(n)covered++;if(n>1)duplicated++;}return {opaque,covered,duplicated,coveredRatio:opaque?covered/opaque:0,duplicateRatio:opaque?duplicated/opaque:0};}
export function validateSleeveOutline(poly){
 if(!Array.isArray(poly)||poly.length<3||poly.length>16||!poly.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)))throw Error('Trace 3–16 sleeve points inside the source');
 const area=Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
 if(area<.003||area>.45)throw Error('Sleeve outline is too small or includes too much garment');
 return poly.map(p=>[...p]);
}
export function panelsFromSleeves(traces){
 const sleeves=Object.entries(traces).map(([side,poly])=>{if(!['left','right'].includes(side))throw Error('Unknown sleeve');const polygon=validateSleeveOutline(poly);return {side,polygon,pivot:polygon[0],underarm:polygon.at(-1),rotate:0};});
 if(!sleeves.length||sleeves.length>2)throw Error('One or two reviewed sleeve outlines required');
 return [...sleeves,{polygon:[[0,0],[1,0],[1,1],[0,1]],exclude:sleeves.map(p=>p.polygon),body:true}];
}
