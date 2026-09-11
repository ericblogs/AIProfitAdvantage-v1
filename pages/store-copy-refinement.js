/* APEP Store copy refinement — presentation text only. */
(function () {
  const ready = () => {
    const panel = document.querySelector('.apep-store-free-resources');
    if (!panel) return;

    const heading = panel.querySelector('strong');
    const message = panel.querySelector('span');
    const link = panel.querySelector('a');

    if (heading) heading.textContent = 'Start with something useful.';
    if (message) message.textContent = 'Explore practical free resources, insights and tools you can apply to your work, business or professional development today.';
    if (link) link.textContent = 'Explore Free Resources →';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();
