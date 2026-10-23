/** Fully synthetic garment silhouettes. No downloads, no personal photos. */
const rgba=(r,g,b,a=255)=>[r,g,b,a];
export function syntheticGarment(category,{width=192,height=256,background='plain',pattern=true,clipped=false,blank=false}={}){
 const data=new Uint8ClampedArray(width*height*4),foreground=new Uint8Array(width*height);
 const bg=background==='busy'?null:rgba(245,246,247);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,p=i*4;
  const color=bg||rgba((x*13+y*7)%256,(x*17+y*5)%256,(x*3+y*11)%256);
  data.set(color,p);
  const Y=y/height,X=x/width;
  let keep=false;
  if(!blank){
   switch(category){
    case 'Tops': keep=(X>.31&&X<.69&&Y>.18&&Y<.78)||(X>.15&&X<.32&&Y>.23&&Y<.40)||(X>.68&&X<.85&&Y>.23&&Y<.40);break;
    case 'Bottoms': keep=(X>.29&&X<.71&&Y>.21&&Y<.45)||((X>.3&&X<.47||X>.53&&X<.7)&&Y>=.45&&Y<.9);break;
    case 'Shorts': keep=(X>.28&&X<.72&&Y>.25&&Y<.42)||((X>.28&&X<.47||X>.53&&X<.72)&&Y>=.42&&Y<.60);break;
    case 'Skirt':keep=Y>.22&&Y<.88&&X>.43-.28*(Y-.22)&&X<.57+.28*(Y-.22);break;
    case 'Dresses':keep=(X>.33&&X<.67&&Y>.14&&Y<.52)||(X>.17&&X<.34&&Y>.22&&Y<.35)||(X>.66&&X<.83&&Y>.22&&Y<.35)||(Y>=.52&&Y<.91&&X>.35-.4*(Y-.52)&&X<.65+.4*(Y-.52));break;
    case 'Outerwear':keep=(X>.30&&X<.70&&Y>.16&&Y<.85)||(X>.14&&X<.31&&Y>.20&&Y<.72)||(X>.69&&X<.86&&Y>.20&&Y<.72);break;
    case 'Shoes':keep=(X>.18&&X<.46&&Y>.69&&Y<.82)||(X>.54&&X<.82&&Y>.69&&Y<.82);break;
    default:break;
   }
  }
  if(clipped&&Y<.1)keep=false;
  if(keep){
   foreground[i]=1;
   const stripe=pattern&&(x%25<6);
   data.set(stripe?rgba(26,210,102):rgba(200,44,83),p);
  }
 }
 return {frame:{width,height,data},foreground,category:category==='Shorts'||category==='Skirt'?'Bottoms':category,kind:category};
}
export const qaCategories=['Tops','Bottoms','Shorts','Skirt','Dresses','Outerwear','Shoes'];
