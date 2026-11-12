# APEP Daily Editorial Automation

## What it does

- Runs every day at **07:00 West Africa Time (UTC+1)**, or manually from GitHub Actions.
- Uses the Gemini API to draft one practical APEP article.
- Rotates editorial categories across the week.
- Checks basic metadata, article length and heading structure.
- Creates one GitHub Issue per date as the editorial approval queue.
- Prevents duplicate issues when a scheduled run is retried.

## Safety boundary

**This workflow does not publish to the public APEP website.** It creates a draft issue for human review. An editor must verify accuracy, originality, links, claims, SEO metadata and brand fit before a separate publishing step is approved and implemented.

The workflow does not change the storefront, Academy, forum, Supabase, payment code or public article files.

## One-time setup

1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
3. Name the secret exactly `GEMINI_API_KEY` and paste the key as its value.
4. Open **Actions → APEP Daily Editorial Draft → Run workflow** for the first controlled test.
5. Review the generated issue in the repository's Issues tab.

The key is read only from GitHub Actions Secrets. Never commit it to the repository or paste it into source files.

## Free-tier and usage notes

Gemini API free-tier eligibility, model access, rate limits and data-use terms are controlled by Google and may change. This workflow uses `gemini-2.5-flash` by default. Check the current terms and quota in Google AI Studio before relying on a no-cost allowance.

GitHub Actions usage is subject to the repository/account's current plan limits.

## Daily schedule

The cron expression is `0 6 * * *` (06:00 UTC = 07:00 WAT). GitHub scheduled workflows can occasionally start later than the requested minute.

## Editorial operation

For the first 14 days, review every generated draft. Track whether topics are distinct, factual notes are resolved and articles meet APEP's editorial standard. Do not enable automatic public publication until this review period is complete and a separate publication workflow has been tested.
