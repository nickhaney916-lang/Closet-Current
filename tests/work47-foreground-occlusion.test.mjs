import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAlphaHumanoidFigure} from '../public/family-alpha-2d-photo-renderer.mjs';
import {createHumanoidForegroundOverlay,FOREGROUND_PARTS} from '../research/work47/occlusion.mjs';

class FakeSVG {
 constructor(name){this.name=name;this.attrs=new Map();this.children=[];this.style={};this.parent=null;}
 setAttribute(k,v){this.attrs.set(k,v);}
 getAttribute(k){return this.attrs.get(k)||null;}
 append(child){child.parent=this;this.children.push(child);}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}}
}
const fakeDocument={createElementNS(_ns,name){return new FakeSVG(name);}};
const partMap=svg=>new Map(svg.children.map(p=>[p.getAttribute('data-part'),p]));
test('foreground exactly reuses existing original humanoid anatomy, never clothing pixels or invented limbs',()=>{
 const base=createAlphaHumanoidFigure(fakeDocument);
 const overlay=createHumanoidForegroundOverlay(fakeDocument);
 const orig=partMap(base),newParts=partMap(overlay);
 assert.equal(newParts.size,7);
 assert.deepEqual([...newParts.keys()].sort(),FOREGROUND_PARTS.filter(p=>orig.has(p)).sort());
 for(const [part,svg] of newParts){
  assert.equal(svg.name,orig.get(part).name);
  assert.deepEqual([...svg.attrs.entries()],[...orig.get(part).attrs.entries()],part);
 }
 for(const excluded of ['torso','left-arm','right-arm','left-leg','right-leg',
                          'left-foot','right-foot','ground-shadow','shoulder-highlight']){
  assert.equal(newParts.has(excluded),false,excluded);
 }
 assert.equal(overlay.getAttribute('data-humanoid-overlay'),'reviewed-anatomy-v1');
 assert.equal(overlay.style.pointerEvents,'none');
 assert.equal(overlay.getAttribute('aria-hidden'),'true');
 assert.equal(base.children.length>overlay.children.length,true);
});
test('render path places anatomical foreground AFTER actual fitted canvas, never after fallback photo',async()=>{
 const render=await readFile('research/work47/render.mjs','utf8');
 assert.match(render,/frame\.append\(canvas\);frame\.append\(createHumanoidForegroundOverlay\(document\)\)/);
 assert.match(render,/renderBaseline\(host,image,row\)\{renderPhotoLayers/);
 assert.doesNotMatch(render,/toDataURL\(|fetch\(|new Image\(/);
});
test('app fit creates at most one foreground, removes it on reset and owner/session disposal',async()=>{
 const editor=await readFile('research/work47/editor.mjs','utf8');
 assert.match(editor,/const anatomy=foreground\?null:createHumanoidForegroundOverlay\(doc\)/);
 assert.match(editor,/if\(anatomy\)\{foreground=anatomy;frame\.append\(foreground\);\}/);
 assert.match(editor,/if\(!records\.size\)\{foreground\?\.remove\(\);foreground=null/);
 assert.match(editor,/records\.clear\(\);foreground\?\.remove\(\);foreground=null/);
 assert.match(editor,/sessionTarget\.addEventListener\('closet:alpha-session-changed',clear\)/);
 assert.match(editor,/if\(!check\(\)\)return/);
 assert.doesNotMatch(editor,/(localStorage|indexedDB|fetch\(|XMLHttpRequest|source\.src\s*=)/);
});
test('new foreground module bundles only in offline candidate; prod remains untouched',async()=>{
 const build=await readFile('scripts/build-work47-fit-hold.mjs','utf8');
 assert.match(build,/\['editor\.mjs','fit\.mjs','edge-fringe\.mjs'\]/);
 assert.match(build,/const compiled=offline\.replace\(from,/);
 assert.match(build,/Unexpected inherited asset change/);
 assert.match(build,/deploymentAuthorized:false/);
 const overlay=await readFile('research/work47/occlusion.mjs','utf8');
 assert.doesNotMatch(overlay,/(fetch\(|XMLHttpRequest|localStorage|indexedDB|toDataURL|image\.src|body\.innerHTML)/);
});

test('compiled app imports original vetted renderer from bundle root, while localhost uses source path',async()=>{
 const source=await readFile('research/work47/occlusion.mjs','utf8');
 const built=await readFile('dist-work47-garment-fit-HOLD/__alpha_research/work47/occlusion.mjs','utf8');
 const from="from '../../public/family-alpha-2d-photo-renderer.mjs'";
 const to="from '../../family-alpha-2d-photo-renderer.mjs'";
 assert.equal(source.split(from).length,2);
 assert.equal(built,source.replace(from,to));
 const bundledRenderer=await readFile('dist-work47-garment-fit-HOLD/family-alpha-2d-photo-renderer.mjs','utf8');
 assert.match(bundledRenderer,/export function createAlphaHumanoidFigure/);
 assert.match(built,/createAlphaHumanoidFigure/);
});

test('protected compiled refined humanoid preserves actual face and finger features without covered limbs',async()=>{
 const renderer=await import('../dist-work47-garment-fit-HOLD/family-alpha-2d-photo-renderer.mjs');
 const overlaySource=await import('../dist-work47-garment-fit-HOLD/__alpha_research/work47/occlusion.mjs');
 const source=partMap(renderer.createAlphaHumanoidFigure(fakeDocument));
 const foreground=overlaySource.createHumanoidForegroundOverlay(fakeDocument);
 const actual=partMap(foreground);
 for(const required of ['neck','head','left-hand','right-hand','left-ear','right-ear',
   'left-fingers','right-fingers','left-eye','right-eye','nose','mouth','chin']){
  assert.ok(actual.has(required),'Refined source detail not visible '+required);
  assert.deepEqual([...actual.get(required).attrs.entries()],
                   [...source.get(required).attrs.entries()],
                   'Refined detail must match source exactly '+required);
 }
 for(const excluded of ['torso','left-arm','right-arm','left-leg','right-leg',
                        'left-foot','right-foot','ground-shadow','shoulder-highlight','collarbone']){
  assert.equal(actual.has(excluded),false,'Covered-body artwork must remain behind garment '+excluded);
 }
 assert.equal(foreground.getAttribute('data-humanoid'),'foreground-anatomy-v1');
 assert.equal(foreground.style.pointerEvents,'none');
});
