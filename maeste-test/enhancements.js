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
        const shortened = shorten(toast.textContent || '');
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
