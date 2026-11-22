/* Retro mobile dialer skin for the EXISTING server password flow. */
(() => {
  'use strict';
  function setup() {
    const form = document.getElementById('access-form');
    const password = document.getElementById('access-password');
    if (!form || !password || form.querySelector('.retro-phone')) return;
    const phone = document.createElement('div');
    phone.className = 'retro-phone';
    phone.innerHTML = '<div class="retro-phone-head"><span>PLAYIT · SECRET LINE</span><span class="retro-signal" aria-hidden="true">● ● ●</span></div><div class="retro-dial-screen"><span aria-hidden="true">✦</span><span class="retro-dots" aria-label="A megadott karakterek száma">—</span></div><div class="retro-keypad" role="group" aria-label="Régi telefon billentyűzete"></div><div class="retro-phone-tools"><button type="button" class="retro-clear">Törlés</button><span id="retro-mode-label">Számbevitel</span><button type="button" class="retro-keyboard">Billentyűzet</button></div><p class="retro-hint">* = ABC / 123 · # = visszatörlés · betűknél többszöri nyomás</p>';
    const labels = [['1','.,!?@1'],['2','ABC2'],['3','DEF3'],['4','GHI4'],['5','JKL5'],['6','MNO6'],['7','PQRS7'],['8','TUV8'],['9','WXYZ9'],['*','ABC'],['0','SPACE'],['#','⌫']];
    const keypad = phone.querySelector('.retro-keypad');
    labels.forEach(([digit,letters]) => {
      const key = document.createElement('button');
      key.type = 'button'; key.className='retro-key'; key.dataset.key=digit;
      key.innerHTML = '<strong>'+digit+'</strong><small>'+letters+'</small>';
      key.setAttribute('aria-label',digit==='*'?'Betű és szám mód váltása':digit==='#'?'Utolsó karakter törlése':digit+' '+letters);
      keypad.append(key);
    });
    password.before(phone);
    const dots = phone.querySelector('.retro-dots');
    let letterMode = false, lastKey = '', lastAt = 0, lastLength = 0;
    const characterMap = {'1':'.,!?@1','2':'abc2','3':'def3','4':'ghi4','5':'jkl5','6':'mno6','7':'pqrs7','8':'tuv8','9':'wxyz9','0':' 0'};
    function update() {
      const n = password.value.length;
      dots.textContent = n ? '●'.repeat(Math.min(n,12))+(n>12?' +':'') : '—';
      dots.setAttribute('aria-label',n+' karakter megadva');
      phone.querySelector('#retro-mode-label').textContent=letterMode?'ABC · betűbevitel':'123 · számbevitel';
      phone.classList.toggle('retro-letters',letterMode);
    }
    function insert(value,replaceLast=false) {
      const original=password.value;
      password.value=replaceLast?original.slice(0,-1)+value:original+value;
      password.dispatchEvent(new Event('input',{bubbles:true}));
      update();
    }
    keypad.addEventListener('click', event => {
      const key=event.target.closest('.retro-key'); if(!key || password.disabled) return;
      const k=key.dataset.key;
      if(k==='*') {letterMode=!letterMode;lastKey='';update();return;}
      if(k==='#') {password.value=password.value.slice(0,-1);lastKey='';update();return;}
      const now=Date.now();
      if(!letterMode) {insert(k);lastKey='';return;}
      const group=characterMap[k];
      const repeat=k===lastKey && now-lastAt<900 && password.value.length===lastLength;
      const previous=repeat?group.indexOf(password.value.slice(-1)):-1;
      insert(group[repeat?(previous+1)%group.length:0],repeat);
      lastKey=k;lastAt=now;lastLength=password.value.length;
    });
    phone.querySelector('.retro-clear').addEventListener('click',()=>{password.value='';lastKey='';update();});
    phone.querySelector('.retro-keyboard').addEventListener('click',()=>{
      const open=phone.classList.toggle('retro-native');
      password.classList.toggle('retro-visible-input',open);
      password.focus();
      phone.querySelector('.retro-keyboard').textContent=open?'Tárcsázó':'Billentyűzet';
    });
    password.addEventListener('input',()=>{lastKey='';update();});
    update();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
