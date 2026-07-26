import { RELEASE_CONFIG } from '../../config/release-config.js';

/**
 * Shared business infrastructure interface.
 */
const STATUS = Object.freeze({
  release: RELEASE_CONFIG.release,
  status: 'foundation-ready'
});

export function getBusinessFoundationStatus() {
  return STATUS;
}
