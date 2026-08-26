# Course 08 Implementation Specification

## Canonical identity
- Slug: `ai-powered-digital-marketing-growth`
- Level: `professional`
- Price: `85000 NGN`
- Lesson count: `20`
- Publication: `false` until QA

## Architecture
The course uses the existing APEP course/player, enrollment, progress, payment, and Admin intelligence architecture. No parallel course system is permitted.

## Content contract
Each lesson must expose a stable lesson number, slug, title, content path, and publication state. The content index is the source map for reconciliation.

## Payment contract
The browser must never receive a Paystack secret. Server-side payment initialization/verification must use the authenticated user and Course 08 identifier, with the expected amount of ₦85,000 NGN validated server-side.

## Release gate
No production course row, pricing row, lesson publication, merge, or deployment is authorized until file-level reconciliation and runtime QA pass.