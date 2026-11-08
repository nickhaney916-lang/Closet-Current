import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node prepare-outfit-view-360-160.mjs <P159 browser harness> <output>');
let source=await readFile(input,'utf8');
const anchor='assert.equal(renderEvidence.length,6);';
assert.equal(source.split(anchor).length,2,'P159 original source-photo browser harness anchor changed');
const inject=String.raw`
if(process.env.P160==='1'){
 const outDir='benchmark/outfit-view-360-160';
 await mkdir(outDir,{recursive:true});
 const p160Rows=[];
 const canvas=page.locator('#outfit3D01Canvas');
 const takeP160=async(figure,view,expected)=>{
  await page.waitForTimeout(180);
  const rotationX=Number(await canvas.getAttribute('data-rotation'));
  assert.ok(Number.isFinite(rotationX),'P160 camera rotation diagnostic must be finite');
  if(expected==='center')assert.ok(Math.abs(rotationX)<.20,'P160 front/rear preset must center the original figure');
  if(expected==='right')assert.ok(rotationX>3.0,'P160 right-side/three-quarter view did not rotate toward +X');
  if(expected==='left')assert.ok(rotationX< -3.0,'P160 left-side view did not rotate toward -X');
  if(expected==='threequarter')assert.ok(rotationX>1.4&&rotationX<4.1,'P160 three-quarter view must sit between front/back and profile');
  const png=await page.screenshot({fullPage:false,animations:'disabled'});
  const meta=await sharp(png).metadata();
  assert.equal(meta.width,width);
  assert.ok(png.length>4500,'P160 angle screenshot must contain rendered app pixels');
  const file=figure+'-'+view+'-'+width+'.png';
  await writeFile(outDir+'/'+file,png);
  const overlay=JSON.parse(await canvas.getAttribute('data-humanoid150'));
  const board=await readBoard(page);
  assert.deepEqual(board,ownerOriginal,'P160 camera rotation must not mutate the owner's saved outfit');
  p160Rows.push({figure,view,nominalDegrees:{front:0,'threequarter-front-right':45,right:90,'threequarter-rear-right':135,rear:180,left:270}[view],width,file,sha256:digest(png),cameraX:rotationX,sourceRigBones:overlay.sourceRigBones,sourceHeadAttached:overlay.licensedHead157?.headAttachedToOriginal163Bone===true,neckBridgeTriangles:overlay.licensedHead157?.neckTransition159?.bridgeTriangles??0,ownerSavedBoardUnchanged:true,renderer:'real-WebGL',physicalDeviceTested:false,familyAlpha:'HOLD'});
 };
 const dragFrom=async(start,deltaDegrees)=>{
  await page.locator(start==='rear'?'#outfit3D01Back':'#outfit3D01Front').click();
  const box=await canvas.boundingBox();
  assert.ok(box&&box.height>100,'P160 actual outfit canvas is not visible');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  // OrbitControls changes theta by -2π*dx/canvasHeight.
  const dx=-deltaDegrees*box.height/360;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+dx,y,{steps:12});
  await page.mouse.up();
  await page.waitForTimeout(180);
 };
 for(const figure of ['female','male']){
  await page.locator('#outfit3D01Model').selectOption(figure);
  await marker(figure);
  await page.locator('#outfit3D01Front').click();
  await takeP160(figure,'front','center');
  await dragFrom('front',45);
  await takeP160(figure,'threequarter-front-right','threequarter');
  await page.locator('#outfit3D01Side').click();
  await takeP160(figure,'right','right');
  await dragFrom('rear',-45);
  await takeP160(figure,'threequarter-rear-right','threequarter');
  await page.locator('#outfit3D01Back').click();
  await takeP160(figure,'rear','center');
  await dragFrom('front',-90);
  await takeP160(figure,'left','left');
 }
 assert.equal(p160Rows.length,12);
 await writeFile(outDir+'/views-'+width+'.json',JSON.stringify(p160Rows,null,2)+'\n');
}
`;
source=source.replace(anchor,inject+'\n'+anchor);
await writeFile(output,source);
console.log(JSON.stringify({created:true,source:input,output,views:6,figures:2,widths:[320,390,430],sourceOwnerReadOnly:true}));
