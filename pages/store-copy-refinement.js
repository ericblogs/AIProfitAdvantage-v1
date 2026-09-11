/* APEP Store copy refinement — force-replaces the legacy free-resource wording. */
(function () {
  const OLD_HEADING = 'Not ready to buy?';
  const OLD_MESSAGE = 'Start with the free resources and find something useful to put into practice.';
  const NEW_HEADING = 'Extend your APEP toolkit.';
  const NEW_MESSAGE = 'Explore free insights and resources that complement the digital products in this Store and help you get more from what you learn.';
  const NEW_LINK = 'Explore Free Resources →';

  function refineStoreCopy() {
    const panel = document.querySelector('.apep-store-free-resources');
    if (panel) {
      const heading = panel.querySelector('strong');
      const message = panel.querySelector('span');
      const link = panel.querySelector('a');
      if (heading) heading.textContent = NEW_HEADING;
      if (message) message.textContent = NEW_MESSAGE;
      if (link) link.textContent = NEW_LINK;
    }

    // Safety net for any cached/static Store fragment that still contains the legacy wording.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue.includes(OLD_HEADING)) node.nodeValue = node.nodeValue.replace(OLD_HEADING, NEW_HEADING);
      if (node.nodeValue.includes(OLD_MESSAGE)) node.nodeValue = node.nodeValue.replace(OLD_MESSAGE, NEW_MESSAGE);
      if (node.nodeValue.trim() === 'Browse Free Resources →') node.nodeValue = NEW_LINK;
    });
  }

  function start() {
    refineStoreCopy();
    setTimeout(refineStoreCopy, 250);
    setTimeout(refineStoreCopy, 1000);
    setTimeout(refineStoreCopy, 2500);
    const observer = new MutationObserver(refineStoreCopy);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
