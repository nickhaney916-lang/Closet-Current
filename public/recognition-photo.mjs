export function fitPhotoDimensions(width,height,size=224){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isInteger(size)||size<=0)throw Error('Invalid photo dimensions.');
 const scale=size/Math.max(width,height),w=Math.max(1,Math.min(size,Math.round(width*scale))),h=Math.max(1,Math.min(size,Math.round(height*scale)));
 return {width:w,height:h,left:Math.floor((size-w)/2),top:Math.floor((size-h)/2),size};
}
export function padPhotoPixels(data,channels,fit){
 if(![3,4].includes(channels)||data.length!==fit.width*fit.height*channels)throw Error('Invalid photo pixels.');
 const result=new Uint8ClampedArray(fit.size*fit.size*3);result.fill(255);
 for(let y=0;y<fit.height;y++)for(let x=0;x<fit.width;x++){
  const source=(y*fit.width+x)*channels,destination=((y+fit.top)*fit.size+x+fit.left)*3,alpha=channels===4?data[source+3]/255:1;
  for(let c=0;c<3;c++)result[destination+c]=data[source+c]*alpha+255*(1-alpha);
 }
 return result;
}
export async function fitWholePhoto(image,RawImageClass){
 const fit=fitPhotoDimensions(image.width,image.height),resized=await image.resize(fit.width,fit.height);
 return new RawImageClass(padPhotoPixels(resized.data,resized.channels,fit),fit.size,fit.size,3);
}

// Only trim connected, nearly uniform light borders. Busy backgrounds, dark
// scenes, and large removals retain the full frame rather than guessing a box.
export function uniformPhotoBounds(image){
 const {width,height,channels,data}=image;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||![3,4].includes(channels)||data.length!==width*height*channels)throw Error('Invalid photo pixels.');
 const at=(x,y,c)=>{const i=(y*width+x)*channels,a=channels===4?data[i+3]/255:1;return data[i+c]*a+255*(1-a);};
 const corners=[[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
 const background=[0,1,2].map(c=>corners.reduce((sum,[x,y])=>sum+at(x,y,c),0)/4);
 const full={left:0,top:0,right:width,bottom:height};
 if(background.some(v=>v<220)||corners.some(([x,y])=>background.some((v,c)=>Math.abs(at(x,y,c)-v)>12)))return full;
 const matches=(x,y)=>background.every((v,c)=>Math.abs(at(x,y,c)-v)<=18);
 const row=y=>{for(let x=0;x<width;x++)if(!matches(x,y))return false;return true;};
 const column=x=>{for(let y=0;y<height;y++)if(!matches(x,y))return false;return true;};
 let left=0,top=0,right=width,bottom=height;
 while(top<bottom&&row(top))top++;
 while(bottom>top&&row(bottom-1))bottom--;
 while(left<right&&column(left))left++;
 while(right>left&&column(right-1))right--;
 if(right-left<width*.5||bottom-top<height*.5)return full;
 // Retain breathing room for pale garment edges and source rounding.
 const pad=Math.max(2,Math.ceil(Math.max(right-left,bottom-top)*.04));
 return {left:Math.max(0,left-pad),top:Math.max(0,top-pad),right:Math.min(width,right+pad),bottom:Math.min(height,bottom+pad)};
}
// A conservative diagnostic for garment-shape recognition. It reports how
// much of the original photo survives automatic border trimming and whether
// the final square frame includes the entire garment. It never crops further
// or changes the pixels sent to the classifier.
export function recognitionFramingDiagnostics(image,{confirmation=false}={}){
 const bounds=uniformPhotoBounds(image),width=bounds.right-bounds.left,height=bounds.bottom-bounds.top;
 const contentSize=confirmation?320:336,fit=fitPhotoDimensions(width,height,contentSize);
 return {
  originalWidth:image.width,originalHeight:image.height,
  trimmedBounds:bounds,trimmedFraction:1-(width*height)/(image.width*image.height),
  garmentAspectRatio:width/height,
  contentWidth:fit.width,contentHeight:fit.height,
  topAndBottomPadding:336-fit.height,
  leftAndRightPadding:336-fit.width,
  fullGarmentRetained:true
 };
}
export async function prepareRecognitionPhoto(image,RawImageClass,{confirmation=false}={}){
 const bounds=uniformPhotoBounds(image);
 const cropped=bounds.left||bounds.top||bounds.right!==image.width||bounds.bottom!==image.height?
  await image.crop([bounds.left,bounds.top,bounds.right-1,bounds.bottom-1]):image;
 const size=336,contentSize=confirmation?320:size,fit=fitPhotoDimensions(cropped.width,cropped.height,contentSize);
 // The second view changes scale slightly, but retains cuffs, soles and hems.
 const positioned={...fit,size,left:fit.left+(size-contentSize)/2,top:fit.top+(size-contentSize)/2};
 const resized=await cropped.resize(fit.width,fit.height);
 return new RawImageClass(padPhotoPixels(resized.data,resized.channels,positioned),size,size,3);
}
