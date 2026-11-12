#!/usr/bin/env python3
"""Generate one APEP editorial draft and place it in the GitHub approval queue.

This script never publishes to the public website. It creates a GitHub Issue for
human review. The issue is the editorial approval record.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

REPO = os.environ["GITHUB_REPOSITORY"]
GH_TOKEN = os.environ["GH_TOKEN"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
raw_date = os.environ.get("EDITORIAL_DATE")
TODAY = (
    datetime.fromisoformat(raw_date.replace("Z", "+00:00")).date().isoformat()
    if raw_date else datetime.now(timezone.utc).date().isoformat()
)
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")

CATEGORIES = [
    ("AI Fundamentals", "Explain a useful AI concept for beginners and show when it matters in real work."),
    ("Prompt Engineering", "Teach a practical prompting method with a worked example and evaluation checklist."),
    ("AI Productivity", "Show a repeatable AI-assisted workflow for knowledge workers, freelancers or small teams."),
    ("AI Marketing", "Explain an ethical, audience-first marketing workflow covering research, messaging or conversion."),
    ("AI Automation", "Show how to identify, map and safely automate a recurring business process with human oversight."),
    ("AI Business & Freelancing", "Explain how a freelancer or small business can package, price, deliver or improve a useful service without income promises."),
    ("Responsible AI & Business", "Explain practical governance, privacy, quality assurance or responsible adoption for small organisations."),
]
# Stable weekly rotation: rerunning on the same date produces the same editorial category.
day = datetime.fromisoformat(TODAY).weekday()
category, angle = CATEGORIES[day]

EXISTING_TOPICS = [
    "AI fundamentals and beginner guide", "generative AI explained", "AI versus machine learning",
    "AI hallucinations", "AI privacy basics", "anatomy of a high-quality prompt",
    "zero-shot versus few-shot prompting", "business prompt templates", "prompt evaluation",
    "prompting for research", "AI workflow strategy", "personal AI productivity",
    "AI research workflows", "AI meeting notes", "AI productivity guide", "AI content strategy",
    "AI SEO research", "AI-assisted conversion copywriting", "AI social content", "AI email marketing",
    "AI automation guide", "what business processes to automate", "human-in-the-loop automation",
    "AI workflow design", "AI automation mistakes", "AI-assisted freelancing",
    "freelance client management system", "freelance client onboarding",
    "freelance client communication templates", "preventing freelance scope creep",
    "freelance payment tracking", "freelance project delivery and deadlines",
    "freelance client retention", "AI business opportunities", "packaging AI services",
    "AI digital income", "building an AI-assisted service",
]

SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"},
        "slug": {"type": "STRING"},
        "excerpt": {"type": "STRING"},
        "category": {"type": "STRING"},
        "reading_minutes": {"type": "INTEGER"},
        "article_markdown": {"type": "STRING"},
        "editor_verification_notes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "suggested_internal_links": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": ["title", "slug", "excerpt", "category", "reading_minutes",
                 "article_markdown", "editor_verification_notes", "suggested_internal_links"],
}

def request_json(url, payload=None, headers=None, method=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers or {},
                                 method=method or ("POST" if data else "GET"))
    retryable_statuses = {429, 500, 502, 503, 504}
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code not in retryable_statuses or attempt == 3:
                raise
            retry_after = exc.headers.get("Retry-After")
            try:
                delay = min(max(int(retry_after), 1), 30) if retry_after else 5 * (2 ** attempt)
            except ValueError:
                delay = 5 * (2 ** attempt)
            print(f"Temporary API response HTTP {exc.code}; retrying in {delay}s "
                  f"(attempt {attempt + 2}/4).")
            time.sleep(delay)

def main():
    prompt = f"""
You are the senior editorial writer for AI Profit Advantage Enterprise Platform (APEP),
an Africa-aware but globally useful AI education and business publication.

DATE: {TODAY}
CATEGORY: {category}
EDITORIAL ANGLE: {angle}

Create ONE genuinely useful, original article for freelancers, beginners, creators,
entrepreneurs and small-business teams. Target 1,000–1,400 words. Be practical,
specific, accurate and naturally written—not hype, filler or generic AI prose.

Avoid duplicating these existing APEP article subjects:
{json.dumps(EXISTING_TOPICS)}

Editorial requirements:
- Give the reader a clear problem, practical explanation, actionable steps, examples,
  common mistakes, a short implementation exercise and a concise conclusion.
- Use a clear H1 title represented by the title field; article_markdown starts with an
  introductory paragraph and then uses meaningful H2/H3 headings.
- Include concrete, realistic examples. Do not invent case studies, testimonials,
  customer results, survey findings, statistics, quotations or personal experiences.
- Do not promise earnings, guaranteed rankings, guaranteed outcomes or effortless income.
- Do not invent product features, prices, legal requirements, platform policies or current
  AI model capabilities. Avoid time-sensitive claims.
- Respect privacy, copyright, platform terms, disclosure and human review.
- Keep claims proportionate. Where a factual claim needs external confirmation, list it
  in editor_verification_notes rather than guessing.
- Use internal links only when relevant, selected from these known APEP pages:
  /pages/blog.html
  /pages/knowledge-library.html
  /pages/articles/ai-fundamentals.html
  /pages/articles/prompt-engineering.html
  /pages/articles/ai-workflow-strategy.html
  /pages/articles/ai-content-strategy.html
  /pages/articles/ai-automation.html
  /pages/articles/ai-assisted-freelancing.html
- Return a clean URL slug using lowercase letters and hyphens.
- The excerpt must be a useful 1–2 sentence summary, not clickbait.
- Category should be exactly: {category}
- Return only the requested JSON object.
"""
    gemini_url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        + urllib.parse.quote(MODEL, safe="")
        + ":generateContent?key=" + urllib.parse.quote(GEMINI_API_KEY, safe="")
    )
    result = request_json(
        gemini_url,
        {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.65,
                "responseMimeType": "application/json",
                "responseSchema": SCHEMA,
            },
        },
        {"Content-Type": "application/json"},
    )
    try:
        raw = result["candidates"][0]["content"]["parts"][0]["text"]
        article = json.loads(raw)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise RuntimeError("Gemini did not return valid structured article JSON") from exc

    title = str(article["title"]).strip()
    slug = str(article["slug"]).strip().lower()
    body = str(article["article_markdown"]).strip()
    excerpt = str(article["excerpt"]).strip()
    words = re.findall(r"\b[\w'-]+\b", body)
    if not title or not excerpt or len(slug) > 90 or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise RuntimeError("Article metadata failed validation")
    if len(words) < 650:
        raise RuntimeError(f"Article too short for editorial review ({len(words)} words)")
    if not re.search(r"^##\s+", body, flags=re.M):
        raise RuntimeError("Article is missing substantive section headings")
    if len(body) > 24000:
        raise RuntimeError("Article exceeds the editorial draft size limit")

    # Idempotency: one draft per calendar date, including manual reruns.
    q = urllib.parse.quote(f'repo:{REPO} in:title "APEP Editorial Draft" "{TODAY}"')
    search = request_json(
        "https://api.github.com/search/issues?q=" + q,
        headers={"Authorization": f"Bearer {GH_TOKEN}",
                 "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2022-11-28"},
    )
    if search.get("total_count", 0):
        print(f"Draft already exists for {TODAY}; skipping duplicate.")
        return

    notes = article.get("editor_verification_notes") or []
    links = article.get("suggested_internal_links") or []
    issue_body = f"""## Editorial status
**Draft — requires human review. Not published.**

- **Date:** {TODAY}
- **Category:** {category}
- **Reading time:** {article.get('reading_minutes', 7)} minutes
- **Slug proposal:** `{slug}`
- **Word count:** {len(words)}

## Article summary
{excerpt}

## Draft article

{body}

## Editor verification checklist
{chr(10).join('- [ ] ' + str(x) for x in notes) if notes else '- [ ] Verify factual claims and any external references.'}
- [ ] Check originality and overlap with existing APEP articles.
- [ ] Review tone, usefulness, examples and local/global relevance.
- [ ] Check internal links, SEO title and meta description.
- [ ] Approve, request revision or reject before any public publication.

## Suggested internal links
{chr(10).join('- ' + str(x) for x in links) if links else '- Add only relevant internal links during editorial review.'}

---
Generated by the APEP Daily Editorial workflow. This issue is an approval queue item only;
the workflow does not publish to the public website.
"""
    issue = request_json(
        f"https://api.github.com/repos/{REPO}/issues",
        {"title": f"APEP Editorial Draft | {TODAY} | {title}", "body": issue_body},
        {"Authorization": f"Bearer {GH_TOKEN}",
         "Accept": "application/vnd.github+json",
         "X-GitHub-Api-Version": "2022-11-28",
         "Content-Type": "application/json"},
    )
    print(f"Created editorial draft issue #{issue['number']}: {issue['html_url']}")

if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        # Never print request URLs: Gemini's URL contains the API key.
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"API request failed with HTTP {exc.code}: {detail}") from None
