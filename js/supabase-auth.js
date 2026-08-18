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

function setBackendNotice() {
  const form = document.querySelector('form.contact-form');
  if (!form || document.getElementById('auth-backend-notice')) return;

  const notice = document.createElement('div');
  notice.id = 'auth-backend-notice';
  notice.setAttribute('role', 'note');
  notice.style.cssText = 'margin:0 0 18px;padding:12px 14px;border-radius:10px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:.92rem;line-height:1.5;';
  notice.textContent = isConfigured
    ? '🔐 APEP authentication is connected to Supabase for secure sign-in, registration, and password recovery. If the service is unavailable, this page will report the problem instead of pretending the action succeeded.'
    : 'ℹ️ APEP authentication is currently not connected. This page will not pretend to create or sign in an account until the authentication backend is configured.';
  form.prepend(notice);
}

function requireConfiguration() {
  if (isConfigured && supabase) return true;
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

function updateNavigationForSession(session) {
  const publicNav = document.querySelector('.primary-nav');
  if (publicNav && !publicNav.closest('.dashboard-layout')) {
    const loginLink = Array.from(publicNav.querySelectorAll('a')).find(
      (link) => ['Login', 'Dashboard'].includes(link.textContent.trim())
    );
    if (loginLink) {
      loginLink.textContent = session ? 'Dashboard' : 'Login';
      loginLink.href = session ? getRedirect('dashboard/index.html') : getRedirect('auth/login.html');
    }
  }

  const dashboardNav = document.querySelector('.dashboard-nav');
  if (dashboardNav) {
    let logoutLink = dashboardNav.querySelector('[data-auth-action="logout"]');
    if (session && !logoutLink) {
      logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.dataset.authAction = 'logout';
      logoutLink.textContent = '🚪 Logout';
      dashboardNav.appendChild(logoutLink);
      logoutLink.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!supabase) return;
        logoutLink.setAttribute('aria-disabled', 'true');
        const { error } = await supabase.auth.signOut();
        if (error) {
          logoutLink.removeAttribute('aria-disabled');
          setStatus(error.message || 'We could not sign you out. Please try again.', 'error');
          return;
        }
        window.location.href = getRedirect('../auth/login.html');
      });
    } else if (!session && logoutLink) {
      logoutLink.remove();
    }
  }
}

async function initLogin() {
  if (pageName() !== 'login.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form) return;
  setBackendNotice();

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
      setStatus(error.message || 'We could not sign you in. Please check your email and password and try again.', 'error');
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
  setBackendNotice();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireConfiguration()) return;

    const get = (id) => form.querySelector(`#${id}`)?.value.trim() || '';
    const email = get('email');
    const password = form.querySelector('#password')?.value || '';
    const confirm = form.querySelector('#confirm')?.value || '';

    if (!email) {
      setStatus('Please enter your email address.', 'error');
      return;
    }
    if (!validatePassword(password)) {
      setStatus('Your password must contain at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      setStatus('The passwords do not match. Please check both password fields and try again.', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Creating your APEP account…');
    const accountType = form.querySelector('input[name="account"]:checked')?.value || 'Student';

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: get('firstname'),
            last_name: get('lastname'),
            phone: get('phone'),
            country: get('country'),
            state: get('state'),
            profession: get('profession'),
            organization: get('organization'),
            username: get('username'),
            referral_code: get('referral'),
            learning_interest: form.querySelector('#interest')?.value || '',
            account_type: accountType,
            newsletter: !!form.querySelector('input[name="newsletter"]')?.checked
          }
        }
      });

      if (error) {
        setStatus(error.message || 'Registration could not be completed. Please try again.', 'error');
        return;
      }

      if (data.session) {
        setStatus('Account created successfully. Redirecting to your dashboard…', 'success');
        window.location.href = getRedirect('../dashboard/index.html');
        return;
      }

      if (data.user) {
        setStatus('Account created successfully. Please check your email to confirm your address, then sign in.', 'success');
        form.reset();
        return;
      }

      setStatus('Registration was not completed. Please try again.', 'error');
    } catch (error) {
      setStatus(error?.message || 'We could not connect to the registration service. Please try again.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

async function initForgotPassword() {
  if (pageName() !== 'forgot-password.html') return;
  const form = document.querySelector('form.contact-form');
  if (!form) return;
  setBackendNotice();

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
      setStatus(error.message || 'We could not send the reset email. Please verify the address and try again.', 'error');
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
  setBackendNotice();
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
      setStatus(error.message || 'We could not update your password. Please request a fresh reset link and try again.', 'error');
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

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    updateNavigationForSession(data.session);
    supabase.auth.onAuthStateChange((_event, session) => {
      updateNavigationForSession(session);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth, { once: true });
} else {
  initAuth();
}
