// Reuse the full Work43 journey with Work44's pinned board; all accounts mocked.
import {readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

let wrapper=await readFile('scripts/test-work43-full-browser.mjs','utf8');
function replace(a,b){assert.equal(wrapper.split(a).length,2,'Test wrapper changed');wrapper=wrapper.replace(a,b);}
replace("resolve('dist-work43-photo-board-HOLD')","resolve('dist-family-alpha-51-mobile-nav-HOLD')");
// Include all viewports for real-photo fixtures, not just the 390px baseline.
replace('once("for(const width of [320,390,430])", "for(const width of [390])");','once("for(const width of [320,390,430])", "for(const width of [320,390,430])");');
const marker="const p=join('scripts','.work43-browser-generated.mjs');";
assert.equal(wrapper.split(marker).length,2);
const extra=String.raw`
s=s.replace("textContent.includes('Clothes or account changed')", "textContent.includes('Could not complete this step')");
const navMarker="   const first=panel.locator";
assert.equal(s.split(navMarker).length,2,'Navigation injection anchor changed');
s=s.replace(navMarker, String.raw\x60
   // Scroll each control into view as a user would and hit-test its center.
   const controls=panel.locator('.alpha29-options button, .alpha29-options select');
   const navGap=await page.evaluate(()=>({pad:parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom),nav:document.querySelector('.main-nav').getBoundingClientRect().height}));
   assert.ok(navGap.pad>navGap.nav+16,JSON.stringify({test:'scroll-padding-versus-fixed-bottom-nav',browser:name,width,...navGap}));
   for(let j=0;j<await controls.count();j++){
    const control=controls.nth(j);await control.scrollIntoViewIfNeeded();
    const measure=()=>control.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return {reachable:!!top&&(top===e||e.contains(top)),name:e.getAttribute('aria-label')||e.textContent.trim(),x,y};});
    let hit=await measure();
    if(!hit.reachable){
     await mkdir('benchmark/family-alpha-52-touch-keyboard',{recursive:true});
     await page.screenshot({path:'benchmark/family-alpha-52-touch-keyboard/'+name.toLowerCase()+'-'+width+'-occluded.png'});
     console.log('FAMILY_ALPHA_52_UNREACHABLE',JSON.stringify({browser:name,width,...hit}));
    }
    assert.ok(hit.reachable,JSON.stringify({test:'mobile-control-hit-after-scroll',browser:name,width,...hit}));
   }
   await mkdir('benchmark/family-alpha-52-touch-keyboard',{recursive:true});
   await panel.locator('.alpha29-options article').first().getByRole('button',{name:'Save outfit 1',exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:'benchmark/family-alpha-52-touch-keyboard/'+name.toLowerCase()+'-'+width+'-control.png'});

   // Tab traversal is a real keyboard action; must land on actionable swap
   // and native focus scrolling must not position it under the fixed nav.
   const shoeSelector=panel.locator('.alpha29-options article').first().getByLabel('Replacement shoes outfit 1',{exact:true});
   await shoeSelector.focus();
   await page.keyboard.press('Tab');
   const shoeSwap=panel.locator('.alpha29-options article').first().getByRole('button',{name:'Swap shoes in outfit 1',exact:true});
   const focus=await shoeSwap.evaluate(e=>{
    const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);
    const style=getComputedStyle(e);
    return {focused:document.activeElement===e,reachable:hit===e||e.contains(hit),
      outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,rectHeight:r.height,
      insideViewport:y>=0&&y<innerHeight};
   });
   assert.ok(focus.focused&&focus.reachable&&focus.insideViewport&&focus.rectHeight>=44,
     JSON.stringify({test:'keyboard-native-tab-to-shoe-swap',browser:name,width,...focus}));
   assert.ok(focus.outlineStyle!=='none'&&parseFloat(focus.outlineWidth)>=2,
     JSON.stringify({test:'visible-keyboard-focus-outline',browser:name,width,...focus}));
   await page.screenshot({path:'benchmark/family-alpha-52-touch-keyboard/'+name.toLowerCase()+'-'+width+'-keyboard-focus.png'});

\x60+navMarker);
if(process.env.FAMILY_ALPHA_52_WEBKIT_ONLY==='1')s=s.replace("[['Chromium',chromium],['WebKit',webkit]]","[['WebKit',webkit]]");
`;
// Insert literal template delimiters after constructing the wrapper source.
wrapper=wrapper.replace(marker,extra.replaceAll('\\x60','`')+'\n'+marker);
// Exercise the real use-case through a native simulated touchscreen tap, not mouse click.
const swapAction="await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();";
assert.equal(wrapper.split(swapAction).length,2,'Real outfit swap touch anchor changed');
wrapper=wrapper.replace(swapAction,"await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).tap();");
const p='scripts/.family-alpha-52-wrapper.mjs';await mkdir('benchmark/family-alpha-52-touch-keyboard',{recursive:true});
try{await writeFile(p,wrapper);const result=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',timeout:900000,env:{...process.env,WORK43_LICENSED:'1'}});if(result.error)throw result.error;if(result.status!==0)throw Error('Family Alpha 51 browser journey failed: '+result.status);}finally{await rm(p,{force:true});}
