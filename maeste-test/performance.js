/* Test-only diagnostics. ?perf=1 shows local UI and resource durations. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('perf') !== '1') return;
  const ready = () => {
    const stage = document.getElementById('card-stage');
    const dock = document.getElementById('movie-actions');
    if (!stage || !dock) return;
    const badge = document.createElement('output');
    badge.id = 'playit-performance';
    badge.setAttribute('aria-label','PLAYIT teljesítménymérés');
    badge.textContent = 'PERF · várakozás';
    document.body.append(badge);
    let pending = null, mark = 0;
    dock.addEventListener('click', event => {
      const btn = event.target.closest('#vote-yes,#vote-no,#vote-seen,#undo-vote');
      if (!btn || btn.disabled) return;
      pending = btn.id;
      mark = performance.now();
      badge.textContent = 'PERF · mérés…';
    }, {capture:true,passive:true});
    const observer = new MutationObserver(records => {
      if (!pending || !records.some(r => r.addedNodes.length)) return;
      const ms = Math.round(performance.now() - mark);
      const choice = pending.replace('vote-','').replace('undo-','undo');
      pending = null;
      badge.textContent = 'PERF · ' + choice + ': ' + ms + ' ms';
      badge.dataset.duration = String(ms);
    });
    observer.observe(stage,{childList:true});
    if ('PerformanceObserver' in window) {
      try {
        const resources = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!/\/api\/(discover|library|rooms|availability)/.test(entry.name)) continue;
            badge.dataset.lastApiMs = String(Math.round(entry.duration));
            badge.title = 'Utolsó API: '+Math.round(entry.duration)+' ms';
          }
        });
        resources.observe({type:'resource',buffered:true});
      } catch {}
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
