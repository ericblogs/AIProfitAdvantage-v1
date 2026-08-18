import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const RESET_PAGE_URL = 'https://www.aiprofitadvantage.online/auth/reset-password.html';

function setStatus(message, type = 'info') {
  let status = document.getElementById('auth-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'auth-status';
    status.setAttribute('role', 'status');
    status.style.cssText = 'margin:18px 0;padding:14px 16px;border-radius:10px;font-weight:600;';
    const form = document.querySelector('form.contact-form');
    if (form) form.prepend(status);
  }
  status.textContent = message;
  status.hidden = false;
  status.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fef2f2' : '#eff6ff';
  status.style.color = type === 'success' ? '#047857' : type === 'error' ? '#b91c1c' : '#1d4ed8';
  status.style.border = `1px solid ${type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : '#bfdbfe'}`;
}

async function initializeForgotPassword() {
  if (!window.location.pathname.endsWith('/auth/forgot-password.html')) return;

  const form = document.querySelector('form.contact-form');
  if (!form || form.dataset.productionAuthFix === '1') return;
  form.dataset.productionAuthFix = '1';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const email = form.querySelector('#email')?.value.trim() || '';
    const submit = form.querySelector('button[type="submit"]');

    if (!email) {
      setStatus('Please enter your registered email address.', 'error');
      return;
    }

    if (submit) submit.disabled = true;
    setStatus('Sending your secure password reset link…');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_PAGE_URL
      });

      if (error) {
        setStatus(error.message || 'We could not send the password reset email. Please try again.', 'error');
        return;
      }

      setStatus('If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.', 'success');
      form.reset();
    } catch (error) {
      setStatus(error?.message || 'We could not connect to the authentication service. Please try again.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

async function initializeResetPassword() {
  if (!window.location.pathname.endsWith('/auth/reset-password.html')) return;

  const form = document.querySelector('form.contact-form');
  if (!form || form.dataset.productionAuthFix === '1') return;
  form.dataset.productionAuthFix = '1';

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setStatus('This password reset link is invalid or has expired. Please request a new reset link.', 'error');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const password = form.querySelector('#password')?.value || '';
    const confirm = form.querySelector('#confirm')?.value || '';
    const submit = form.querySelector('button[type="submit"]');

    if (password.length < 8) {
      setStatus('Your new password must contain at least 8 characters.', 'error');
      return;
    }

    if (password !== confirm) {
      setStatus('The passwords do not match. Please check both fields.', 'error');
      return;
    }

    if (submit) submit.disabled = true;
    setStatus('Updating your password…');

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus(error.message || 'We could not update your password. Please request a new reset link.', 'error');
        return;
      }

      setStatus('Password updated successfully. Redirecting you to login…', 'success');
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = new URL('login.html', window.location.href).href;
      }, 1200);
    } catch (error) {
      setStatus(error?.message || 'We could not update your password. Please try again.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeForgotPassword();
    initializeResetPassword();
  }, { once: true });
} else {
  initializeForgotPassword();
  initializeResetPassword();
}
