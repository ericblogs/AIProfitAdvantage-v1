import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const CONFIRMATION_REDIRECT_URL = 'https://www.aiprofitadvantage.online/dashboard/index.html';

function setStatus(message, type = 'info') {
  const status = document.getElementById('auth-status');
  if (!status) return;
  status.textContent = message;
  status.hidden = false;
  status.style.cssText = 'margin:18px 0;padding:14px 16px;border-radius:10px;font-weight:600;';
  status.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fef2f2' : '#eff6ff';
  status.style.color = type === 'success' ? '#047857' : type === 'error' ? '#b91c1c' : '#1d4ed8';
  status.style.border = `1px solid ${type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : '#bfdbfe'}`;
}

const form = document.getElementById('resend-form');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email')?.value.trim() || '';
  const submit = form.querySelector('button[type="submit"]');

  if (!email) {
    setStatus('Please enter your email address.', 'error');
    return;
  }

  if (submit) submit.disabled = true;
  setStatus('Sending a new confirmation email…');

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: CONFIRMATION_REDIRECT_URL }
    });

    if (error) {
      setStatus(error.message || 'We could not resend the confirmation email. Please try again.', 'error');
      return;
    }

    setStatus('Confirmation email sent. Check your inbox and spam/junk folder, then use the newest confirmation link.', 'success');
  } catch (error) {
    setStatus(error?.message || 'We could not connect to the authentication service. Please try again.', 'error');
  } finally {
    if (submit) submit.disabled = false;
  }
});
