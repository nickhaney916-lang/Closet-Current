/** Offline Family Alpha garment edit: a human indicates pixels to REMOVE only.
 * Never classify color as skin or erase a neckline automatically: that would
 * remove real beige clothing. Original saved JPEG and accepted image RGB stay
 * unchanged. No server, model, canvas download or permanent record.
 */
const validFrame=f=>f&&Number.isInteger(f.width)&&Number.isInteger(f.height)&&f.width>=32&&f.height>=32&&f.width*f.height<=8_000_000&&
 (f.rgba instanceof Uint8ClampedArray||f.rgba instanceof Uint8Array)&&f.rgba.length===f.width*f.height*4;
export function applyReviewedEraser(original,strokes,{minRetained=.55}={}){
 if(!validFrame(original)||!Array.isArray(strokes)||strokes.length>40||
    !Number.isFinite(minRetained)||minRetained<.5||minRetained>1)
  throw new Error('Invalid human-reviewed mask inputs');
 const {width:w,height:h}=original;
 const data=new Uint8ClampedArray(original.rgba);
 let before=0,after=0;
 for(let p=3;p<data.length;p+=4)if(data[p]>=128)before++;
 if(before<64)throw Error('Original has no meaningful garment alpha');
 for(const point of strokes){
  if(point?.kind==='polygon'){
   const pts=point.points;
   if(!Array.isArray(pts)||pts.length<3||pts.length>24||
      pts.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
       p.x<0||p.x>1||p.y<0||p.y>1))
    throw new Error('Invalid manual mask outline');
   let area=0;
   for(let i=0;i<pts.length;i++){
    const a=pts[i],b=pts[(i+1)%pts.length];
    area+=a.x*b.y-b.x*a.y;
   }
   if(Math.abs(area)<.001||Math.abs(area)>.48)
    throw new Error('Invalid outline area; use smaller garment-residue region');
   const minX=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.x))*w));
   const maxX=Math.min(w-1,Math.ceil(Math.max(...pts.map(p=>p.x))*w));
   const minY=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.y))*h));
   const maxY=Math.min(h-1,Math.ceil(Math.max(...pts.map(p=>p.y))*h));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const px=(x+.5)/w,py=(y+.5)/h;
    let inside=false;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){
     const a=pts[i],b=pts[j];
     if((a.y>py)!==(b.y>py)&&
        px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x)
      inside=!inside;
    }
    if(inside)data[(y*w+x)*4+3]=0;
   }
   continue;
  }
  if(!point||!['x','y','radius'].every(k=>Number.isFinite(point[k]))||
   point.x<0||point.x>1||point.y<0||point.y>1||
   point.radius<.012||point.radius>.12)
   throw Error('Invalid eraser brush stroke');
  const cx=point.x*w,cy=point.y*h,r=point.radius*Math.min(w,h);
  const x1=Math.max(0,Math.floor(cx-r)),x2=Math.min(w-1,Math.ceil(cx+r));
  const y1=Math.max(0,Math.floor(cy-r)),y2=Math.min(h-1,Math.ceil(cy+r));
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){
   if((x+.5-cx)**2+(y+.5-cy)**2<=r*r)data[(y*w+x)*4+3]=0;
  }
 }
 for(let p=3;p<data.length;p+=4)if(data[p]>=128)after++;
 if(after<64||after/before<minRetained)throw Error('Too much garment removed; retake or review source');
 // RGB and dimensions are a literal copy; only the alpha byte may decrease.
 return Object.freeze({width:w,height:h,rgba:data,originalVisiblePixels:before,
  visiblePixels:after,removedPixels:before-after,sourceRGBUnchanged:true});
}
/**
 * Pair evidence is deliberately conservative: TWO disconnected, meaningful
 * opacity components side by side. Even this is not proof they are shoes;
 * the human must separately confirm the photograph represents both shoes.
 * A single side-view sneaker/boot always falls back to reference-only display.
 */
export function hasTwoClearlySeparatedFootwearComponents(prepared){
 if(!validFrame(prepared))return false;
 const {width:w,height:h,rgba}=prepared;
 const scale=Math.max(1,Math.ceil(Math.max(w,h)/192));
 const dw=Math.ceil(w/scale),dh=Math.ceil(h/scale),mask=new Uint8Array(dw*dh);
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
  let on=false;for(let dy=0;dy<scale&&!on;dy++)for(let dx=0;dx<scale;dx++){
   const xx=x*scale+dx,yy=y*scale+dy;
   if(xx<w&&yy<h&&rgba[(yy*w+xx)*4+3]>=128){on=true;break;}
  }
  mask[y*dw+x]=on?1:0;
 }
 const visited=new Uint8Array(mask.length),stack=new Int32Array(mask.length),parts=[];
 for(let i=0;i<mask.length;i++){
  if(!mask[i]||visited[i])continue;
  let head=0,tail=1,first=i,left=dw,right=-1,top=dh,bottom=-1;stack[0]=first;visited[first]=1;
  while(head<tail){
   const p=stack[head++],x=p%dw,y=Math.floor(p/dw);
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const n of [x>0?p-1:-1,x+1<dw?p+1:-1,y>0?p-dw:-1,y+1<dh?p+dw:-1]){
    if(n>=0&&mask[n]&&!visited[n]){visited[n]=1;stack[tail++]=n;}
   }
  }
  parts.push({size:tail,left,right,top,bottom,centerX:(left+right)/2});
 }
 parts.sort((a,b)=>b.size-a.size);
 const [a,b]=parts;if(!a||!b)return false;
 if(a.size<35||b.size<Math.max(35,a.size*.35)||parts[2]?.size>Math.max(30,a.size*.18))return false;
 // Pair must have two horizontally distinct footprint masks, not one boot
 // cut into logo fragments or a shoe lying directly above another shoe.
 const left=a.centerX<b.centerX?a:b,right=left===a?b:a;
 const separation=(right.centerX-left.centerX)/dw;
 const horizontalOverlap=Math.max(0,Math.min(left.right,right.right)-Math.max(left.left,right.left)+1);
 if(separation<.24||horizontalOverlap/Math.min(left.right-left.left+1,right.right-right.left+1)>.12)return false;
 if(Math.abs((left.top+left.bottom)-(right.top+right.bottom))/(2*dh)>.22)return false;
 return true;
}
