# RC-1.2.0 QA Checklist

## Required before audit

- [ ] Run HTML validation with a current validator.
- [ ] Run CSS validation with the W3C CSS Validator.
- [ ] Confirm no browser console errors on an HTTP(S) local server.
- [ ] Test all links and the mobile menu at 320, 375, 768, 1024, 1440 and 1920 pixels.
- [ ] Navigate by keyboard: skip link, menu, links, FAQ and footer.
- [ ] Check text contrast and visible focus states.
- [ ] Run Lighthouse on the deployed preview where available.
- [ ] Verify the canonical URL, social card and application icons resolve over HTTPS.
- [ ] Verify `robots.txt` permits crawling and the sitemap URL resolves.
- [ ] Confirm no credentials or private data are committed.

## Definition of Done

RC-1.2.0 is ready for release only when validation, links, assets, navigation, responsive behaviour, accessibility, documentation, QA evidence, release metadata and deployed verification have passed the required independent reviews.
