// Original CC0 synthetic test fixtures; NOT photographs, segmentation, or realism evidence.
export const garments={
 shirt:{slot:'top',path:'M70 40L100 30L140 30L170 40L215 90L190 120L165 100L165 200L75 200L75 100L50 120L25 90Z',pair:[{x:70,y:40},{x:170,y:40}],target:[{x:125,y:140},{x:235,y:140}],color:'#287db0',factor:.94},
 jacket:{slot:'layer',path:'M70 40L100 30L140 30L170 40L200 90L215 220L185 225L165 110L170 220L70 220L75 110L55 225L25 220L40 90Z',pair:[{x:70,y:40},{x:170,y:40}],target:[{x:123,y:140},{x:237,y:140}],color:'#873e32',factor:.94},
 trousers:{slot:'bottom',path:'M75 30L165 30L175 85L165 245L125 245L120 115L115 245L75 245L65 85Z',pair:[{x:75,y:30},{x:165,y:30}],target:[{x:130,y:315},{x:230,y:315}],color:'#304b77',factor:1},
 dress:{slot:'dress',path:'M80 30L100 20L140 20L160 30L170 70L150 85L145 120L185 265L55 265L95 120L90 85L70 70Z',pair:[{x:80,y:30},{x:160,y:30}],target:[{x:125,y:140},{x:235,y:140}],color:'#633d87',factor:.94},
 skirt:{slot:'bottom',path:'M75 30L165 30L200 210L40 210Z',pair:[{x:75,y:30},{x:165,y:30}],target:[{x:140,y:315},{x:220,y:315}],color:'#228070',factor:1},
 shoes:{slot:'shoes',path:'M45 40L90 40L105 65L105 85L25 85L25 70Z M150 40L195 40L215 70L215 85L135 85L135 65Z',pair:[{x:75,y:65},{x:165,y:65}],target:[{x:140,y:553},{x:220,y:553}],color:'#a66d20',factor:1}
};
export async function fixtureImage(name,document=globalThis.document){
 const g=garments[name],c=document.createElement('canvas');c.width=240;c.height=name==='shoes'?100:280;
 const x=c.getContext('2d'),path=new Path2D(g.path);x.save();x.clip(path);x.fillStyle=g.color;x.fillRect(0,0,c.width,c.height);
 x.strokeStyle='#ffffff55';x.lineWidth=2;for(let y=0;y<c.height;y+=15){x.beginPath();x.moveTo(0,y);x.lineTo(240,y);x.stroke();}for(let col=0;col<240;col+=15){x.beginPath();x.moveTo(col,0);x.lineTo(col,c.height);x.stroke();}
 x.fillStyle='#fff';x.fillRect(102,65,36,24);x.fillStyle='#17253a';x.font='bold 14px sans-serif';x.fillText('32',110,82);
 if(name==='jacket'){x.clearRect(113,45,14,175);x.strokeStyle='#eed4ab';x.lineWidth=3;x.strokeRect(107,48,26,166);}
 x.restore();x.strokeStyle='#192c3b';x.lineWidth=2;x.stroke(path);
 const image=new Image();image.src=c.toDataURL('image/png');await image.decode();return image;
}
