import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const isConfigured =
  SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('YOUR-PROJECT-REF') &&
  SUPABASE_CONFIG.publishableKey &&
  !SUPABASE_CONFIG.publishableKey.includes('YOUR_SUPABASE');

const supabase = isConfigured
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

function setStatus(message, type = 'info') {
  const status = document.getElementById('auth-status');
  if (!status) return;
  status.textContent = message;
  status.className = `auth-status ${type}`;
  status.hidden = false;
}

function requireConfiguration() {
  if (isConfigured) return true;
  setStatus(
    'Authentication is not connected yet. The APEP Supabase project URL and publishable key must be configured first.',
    'error'
  );
  return false;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function getRedirect(path) {
  return new URL(path, window.location.href).href;
}

async function protectDashboard() {
  if (!document.body.dataset.requiresAuth || !supabase) return;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    const next = encodeURIComponent(window.location.href);
    window.location.href = `${getRedirect('../auth/login.html')}?next=${next}`;
  }
}

async function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = getRedirect('../dashboard/index.html');
      return;
    }
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('confirmed') === '1') {
    setStatus('Email confirmed. You can now sign in to your APEP account.', 'success');
  }
  if (params.get('reset') === 'success') {
    setStatus('Password updated successfully. Please sign in again.', 'success');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;

    const email = form.email.value.trim();
    const password = form.password.value;
    const submit = form.querySelector('button[type="submit"]');

    submit.disabled = true;
    setStatus('Signing you in securely…', 'info');

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
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;

    const password = form.password.value;
    const confirm = form.confirm.value;

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
    setStatus('Creating your APEP account…', 'info');

    const accountType = form.querySelector('input[name="account"]:checked')?.value || 'Student';

    const { data, error } = await supabase.auth.signUp({
      email: form.email.value.trim(),
      password,
      options: {
        emailRedirectTo: getRedirect('login.html?confirmed=1'),
        data: {
          first_name: form.firstname.value.trim(),
          last_name: form.lastname.value.trim(),
          phone: form.phone.value.trim(),
          country: form.country.value.trim(),
          state: form.state.value.trim(),
          profession: form.profession.value.trim(),
          organization: form.organization.value.trim(),
          username: form.username.value.trim(),
          referral_code: form.referral.value.trim(),
          learning_interest: form.interest.value,
          account_type: accountType,
          newsletter: form.newsletter.checked
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
  const form = document.getElementById('forgot-password-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Sending your secure password-reset link…', 'info');

    const { error } = await supabase.auth.resetPasswordForEmail(form.email.value.trim(), {
      redirectTo: getRedirect('reset-password.html')
    });

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
  const form = document.getElementById('reset-password-form');
  if (!form) return;

  if (!requireConfiguration()) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    setStatus('Your password-reset link is missing or has expired. Please request a new one.', 'error');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = form.password.value;
    const confirm = form['confirm-password'].value;

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
    setStatus('Updating your password securely…', 'info');

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
