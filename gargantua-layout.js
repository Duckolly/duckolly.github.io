/* GARGANTUA LAYOUT AUTO-FIT v2
   Calculate only the extra panel width needed to reach the right viewport edge.
   Does not access WebGL, iframe documents, or navigation handlers.
*/
(() => {
  'use strict';
  const grid = document.querySelector('#page-home .hero-grid');
  const panel = grid && grid.querySelector('.hero-art.gargantua-hero');
  if (!grid || !panel) return;

  let scheduled = false;
  function update() {
    scheduled = false;
    if (window.matchMedia('(max-width: 980px)').matches || !grid.getClientRects().length) {
      panel.style.setProperty('--gargantua-right-bleed', '0px');
      return;
    }
    const raw = getComputedStyle(grid).getPropertyValue('--gargantua-right-inset').trim();
    const parsed = Number.parseFloat(raw);
    const inset = Number.isFinite(parsed) ? Math.max(0, parsed) : 12;
    const viewportWidth = document.documentElement.clientWidth;
    const gridRight = grid.getBoundingClientRect().right;
    const bleed = Math.max(0, Math.round(viewportWidth - gridRight - inset));
    panel.style.setProperty('--gargantua-right-bleed', bleed + 'px');
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(schedule);
    observer.observe(grid);
  }
  schedule();
})();
