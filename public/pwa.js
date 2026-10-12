'use strict';
let installationPrompt;
const installButton=document.getElementById('installApp');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installationPrompt=event;installButton.textContent='Install Closet Current';});
window.addEventListener('appinstalled',()=>{installationPrompt=null;installButton.hidden=true;});
if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone)installButton.hidden=true;
installButton.onclick=async()=>{
 if(installationPrompt){const prompt=installationPrompt;installationPrompt=null;await prompt.prompt();await prompt.userChoice;return;}
 const help=document.getElementById('installHelp');help.hidden=!help.hidden;
};
// Sites currently authenticates the whole test site. Keep its sign-in pages
// out of offline caches. The independent public app can cache its own shell.
if('serviceWorker' in navigator&&!location.hostname.endsWith('.chatgpt.site')){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
