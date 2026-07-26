import { RELEASE_CONFIG } from './release-config.js';

/**
 * Application-wide public configuration.
 * Never place credentials, secret keys, or private endpoints in frontend code.
 */
export const APP_CONFIG = Object.freeze({
  name: 'AI Profit Advantage',
  release: RELEASE_CONFIG.release,
  environment: 'production',
  features: Object.freeze({
    enterpriseFoundation: true
  })
});
