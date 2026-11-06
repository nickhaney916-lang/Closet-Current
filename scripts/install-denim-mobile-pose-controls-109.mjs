/**
 * PHOTO109: temporary, research-only, exact original 163-bone donor UI.
 * Install AFTER P103/104/105/106/108 original source-verified overlays.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const target=process.argv[2];
if(target!=='.photo103-donor-541')
 throw Error('PHOTO109 only permitted in detached original .photo103-donor-541 research donor');
const root=resolve(target);
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==
 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('PHOTO109 exact original CC0 163-bone source donor SHA required');
const htmlPath=join(root,'research/three-d-69/index.html');
let html=await readFile(htmlPath,'utf8');
const anchor='<script type="module" src="./index-to-real-garment-demo.mjs"></script></body></html>';
if(html.split(anchor).length!==2)
 throw Error('PHOTO109 unique existing original photo/3D research interface anchor unavailable');
html=html.replace(anchor,
 '<script type="module" src="./index-to-real-garment-demo.mjs"></script>'+
 '<script type="module" src="../three-d-109/mobile-pose-controls.mjs"></script>'+
 '</body></html>');
await mkdir(join(root,'research/three-d-109'),{recursive:true});
await copyFile('research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs',
 join(root,'research/three-d-109/mobile-pose-controls.mjs'));
await writeFile(htmlPath,html);
console.log('PHOTO109 genuine original licensed denim bilateral MOBILE controls inserted only in SHA-locked detached source research 163-bone donor; no application, staging, production, cloud or photograph changes.');
