/* PLAYIT TV Edition: VIDAA browser compatibility. Runs before the shared application. */
(function () {
  'use strict';
  if (typeof AbortSignal === 'undefined' || typeof AbortController === 'undefined') return;
  if (typeof AbortSignal.timeout !== 'function') {
    AbortSignal.timeout = function (milliseconds) {
      var controller = new AbortController();
      setTimeout(function () {
        try {
          var error = typeof DOMException === 'function'
            ? new DOMException('Timed out', 'TimeoutError')
            : Object.assign(new Error('Timed out'), { name: 'TimeoutError' });
          controller.abort(error);
        } catch (_) { controller.abort(); }
      }, milliseconds);
      return controller.signal;
    };
  }
  if (typeof AbortSignal.any !== 'function') {
    AbortSignal.any = function (signals) {
      var controller = new AbortController();
      var list = Array.prototype.slice.call(signals || []);
      function forward(signal) {
        if (controller.signal.aborted) return;
        try { controller.abort(signal.reason); }
        catch (_) { controller.abort(); }
      }
      list.forEach(function (signal) {
        if (!signal || typeof signal.addEventListener !== 'function') return;
        if (signal.aborted) forward(signal);
        else signal.addEventListener('abort', function () { forward(signal); }, { once: true });
      });
      return controller.signal;
    };
  }
}());