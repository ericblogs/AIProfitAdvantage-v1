// APEP Community Forum — production client configuration.
// Reuses the authoritative public browser configuration used by APEP authentication.
import { SUPABASE_CONFIG } from './supabase-config.js';

export const FORUM_CONFIG = Object.freeze({
  url: SUPABASE_CONFIG.url,
  publishableKey: SUPABASE_CONFIG.publishableKey
});
