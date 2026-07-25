# Developer Guide

## Standards

- Use semantic HTML and preserve one `h1` per page.
- Use existing CSS tokens before adding colours, spacing or shadows.
- Keep interaction code dependency-free and progressively enhanced.
- Add visible focus styles for every interactive control.
- Do not use inline scripts, inline styles, or secrets in client-side files.

## Extension rules

Add a module only when it is referenced by the current approved release. Update `docs/version-history.md`, `docs/changelog.md` and the relevant QA record with every RC.
