/**
 * Public Supabase configuration for the APEP browser client.
 *
 * IMPORTANT:
 * - SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are safe for browser use.
 * - NEVER place a Supabase secret/service-role key in this file.
 */
export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://ccxxokxkxhakwwzqwqgn.supabase.co',
  publishableKey: 'sb_publishable_OaCYNEZJpRPz-6oe15pKvA_jcNPQM-R'
});

// Store-page resilience: if the legacy inline product loader is interrupted by
// a browser/CDN/runtime error, load the independent catalogue fallback.
if (typeof window !== 'undefined' && /\/pages\/store\.html$/i.test(window.location.pathname)) {
  import('../pages/store-products-fallback.js').catch((error) => {
    console.error('APEP Store fallback loader could not start:', error);
  });
}
