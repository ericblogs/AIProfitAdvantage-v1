import { APP_CONFIG } from './config/app-config.js';
import { BUSINESS_CONFIG } from './config/business-config.js';
import { RELEASE_CONFIG } from './config/release-config.js';
import { INTEGRATIONS_CONFIG } from './config/integrations-config.js';
import { validateConfig, publishValidationState } from './config/config-validator.js';
import { initializeNavigation, setCurrentYear } from './js/components.js';
import { initializeBusinessFoundation } from './js/modules/business-foundation.js';
import { initializeReleaseMetadata } from './js/modules/release-metadata.js';

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication, { once: true });
} else {
  initializeApplication();
}
