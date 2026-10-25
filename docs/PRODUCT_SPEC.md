# Afrolivestream — Product Specification

## Vision
Build a modern, mobile-friendly streaming platform for African entertainment, live radio, authorised live TV, video on demand, podcasts, education, and community media.

## MVP viewer experience
- Premium dark interface with responsive layouts.
- Browse Live TV, Radio, Movies & Series, Podcasts, Community, and Education.
- Search and category filtering.
- Content detail panels with description, category, and playback state.
- Clearly label demo content; do not embed unlicensed third-party streams.

## Admin foundation
- Protected admin routes and role-based access.
- Create, edit, review, publish, unpublish, and archive content records.
- Track rights owner, agreement reference, territory, permitted uses, and licence expiry.
- Audit important administrative changes.

## Core records
- ContentItem: id, title, description, type, category, artwork, playback URL, status.
- Channel: id, name, channel type, authorised stream URL, status.
- RightsRecord: content ID, rights owner, agreement reference, territory, start date, expiry date, permitted uses.
- User: id, email, role, status.

## Delivery milestones
1. Responsive web UI with demo catalogue.
2. Search, categories, and content detail/playback states.
3. Secure authentication and admin dashboard.
4. API and PostgreSQL data layer.
5. Integrate authorised HLS/audio streams and rights expiry controls.
6. QA, monitoring, privacy review, and deployment.
7. Android app after the API and web MVP stabilise.

## Security and compliance
- HTTPS, secure session handling, role-based access, admin MFA, audit logs, backups, and secret management.
- Apply POPIA-aware data minimisation and privacy practices.
- Free-to-air availability does not automatically grant online rebroadcast rights. Publish only content owned by the platform or covered by written distribution permission.
