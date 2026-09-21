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

// Store-page resilience and presentation improvements are additive only.
if (typeof window !== 'undefined' && /\/pages\/store\.html$/i.test(window.location.pathname)) {
  const polishHref = new URL('../pages/store-polish.css', import.meta.url).href;
  if (!document.querySelector(`link[href="${polishHref}"]`)) {
    const polishLink = document.createElement('link');
    polishLink.rel = 'stylesheet';
    polishLink.href = polishHref;
    document.head.appendChild(polishLink);
  }
  // The Store has one dedicated product renderer. Avoid loading duplicate fallback modules.
}
