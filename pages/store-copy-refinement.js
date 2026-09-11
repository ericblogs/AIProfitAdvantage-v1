/* APEP Store copy refinement — presentation text only. */
(function () {
  const apply = () => {
    const panel = document.querySelector('.apep-store-free-resources');
    if (!panel) return;

    const heading = panel.querySelector('strong');
    const message = panel.querySelector('span');
    const link = panel.querySelector('a');

    if (heading) heading.textContent = 'Extend your APEP toolkit.';
    if (message) message.textContent = 'Explore free insights and resources that complement the digital products in this Store and help you get more from what you learn.';
    if (link) link.textContent = 'Explore Free Resources →';
  };

  const start = () => {
    apply();
    const panel = document.querySelector('.apep-store-free-resources');
    if (panel) {
      new MutationObserver(apply).observe(panel, { childList: true, subtree: true, characterData: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
