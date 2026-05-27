# Phase 1 Demo Data Policy

**Requirement:** SAFE-05  
**Status:** Contract for demo/real-data separation

BeYou v1 can use seeded demo accounts and demo records, but demo data must never be confused with real student records.

## Required metadata

- Demo accounts must include `is_demo: true`.
- Demo records must include `is_demo: true`.
- Real student records must not be created by demo seed scripts.
- Demo data should use clearly fictional names, classes, notes, and histories.
- Runtime code in later phases must preserve `is_demo` through list views, detail views, audit events, and support workflows.

## Visible indicators

- Persistent demo banner text:

  `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.`

- Demo metadata badge:

  `Demo`

- The banner must appear on demo sessions or demo-mode pages.
- The `Demo` badge must appear near a demo record title or metadata.
- Demo separation must not rely only on color; text labels and metadata are required.

## Seed restrictions

- Seeded demo accounts and demo records are limited to dev/demo contexts.
- Demo seed scripts must not run automatically in production-like real student environments.
- Demo records must not be mistaken for real student records in dashboards, SOS views, audit logs, or reports.
- If seeded data is copied across environments, the `is_demo` marker must be preserved.

## Real student pilot warning

Real student pilot requires legal/school review before live use. Phase 1 records this as a launch gate without creating a full production legal consent workflow for the MVP demo.

## Verification anchors

- SAFE-05
- `is_demo`
- `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.`
- `Demo`
- `not rely only on color`
- `legal/school review`
