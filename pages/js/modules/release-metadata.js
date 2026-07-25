import { RELEASE_CONFIG } from '../../config/release-config.js';

export function initializeReleaseMetadata() {
  document.documentElement.dataset.release = RELEASE_CONFIG.release;
  document.documentElement.dataset.milestone = String(RELEASE_CONFIG.milestoneNumber);
  return RELEASE_CONFIG;
}
