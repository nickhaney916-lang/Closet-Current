import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 resolveAsset,htmlAssets,cssAssets,moduleAssets,checkStaticGraph,
 ENTRYPOINTS,CORE
} from '../scripts/audit-family-alpha-stage-assets-hold.mjs';

test('runtime URLs resolve within staging root and preserve build cache-busting',()=>{
 assert.equal(resolveAsset('index.html','app.js?v=0123456789ab'),'app.js');
 assert.equal(resolveAsset('nested/page.html','../css/site.css'),'css/site.css');
 assert.equal(resolveAsset('nested/app.mjs','./components/view.mjs'),'nested/components/view.mjs');
 assert.equal(resolveAsset('index.html','/icons/icon-192.png'),'icons/icon-192.png');
 for(const ref of [
  'https://evil.example/app.js','//evil.example/app.js',
  '../production.js','../../secrets.txt','//production.example/app.js',
  './photo%2f..%2fother.png','./file.js#x','file.js?secret=1',
  'file.js?v=wrong','C:\\Users\\key','', './'
 ])assert.throws(()=>resolveAsset('index.html',ref),/Unsafe|escapes|Directory|Empty/);
});

test('parse staging HTML entrypoint scripts, styles, icons, and manifest (not navigation links)',()=>{
 const html='<script src="auth.js?v=0123456789ab"></script>'+
   '<script type="module" src="figure.mjs"></script>'+
   '<link rel="stylesheet" href="style.css?v=0123456789ab">'+
   '<link rel="manifest" href="manifest.webmanifest">'+
   '<link rel="icon" href="icons/icon-192.png">'+
   '<a href="https://external.example/">Shop</a><link rel="canonical" href="https://external.example/">';
 assert.deepEqual(htmlAssets(html),[
  'auth.js?v=0123456789ab','figure.mjs','style.css?v=0123456789ab',
  'manifest.webmanifest','icons/icon-192.png'
 ]);
 assert.deepEqual(cssAssets("body{background:url('../images/bg.png')}"+
  "@import './forms.css';i{background:url(data:image/svg+xml;base64,abc)}"),
  ['../images/bg.png','./forms.css']);
 assert.deepEqual(moduleAssets("import './a.mjs';\n"+
  "import {x} from '../lib/b.mjs';\nexport {y} from './c.mjs';\n"+
  "const x=import('./lazy.mjs');"),
  ['./a.mjs','../lib/b.mjs','./c.mjs','./lazy.mjs']);
});

async function fixture(run){
 const dir=await mkdtemp(join(tmpdir(),'closet-alpha-assets-'));
 const files={
  'index.html':'<script type="module" src="main.mjs"></script><link rel="stylesheet" href="style.css"><link rel="manifest" href="manifest.webmanifest">',
  'phone-photo-check.html':'<script src="phone.js"></script>',
  'main.mjs':"import './modules/widget.mjs';",
  'modules/widget.mjs':"export {x} from '../modules/item.mjs';",
  'modules/item.mjs':'export const x=1;',
  'style.css':'body{background:url("images/background.png")}',
  'images/background.png':'synthetic fixture',
  'manifest.webmanifest':JSON.stringify({start_url:'./',scope:'./',icons:[{src:'icons/icon-192.png'}]}),
  'icons/icon-192.png':'synthetic fixture',
  'phone.js':'(function(){})();'
 };
 for(const [file,data] of Object.entries(files)){
  const target=join(dir,file);
  await mkdir(join(target,'..'),{recursive:true});
  await writeFile(target,data);
 }
 try{return await run(dir)}finally{await rm(dir,{recursive:true,force:true})}
}
test('synthetic complete static graph checks both HTML entrypoints and module/icon/CSS closure',async()=>{
 await fixture(async root=>{
  const result=await checkStaticGraph({root,core:['index.html','main.mjs'],
    entrypoints:['index.html','phone-photo-check.html'],minAssets:10});
  assert.equal(result.releaseGate,'HOLD');
  assert.equal(result.deployAllowed,false);
  assert.equal(result.missingReferencedAssets,0);
  assert.ok(result.referencedAssetCount>=8);
  assert.deepEqual(result.entrypoints,ENTRYPOINTS);
 });
});
test('missing imported module, CSS background or manifest icon fails closed',async()=>{
 for(const [file,replace] of [
  ['main.mjs',"import './missing.mjs';"],
  ['style.css',"body{background:url('images/nope.png')}"],
  ['manifest.webmanifest',JSON.stringify({icons:[{src:'icons/missing.png'}]})]
 ]){
  await fixture(async root=>{
   await writeFile(join(root,file),replace);
   await assert.rejects(checkStaticGraph({root,entrypoints:['index.html','phone-photo-check.html'],
      core:['index.html','main.mjs'],minAssets:10}),/Missing referenced staged resource/);
  });
 }
});
test('external linked executable or traversal module cannot be uploaded as accepted staging bundle',async()=>{
 for(const altered of [
  '<script src="https://production.example/app.js"></script>',
  '<script type="module" src="../escape.mjs"></script>',
  '<script src="http://example.com/thirdparty.js"></script>'
 ]){
  await fixture(async root=>{
   await writeFile(join(root,'index.html'),altered);
   await assert.rejects(checkStaticGraph({root,entrypoints:['index.html','phone-photo-check.html'],
    core:['index.html'],minAssets:10}),/Unsafe|escapes/);
  });
 }
});
test('symlinks, placeholder-only uploads and other incomplete artifacts are rejected',async()=>{
 await fixture(async root=>{
  await symlink(join(root,'main.mjs'),join(root,'modules','linked.mjs'));
  await assert.rejects(checkStaticGraph({root,entrypoints:ENTRYPOINTS,core:CORE,minAssets:10}),/Symlink/);
 });
 await fixture(async root=>{
  await assert.rejects(checkStaticGraph({root,core:CORE,minAssets:10}),/Missing required full-app asset/);
  await assert.rejects(checkStaticGraph({root,minAssets:1000}),/Full Family Alpha bundle absent/);
 });
});
