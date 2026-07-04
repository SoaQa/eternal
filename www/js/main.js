(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  const GAME = G.GAME;

  function boot() {
    try {
      GAME.UI.boot();
    } catch (e) {
      document.body.innerHTML = '<div style="padding:40px;color:#f88;font-family:monospace">Ошибка запуска: ' + (e && e.message) + '</div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
