import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const logoutButton = document.querySelector('[data-action="logout"]');

logoutButton?.addEventListener('click', async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = 'Signing out…';

  const { error } = await supabase.auth.signOut();

  if (error) {
    logoutButton.disabled = false;
    logoutButton.textContent = 'Logout';
    alert(error.message || 'Logout failed. Please try again.');
    return;
  }

  window.location.replace('../auth/login.html');
});
