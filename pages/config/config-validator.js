/**
 * Lightweight frontend configuration validator.
 * Keeps invalid public configuration visible during development.
 */
const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

export function validateConfig({
  APP_CONFIG,
  BUSINESS_CONFIG,
  RELEASE_CONFIG,
  INTEGRATIONS_CONFIG
} = {}) {
  return Boolean(
    APP_CONFIG &&
    BUSINESS_CONFIG &&
    RELEASE_CONFIG &&
    INTEGRATIONS_CONFIG &&
    isNonEmptyString(APP_CONFIG.name) &&
    isNonEmptyString(APP_CONFIG.release) &&
    isNonEmptyString(RELEASE_CONFIG.release) &&
    Number.isInteger(RELEASE_CONFIG.milestoneNumber) &&
    typeof APP_CONFIG.features?.enterpriseFoundation === 'boolean' &&
    typeof INTEGRATIONS_CONFIG.crm === 'boolean' &&
    typeof INTEGRATIONS_CONFIG.payments === 'boolean' &&
    APP_CONFIG.release === RELEASE_CONFIG.release &&
    BUSINESS_CONFIG.infrastructureRelease === RELEASE_CONFIG.release
  );
}

export function publishValidationState(isValid) {
  document.documentElement.dataset.config = isValid ? 'valid' : 'invalid';
}
