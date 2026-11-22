/* Cinema dial pad for the EXISTING server-side password check. */
(() => {
  'use strict';
  function setup() {
    const form = document.getElementById('access-form');
    const password = document.getElementById('access-password');
    if (!form || !password || form.querySelector('.retro-phone')) return;
    const phone = document.createElement('div');
    phone.className = 'retro-phone';
    phone.innerHTML = '<div class="retro-phone-head"><span>ADD MEG A JELSZÓT</span></div><div class="retro-dial-screen"><span class="retro-dots" role="status" aria-live="polite" aria-label="Üres jelszómező"><span class="retro-caret" aria-hidden="true"></span></span></div><div class="retro-keypad" role="group" aria-label="Régi telefon billentyűzete"></div><div class="retro-phone-tools"><button type="button" class="retro-clear" aria-label="Utolsó karakter törlése">⌫ <span>Vissza</span></button><button type="button" class="retro-mode-switch" aria-pressed="false" aria-label="Betűbevitel bekapcsolása">123 <span>/</span> ABC</button><button type="button" class="retro-keyboard">Billentyűzet</button></div><p class="retro-hint">Betűk: ugyanazt a gombot többször megnyomva választhatsz.</p>';
    const labels = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*','ABC'],['0','+'],['#','⌫']];
    const keypad = phone.querySelector('.retro-keypad');
    labels.forEach(([digit, letters]) => {
      const key = document.createElement('button');
      key.type = 'button'; key.className = 'retro-key'; key.dataset.key = digit;
      key.innerHTML = '<strong>' + digit + '</strong><small>' + (letters || '&nbsp;') + '</small>';
      key.setAttribute('aria-label', digit === '*' ? 'ABC és 123 váltása' : digit === '#' ? 'Utolsó karakter törlése' : digit + ' ' + letters);
      keypad.append(key);
    });
    password.before(phone);
    phone.querySelector('.retro-dial-screen').append(password);
    password.classList.add('retro-visible-input');
    password.readOnly = true;
    const dots = phone.querySelector('.retro-dots');
    const switchButton = phone.querySelector('.retro-mode-switch');
    const error = document.getElementById('access-error');
    let letterMode = false, lastKey = '', lastAt = 0, lastLength = 0;
    const characterMap = {'1':'.,!?@1','2':'abc2','3':'def3','4':'ghi4','5':'jkl5','6':'mno6','7':'pqrs7','8':'tuv8','9':'wxyz9','0':' 0'};
    function update() {
      const n = password.value.length;
      dots.textContent = n ? '●'.repeat(Math.min(n,16)) + (n > 16 ? ' +' : '') : '';
      if (!n) {
        const caret = document.createElement('span');
        caret.className = 'retro-caret'; caret.setAttribute('aria-hidden','true');
        dots.append(caret);
      }
      dots.setAttribute('aria-label', n ? n + ' karakter beírva' : 'Üres jelszómező');
      switchButton.setAttribute('aria-pressed', String(letterMode));
      switchButton.setAttribute('aria-label', letterMode ? 'Számbevitel bekapcsolása' : 'Betűbevitel bekapcsolása');
      phone.classList.toggle('retro-letters', letterMode);
      // Keep the same top screen for both touch keys and the native keyboard.
      phone.classList.toggle('retro-native', !password.readOnly);
    }
    function changePassword(next) {
      password.value = next;
      password.dispatchEvent(new Event('input', {bubbles:true}));
      update();
    }
    function setMode(next) { letterMode = next; lastKey = ''; update(); }
    switchButton.addEventListener('click', () => setMode(!letterMode));
    keypad.addEventListener('click', event => {
      const key = event.target.closest('.retro-key');
      if (!key || password.disabled) return;
      const k = key.dataset.key;
      if (k === '*') { setMode(!letterMode); return; }
      if (k === '#') { changePassword(password.value.slice(0,-1)); lastKey = ''; return; }
      if (!letterMode) { changePassword(password.value + k); lastKey = ''; return; }
      const now = Date.now(), group = characterMap[k];
      const repeat = k === lastKey && now - lastAt < 1000 && password.value.length === lastLength;
      const previous = repeat ? group.indexOf(password.value.slice(-1)) : -1;
      const value = group[repeat ? (previous + 1) % group.length : 0];
      changePassword(repeat ? password.value.slice(0,-1) + value : password.value + value);
      lastKey = k; lastAt = now; lastLength = password.value.length;
    });
    phone.querySelector('.retro-clear').addEventListener('click', () => {
      changePassword(password.value.slice(0,-1)); lastKey = '';
    });
    phone.querySelector('.retro-keyboard').addEventListener('click', () => {
      const open = password.readOnly;
      password.readOnly = !open;
      phone.classList.toggle('retro-native', open);
      phone.querySelector('.retro-keyboard').textContent = open ? 'Tárcsázó' : 'Billentyűzet';
      if (open) password.focus({preventScroll:true}); else { password.blur(); update(); }
    });
    password.addEventListener('input', () => { lastKey = ''; update(); });
    // The original application focuses the password when the gate opens.
    // In dial-pad mode prevent that focus from opening a second input surface.
    password.addEventListener('focus', () => {
      if (password.readOnly) queueMicrotask(() => password.blur());
    });
    if (error) {
      let wasVisible = false;
      const observeError = () => {
        const visible = !error.hidden && Boolean(error.textContent.trim());
        if (visible && !wasVisible) {
          phone.classList.remove('retro-error');
          void phone.offsetWidth;
          phone.classList.add('retro-error');
        }
        wasVisible = visible;
      };
      new MutationObserver(observeError).observe(error,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['hidden']});
    }
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true});
  else setup();
})();
