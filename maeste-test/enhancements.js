/* PLAYIT mobile experiment: presentation only; the original game logic stays intact. */
(() => {
  'use strict';
  const onReady = () => {
    const providerRow = document.getElementById('quick-providers');
    const counter = document.querySelector('.discovery-header .edition-counter');
    if (providerRow && counter && !document.querySelector('.provider-strip')) {
      const strip = document.createElement('div');
      strip.className = 'provider-strip';
      providerRow.before(strip);
      strip.append(providerRow, counter);
    }

    const toast = document.getElementById('toast');
    if (toast) {
      const shorten = text => {
        const message = text.trim();
        if (message === 'A listádra került. Egy jó lehetőség estére.' ||
            message === 'A saját kedvenceid közé került.') return '✓ Kedvencekhez adva';
        if (message.startsWith('A látott történeteidhez mentettük.')) return '✓ Már láttam';
        if (message === 'Az előző film visszakerült.') return '↶ Visszavonva';
        return null;
      };
      let updating = false;
      const refresh = () => {
        if (updating || toast.hidden) return;
        const current = toast.textContent || '';
        const shortened = shorten(current);
        if (!shortened && /^[✓↶]/.test(current) && toast.dataset.compact === 'true') return;
        toast.dataset.compact = shortened ? 'true' : 'false';
        if (shortened && toast.textContent !== shortened) {
          updating = true;
          toast.textContent = shortened;
          updating = false;
        }
      };
      new MutationObserver(refresh).observe(toast, { childList:true, characterData:true, attributes:true, attributeFilter:['hidden'] });
      refresh();
    }

    const swipe = document.querySelector('.swipe-area');
    if (swipe && !document.getElementById('cinema-view-toggle')) {
      const toggle = document.createElement('button');
      toggle.id = 'cinema-view-toggle';
      toggle.type = 'button';
      toggle.textContent = '◉';
      toggle.setAttribute('aria-label', 'Plakátadatok elrejtése');
      toggle.setAttribute('aria-pressed', 'false');
      swipe.prepend(toggle);
      toggle.addEventListener('click', () => {
        const clean = document.body.classList.toggle('cinema-clean-poster');
        toggle.textContent = clean ? '▤' : '◉';
        toggle.setAttribute('aria-label', clean ? 'Plakátadatok megjelenítése' : 'Plakátadatok elrejtése');
        toggle.setAttribute('aria-pressed', String(clean));
      });
    }
    const shell = document.querySelector('.app-shell');
    if (shell) {
      const animateEntrance = () => {
        if (shell.hidden) return;
        shell.classList.remove('cinema-entering');
        void shell.offsetWidth;
        shell.classList.add('cinema-entering');
        setTimeout(() => shell.classList.remove('cinema-entering'), 750);
      };
      new MutationObserver(records => {
        if (records.some(record => record.attributeName === 'hidden') && !shell.hidden) animateEntrance();
      }).observe(shell, { attributes:true, attributeFilter:['hidden'] });
    }

    const dock = document.getElementById('movie-actions');
    if (dock) {
      let timer;
      dock.addEventListener('click', event => {
        const button = event.target.closest('#vote-yes,#vote-no,#vote-seen,#undo-vote');
        if (!button || button.disabled) return;
        dock.dataset.voteGlow = button.id;
        clearTimeout(timer);
        timer = setTimeout(() => { delete dock.dataset.voteGlow; }, 340);
      });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady, { once:true });
  else onReady();
})();
