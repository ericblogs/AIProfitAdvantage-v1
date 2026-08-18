import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

async function requireAuthenticatedSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    const loginUrl = new URL('../auth/login.html', window.location.href);
    loginUrl.searchParams.set('redirect', window.location.pathname + window.location.search);
    window.location.replace(loginUrl.href);
    return false;
  }

  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', requireAuthenticatedSession, { once: true });
} else {
  requireAuthenticatedSession();
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    const loginUrl = new URL('../auth/login.html', window.location.href);
    loginUrl.searchParams.set('redirect', window.location.pathname + window.location.search);
    window.location.replace(loginUrl.href);
  }
});
