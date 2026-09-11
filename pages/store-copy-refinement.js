/* APEP Store copy refinement — presentation text only. */
(function () {
  const ready = () => {
    const panel = document.querySelector('.apep-store-free-resources');
    if (!panel) return;

    const heading = panel.querySelector('strong');
    const message = panel.querySelector('span');
    const link = panel.querySelector('a');

    if (heading) heading.textContent = 'Keep building with APEP.';
    if (message) message.textContent = 'Explore free resources and insights that complement our digital products and help you put what you learn into practice.';
    if (link) link.textContent = 'Explore Free Resources →';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();
