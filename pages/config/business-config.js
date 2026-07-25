import { RELEASE_CONFIG } from './release-config.js';

/**
 * Public business configuration for RC-1.2.0.
 * No private credentials or secrets may be stored here.
 */
export const BUSINESS_CONFIG = Object.freeze({
  company: "AI Profit Advantage",
  founder: "Prince S. Eric John",
  infrastructureRelease: RELEASE_CONFIG.release,
  integrations: Object.freeze({
    crm: "planned",
    payments: "planned",
    analytics: "planned"
  })
});
