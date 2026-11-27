'use strict';
let installationPrompt,installing=false,installed=false;
const installButton=document.getElementById('installApp');
const installHelp=document.getElementById('installHelp');
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 if(installed)return;
 installationPrompt=event;
 installButton.textContent='Install Closet Current';
});
window.addEventListener('appinstalled',()=>{
 installed=true;installationPrompt=null;installButton.hidden=true;installHelp.hidden=true;
});
if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){
 installed=true;installButton.hidden=true;
}
installButton.onclick=async()=>{
 if(installed||installing)return;
 if(!installationPrompt){installHelp.hidden=!installHelp.hidden;return;}
 const prompt=installationPrompt;installationPrompt=null;
 installing=true;installButton.disabled=true;
 try{
  await prompt.prompt();
  const choice=await prompt.userChoice;
  if(!installed&&choice?.outcome==='dismissed')installHelp.hidden=false;
 }catch{
  if(!installed)installHelp.hidden=false;
 }finally{
  installing=false;installButton.disabled=false;
  if(!installed)installButton.textContent=installationPrompt?'Install Closet Current':'Add to phone';
 }
};
// Sites currently authenticates the whole test site. Keep its sign-in pages
// out of offline caches. The independent public app can cache its own shell.
if('serviceWorker' in navigator&&!location.hostname.endsWith('.chatgpt.site')){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
