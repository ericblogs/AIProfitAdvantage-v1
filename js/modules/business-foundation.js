import { getBusinessFoundationStatus } from '../../components/business/business-foundation.js';
import '../../js/modules/store-catalogue.js';

/**
 * Initializes approved RC-1.2.0 business foundation hooks.
 */
export function initializeBusinessFoundation() {
  const status = getBusinessFoundationStatus();
  document.documentElement.dataset.businessFoundation = status.status;
}
