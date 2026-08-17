/**
 * Public Supabase configuration for the APEP browser client.
 *
 * IMPORTANT:
 * - SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are safe for browser use.
 * - NEVER place a Supabase secret/service-role key in this file.
 * - Replace the placeholders with the values from your Supabase project.
 */
export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  publishableKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY'
});
