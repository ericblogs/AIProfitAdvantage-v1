import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const isConfigured =
  SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('YOUR-PROJECT-REF') &&
  SUPABASE_CONFIG.publishableKey &&
  !SUPABASE_CONFIG.publishableKey.includes('YOUR_SUPABASE');

const supabase = isConfigured
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

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

function requireConfiguration() {
  if (isConfigured) return true;
  setStatus('Authentication is not connected yet. Add the APEP Supabase project URL and publishable key in config/supabase-config.js.', 'error');
  return false;
}

function getRedirect(path) {
  return new URL(path, window.location.href).href;
}

function pageName() {
  return window.location.pathname.split('/').pop().toLowerCase();
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

async function protectDashboard() {
  const isDashboardPage = window.location.pathname.includes('/dashboard/');
  if (!isDashboardPage || !supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const next = encodeURIComponent(window.location.href);
    window.location.href = `${getRedirect('../auth/login.html')}?next=${next}`;
  }
}

async function initLogin() {
  if (pageName() !== 'login.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form) return;

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = getRedirect('../dashboard/index.html');
      return;
    }
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('confirmed') === '1') setStatus('Email confirmed. You can now sign in to your APEP account.', 'success');
  if (params.get('reset') === 'success') setStatus('Password updated successfully. Please sign in again.', 'success');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;
    const email = form.querySelector('#email')?.value.trim();
    const password = form.querySelector('#password')?.value || '';
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Signing you in securely…');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    submit.disabled = false;
    if (error) {
      setStatus('We could not sign you in. Please check your email and password and try again.', 'error');
      return;
    }
    const next = params.get('next');
    window.location.href = next ? decodeURIComponent(next) : getRedirect('../dashboard/index.html');
  });
}

async function initRegister() {
  if (pageName() !== 'register.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;

    const get = (id) => form.querySelector(`#${id}`)?.value.trim() || '';
    const password = form.querySelector('#password')?.value || '';
    const confirm = form.querySelector('#confirm')?.value || '';

    if (!validatePassword(password)) {
      setStatus('Your password must contain at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      setStatus('The passwords do not match. Please check both password fields.', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Creating your APEP account…');
    const accountType = form.querySelector('input[name="account"]:checked')?.value || 'Student';

    const { data, error } = await supabase.auth.signUp({
      email: get('email'),
      password,
      options: {
        emailRedirectTo: getRedirect('login.html?confirmed=1'),
        data: {
          first_name: get('firstname'), last_name: get('lastname'), phone: get('phone'),
          country: get('country'), state: get('state'), profession: get('profession'),
          organization: get('organization'), username: get('username'), referral_code: get('referral'),
          learning_interest: form.querySelector('#interest')?.value || '', account_type: accountType,
          newsletter: !!form.querySelector('input[name="newsletter"]')?.checked
        }
      }
    });

    submit.disabled = false;
    if (error) {
      setStatus(error.message || 'Registration could not be completed. Please try again.', 'error');
      return;
    }
    if (data.session) {
      setStatus('Account created successfully. Redirecting to your dashboard…', 'success');
      window.location.href = getRedirect('../dashboard/index.html');
      return;
    }
    setStatus('Account created. Please check your email and confirm your address before signing in.', 'success');
    form.reset();
  });
}

async function initForgotPassword() {
  if (pageName() !== 'forgot-password.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Sending your secure password-reset link…');
    const email = form.querySelector('#email')?.value.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getRedirect('reset-password.html') });
    submit.disabled = false;
    if (error) {
      setStatus('We could not send the reset email. Please verify the address and try again.', 'error');
      return;
    }
    setStatus('If an account exists for that email, a password-reset link has been sent. Check your inbox.', 'success');
    form.reset();
  });
}

async function initResetPassword() {
  if (pageName() !== 'reset-password.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form || !requireConfiguration()) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    setStatus('Your password-reset link is missing or has expired. Please request a new one.', 'error');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = form.querySelector('#password')?.value || '';
    const confirm = form.querySelector('#confirm-password')?.value || '';
    if (!validatePassword(password)) {
      setStatus('Your new password must contain at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      setStatus('The new passwords do not match.', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Updating your password securely…');
    const { error } = await supabase.auth.updateUser({ password });
    submit.disabled = false;
    if (error) {
      setStatus('We could not update your password. Please request a fresh reset link and try again.', 'error');
      return;
    }
    await supabase.auth.signOut();
    window.location.href = getRedirect('login.html?reset=success');
  });
}

async function initAuth() {
  await protectDashboard();
  await initLogin();
  await initRegister();
  await initForgotPassword();
  await initResetPassword();
}

initAuth();
