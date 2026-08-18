import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const PRODUCTION_CONFIRMATION_URL = 'https://www.aiprofitadvantage.online/auth/login.html?confirmed=1';

function setRegisterStatus(message, type = 'info') {
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

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function initializeProductionRegistration() {
  if (!window.location.pathname.endsWith('/auth/register.html')) return;

  const form = document.querySelector('form.contact-form');
  if (!form || form.dataset.productionAuthFix === '1') return;
  form.dataset.productionAuthFix = '1';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const get = (id) => form.querySelector(`#${id}`)?.value.trim() || '';
    const email = get('email');
    const password = form.querySelector('#password')?.value || '';
    const confirm = form.querySelector('#confirm')?.value || '';

    if (!email) {
      setRegisterStatus('Please enter your email address.', 'error');
      return;
    }
    if (!validatePassword(password)) {
      setRegisterStatus('Your password must contain at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      setRegisterStatus('The passwords do not match. Please check both password fields and try again.', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    setRegisterStatus('Creating your APEP account…');

    const accountType = form.querySelector('input[name="account"]:checked')?.value || 'Student';

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: PRODUCTION_CONFIRMATION_URL,
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
        setRegisterStatus(error.message || 'Registration could not be completed. Please try again.', 'error');
        return;
      }

      if (data.session) {
        setRegisterStatus('Account created successfully. Redirecting to your dashboard…', 'success');
        window.location.href = new URL('../dashboard/index.html', window.location.href).href;
        return;
      }

      setRegisterStatus('Account created successfully. Please check your email to confirm your address, then sign in.', 'success');
      form.reset();
    } catch (error) {
      setRegisterStatus(error?.message || 'We could not connect to the registration service. Please try again.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductionRegistration, { once: true });
} else {
  initializeProductionRegistration();
}
