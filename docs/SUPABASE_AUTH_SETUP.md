# APEP Supabase Authentication Setup

This project now contains the browser-side authentication integration for:

- New user registration
- Email/password login
- Email confirmation
- Password recovery
- Password reset
- Persistent sessions
- Dashboard authentication protection

## 1. Create or select the Supabase project

Create a Supabase project for APEP and enable Email authentication.

Recommended settings:

- Allow new users to sign up: **Enabled**
- Confirm email: **Enabled**
- Email provider: **Enabled**

## 2. Configure the production URL

Set the Supabase Site URL to:

`https://www.aiprofitadvantage.online`

Add this Redirect URL:

`https://www.aiprofitadvantage.online/auth/login.html`

The registration flow sends confirmed users back to the login page. Password recovery redirects to:

`https://www.aiprofitadvantage.online/auth/reset-password.html`

Supabase requires redirect URLs used by Auth to be included in the project's allowed Redirect URLs configuration.

## 3. Add the public browser credentials

Open:

`config/supabase-config.js`

Replace:

- `YOUR-PROJECT-REF` with the APEP Supabase project reference.
- `YOUR_SUPABASE_PUBLISHABLE_KEY` with the project's **publishable key**.

Never put a Supabase secret/service-role key in frontend code.

## 4. Authentication flow

Registration stores the learner's profile information as Supabase Auth user metadata, including name, phone, country, profession, organization, username, learning interest, account type, referral code, and newsletter preference.

After registration, users receive an email confirmation when Confirm Email is enabled.

After successful login, users are redirected to:

`/dashboard/index.html`

Dashboard pages are protected by the shared authentication module once Supabase credentials are configured.

## 5. Security notes

The browser integration uses Supabase's publishable client key. This is intended for frontend use. Do not expose a secret/service-role key in HTML, JavaScript, CSS, GitHub Pages, or any other public asset.

Row Level Security should be enabled for any future APEP application tables that store learner data.
