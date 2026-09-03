import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function setLoginStatus(message, type = 'info', html = false) {
  let status = document.getElementById('auth-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'auth-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin:18px 0;padding:14px 16px;border-radius:10px;font-weight:600;';
    const form = document.querySelector('form.contact-form');
    if (form) form.prepend(status);
  }

  if (html) status.innerHTML = message;
  else status.textContent = message;
  status.hidden = false;
  status.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fef2f2' : '#eff6ff';
  status.style.color = type === 'success' ? '#047857' : type === 'error' ? '#b91c1c' : '#1d4ed8';
  status.style.border = `1px solid ${type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : '#bfdbfe'}`;
}

function showUnconfirmedMessage(email) {
  const safeEmail = email.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  setLoginStatus(
    `Your email address <strong>${safeEmail}</strong> has not been confirmed yet. ` +
    `Please check your inbox, or <a href="resend-confirmation.html">resend the confirmation email</a>.`,
    'error',
    true
  );
}

function getSafeDestination() {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  // Only allow redirects to known application destinations. This preserves the
  // existing dashboard guard while allowing provider onboarding to resume after login.
  if (redirect && (redirect === '/dashboard' || redirect === '/dashboard/' || redirect.startsWith('/dashboard/') || redirect === '/pages/provider-onboarding.html')) {
    return redirect;
  }
  return '/dashboard/index.html';
}

async function initializeProductionLogin() {
  if (!window.location.pathname.endsWith('/auth/login.html')) return;

  const form = document.querySelector('form.contact-form');
  if (!form || form.dataset.productionAuthFix === '1') return;
  form.dataset.productionAuthFix = '1';

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const destination = getSafeDestination();
    setLoginStatus(destination === '/pages/provider-onboarding.html' ? 'You are already signed in. Returning to provider onboarding…' : 'You are already signed in. Redirecting to your dashboard…', 'success');
    window.location.href = new URL(destination, window.location.origin).href;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const email = form.querySelector('#email')?.value.trim() || '';
    const password = form.querySelector('#password')?.value || '';
    const submit = form.querySelector('button[type="submit"]');

    if (!email) {
      setLoginStatus('Please enter your email address.', 'error');
      return;
    }

    if (!password) {
      setLoginStatus('Please enter your password.', 'error');
      return;
    }

    if (submit) submit.disabled = true;
    setLoginStatus('Signing you in securely…');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.code === 'email_not_confirmed' || /email.*not.*confirm/i.test(error.message || '')) {
          showUnconfirmedMessage(email);
        } else {
          setLoginStatus(error.message || 'Login failed. Please check your email and password.', 'error');
        }
        return;
      }

      if (!data.session) {
        setLoginStatus('Login could not be completed. Please try again.', 'error');
        return;
      }

      const destination = getSafeDestination();
      setLoginStatus(destination === '/pages/provider-onboarding.html' ? 'Login successful. Returning to provider onboarding…' : 'Login successful. Redirecting to your dashboard…', 'success');
      window.location.href = new URL(destination, window.location.origin).href;
    } catch (error) {
      setLoginStatus(error?.message || 'We could not connect to the authentication service. Please try again.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductionLogin, { once: true });
} else {
  initializeProductionLogin();
}
