/* PLAYIT 2 private access: compact cinema code dial; backend password remains unchanged. */
(() => {
 'use strict';
 function setup(){
  const form=document.getElementById('access-form'),password=document.getElementById('access-password');
  if(!form||!password||form.querySelector('.retro-phone'))return;
  const phone=document.createElement('div');phone.className='retro-phone';
  phone.innerHTML='<div class="retro-phone-head">A PRIVÁT MOZI KULCSA</div><div class="retro-dial-screen"><span class="retro-dots" aria-hidden="true"></span></div><div class="retro-keypad" role="group" aria-label="Számok 1-től 8-ig"></div><div class="retro-phone-tools"><button type="button" class="retro-clear" aria-label="Utolsó számjegy törlése">⌫ Vissza</button><span class="retro-mode-hint">PLAYIT ACCESS</span><button type="button" class="retro-keyboard">Teljes billentyűzet</button></div>';
  const keypad=phone.querySelector('.retro-keypad');
  for(let n=1;n<=8;n++){const key=document.createElement('button');key.type='button';key.className='retro-key';key.dataset.key=String(n);key.innerHTML='<strong>'+n+'</strong>';key.setAttribute('aria-label',n+'. számjegy');keypad.append(key);}
  password.before(phone);phone.querySelector('.retro-dial-screen').append(password);
  password.classList.add('retro-visible-input');password.readOnly=true;
  const dots=phone.querySelector('.retro-dots'),keyboard=phone.querySelector('.retro-keyboard'),error=document.getElementById('access-error');
  function update(){const n=password.value.length;dots.textContent=n?'●'.repeat(Math.min(n,18)):'';phone.classList.toggle('retro-native',!password.readOnly);}
  function change(value){password.value=value;password.dispatchEvent(new Event('input',{bubbles:true}));update();}
  keypad.addEventListener('click',event=>{const key=event.target.closest('[data-key]');if(key&&!password.disabled)change(password.value+key.dataset.key);});
  phone.querySelector('.retro-clear').addEventListener('click',()=>change(password.value.slice(0,-1)));
  keyboard.addEventListener('click',()=>{const enabled=password.readOnly;password.readOnly=!enabled;keyboard.textContent=enabled?'Számtárcsa':'Teljes billentyűzet';update();if(enabled)password.focus({preventScroll:true});else password.blur();});
  password.addEventListener('input',update);
  password.addEventListener('focus',()=>{if(password.readOnly)queueMicrotask(()=>password.blur());});
  if(error){let showing=false;new MutationObserver(()=>{const current=!error.hidden&&!!error.textContent.trim();if(current&&!showing){phone.classList.remove('retro-error');void phone.offsetWidth;phone.classList.add('retro-error');}showing=current;}).observe(error,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['hidden']});}
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();