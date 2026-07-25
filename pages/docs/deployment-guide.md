# Deployment Guide

## GitHub Pages

1. Create a GitHub repository and push this project to the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`; the workflow publishes the static site artifact.
4. Confirm that `aiprofitadvantage.online` is configured as the GitHub Pages custom domain and HTTPS is enforced.
5. Verify that the canonical URL, Open Graph image, Twitter image, icons, `robots.txt` and `sitemap.xml` resolve at the production domain.
6. Verify navigation, branding, metadata, contact email and the mobile menu on the deployed site.
7. Run Lighthouse and a keyboard-only accessibility check against the deployed site.

## Before publishing

Use HTTPS, retain the approved founder image and validate every production URL. Do not deploy until the custom domain, certificate and all post-deployment checks pass.
