// QA forum shell: deliberately avoids the production script.js/auth initializer.
// Keeps only presentation concerns needed by the isolated Gate 11D forum page.

function setupMobileNavigation() {
  const nav = document.querySelector('.primary-nav');
  const headerInner = document.querySelector('.header-inner');
  if (!nav || !headerInner || document.querySelector('.menu-toggle')) return;

  const button = document.createElement('button');
  button.className = 'menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span aria-hidden="true">☰</span><span class="sr-only">Toggle navigation</span>';
  headerInner.appendChild(button);
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  });
}

function setupFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  footer.innerHTML = '<div class="container"><p>© 2026 AI Profit Advantage Enterprise. All rights reserved.</p></div>';
}

setupMobileNavigation();
setupFooter();
