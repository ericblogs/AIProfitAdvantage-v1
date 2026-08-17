import { APP_CONFIG } from './config/app-config.js';
import { BUSINESS_CONFIG } from './config/business-config.js';
import { RELEASE_CONFIG } from './config/release-config.js';
import { INTEGRATIONS_CONFIG } from './config/integrations-config.js';
import { validateConfig, publishValidationState } from './config/config-validator.js';
import { initializeNavigation, setCurrentYear } from './js/components.js';
import { initializeBusinessFoundation } from './js/modules/business-foundation.js';
import { initializeReleaseMetadata } from './js/modules/release-metadata.js';
import './js/supabase-auth.js';

function initializeApplication() {
  const valid = validateConfig({ APP_CONFIG, BUSINESS_CONFIG, RELEASE_CONFIG, INTEGRATIONS_CONFIG });
  publishValidationState(valid);
  if (!valid) {
    document.documentElement.dataset.initialization = 'failed';
    return;
  }
  initializeReleaseMetadata();
  initializeNavigation();
  initializeBusinessFoundation();
  setCurrentYear();
}

function initializePublicNavigationLinks() {
  const navigation = document.querySelector('.primary-nav');
  if (!navigation || navigation.closest('.dashboard-layout')) return;

  const destinations = {
    Home: '/index.html',
    About: '/pages/about.html',
    Courses: '/index.html#courses',
    Services: '/pages/services.html',
    Resources: '/pages/resources.html',
    Community: '/pages/community.html',
    Store: '/pages/store.html',
    Blog: '/pages/blog.html',
    Contact: '/pages/contact.html',
    Login: '/auth/login.html',
    Register: '/auth/register.html',
    'Get Started': '/index.html#pricing'
  };

  const links = navigation.querySelectorAll('a');

  links.forEach((link) => {
    const label = link.textContent.trim();
    const destination = destinations[label];
    if (destination) link.setAttribute('href', destination);
  });

  if (!navigation.querySelector('a[href="/auth/register.html"]')) {
    const getStarted = Array.from(links).find(
      (link) => link.textContent.trim() === 'Get Started'
    );

    const register = document.createElement('a');
    register.className = 'nav-cta';
    register.href = '/auth/register.html';
    register.textContent = 'Register';

    if (getStarted) navigation.insertBefore(register, getStarted);
    else navigation.appendChild(register);
  }

  // Keep the current public navigation item visibly highlighted.
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  const currentHash = window.location.hash;

  navigation.querySelectorAll('a').forEach((link) => {
    const label = link.textContent.trim();
    const destination = destinations[label];
    if (!destination) return;

    const destinationUrl = new URL(destination, window.location.origin);
    let isActive = destinationUrl.pathname === currentPath;

    // Section links on the homepage should highlight when that section is active.
    if (destinationUrl.pathname === currentPath && destinationUrl.hash) {
      isActive = destinationUrl.hash === currentHash;
    }

    // Register/Login should also receive the active state on their own pages.
    link.classList.toggle('active', isActive);
  });

  // Home remains active on the root homepage when no section anchor is selected.
  const homeLink = Array.from(navigation.querySelectorAll('a')).find(
    (link) => link.textContent.trim() === 'Home'
  );

  if (homeLink) {
    homeLink.classList.toggle(
      'active',
      (currentPath === '/index.html' || currentPath === '/') && !currentHash
    );
  }

  // Add the visual active state once, without requiring changes to every page.
  if (!document.getElementById('public-nav-active-style')) {
    const style = document.createElement('style');
    style.id = 'public-nav-active-style';
    style.textContent = `
      .primary-nav > a.active:not(.nav-cta) {
        color: var(--blue) !important;
        position: relative;
      }
      .primary-nav > a.active:not(.nav-cta)::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -0.55rem;
        height: 3px;
        border-radius: 999px;
        background: var(--blue);
      }
      .primary-nav > a.active.nav-cta {
        background: var(--blue) !important;
        color: #fff !important;
        box-shadow: 0 8px 18px rgba(18,102,237,.25);
      }
      @media (max-width: 900px) {
        .primary-nav > a.active:not(.nav-cta)::after {
          bottom: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
    initializePublicNavigationLinks();
  }, { once: true });
} else {
  initializeApplication();
  initializePublicNavigationLinks();
}