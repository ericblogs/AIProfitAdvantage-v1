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

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';

  navigation.querySelectorAll('a').forEach((link) => {
    const label = link.textContent.trim();
    const destination = destinations[label];
    if (!destination) return;

    const destinationUrl = new URL(destination, window.location.origin);
    const isActive = destinationUrl.pathname === currentPath &&
      !destinationUrl.hash &&
      !['Home', 'Courses', 'Get Started', 'Register'].includes(label);

    link.classList.toggle('active', isActive);
  });

  const homeLink = Array.from(navigation.querySelectorAll('a')).find(
    (link) => link.textContent.trim() === 'Home'
  );

  if (homeLink) {
    homeLink.classList.toggle(
      'active',
      currentPath === '/index.html' || currentPath === '/'
    );
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
