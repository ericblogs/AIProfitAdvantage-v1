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
  const links = document.querySelectorAll('.primary-nav a');
  const destinations = {
    Resources: 'pages/resources.html',
    Community: 'pages/community.html',
    Store: 'pages/store.html',
    Blog: 'pages/blog.html',
    Login: 'auth/login.html'
  };

  links.forEach((link) => {
    const label = link.textContent.trim();
    const destination = destinations[label];
    if (destination && !link.closest('.dashboard-layout')) {
      link.setAttribute('href', destination);
    }
  });
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