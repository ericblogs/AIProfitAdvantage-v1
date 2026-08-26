# Lesson 13 — Marketing Automation

## Outcome
Automate repeatable marketing workflows with explicit triggers, controls, and failure handling.

## Architecture
**Trigger → validation → action → state update → notification → logging → exception path.**

Automate deterministic work first. Protect customer-facing decisions with approval gates. Document data sources, permissions, retries, ownership, and rollback procedures.

## Practical exercise
Design an automation that moves a qualified lead from capture to sales notification. Identify three failure modes and their safeguards.

## Deliverable
Create an automation specification including trigger, inputs, actions, integrations, permissions, logs, owner, and rollback.

## Mastery check
What should happen when an automation receives incomplete or contradictory data?