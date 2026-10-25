# Afrolivestream

A web-first prototype for African stories, live radio, authorised live TV, video on demand, podcasts, education and community media.

## Current prototype

- Responsive dark streaming-style interface
- Sample catalogue with search and category filtering
- Content detail modal and save-to-list interaction
- Creator Studio preview with catalogue/rights review status
- Demo states for Live TV and Radio until authorised stream sources are configured

**Important:** this is a frontend prototype, not a production streaming service. Authentication, API, database, real playback, analytics, and production admin permissions are not yet implemented. Sample artwork loads from Unsplash.

## Run locally

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Next implementation milestones

1. Connect a backend API and PostgreSQL database.
2. Add authentication, role-based access and admin MFA.
3. Implement rights records and publishing checks.
4. Configure authorised HLS/video and audio streams.
5. Add monitoring, backups, privacy review and deployment.
6. Build the Android client against the stable API.

## Content rights

Only publish content owned by the platform or covered by written online distribution permission. Free-to-air availability does not automatically grant online rebroadcast rights. Do not commit credentials, API keys, private stream URLs, or user data to the repository.

## Suggested structure

```text
src/
  App.tsx
  main.tsx
  styles.css
docs/
  PRODUCT_SPEC.md
  CONTENT_RIGHTS.md
```
