# VADO frontend

VADO is a guest-first video discovery and communication frontend built with React, TypeScript, Vite, Tailwind CSS and Lucide icons.

## Run locally

```bash
pnpm install
pnpm dev
```

Create a production build with `pnpm build`, then preview it with `pnpm preview`.

## Current experience

- Guests land directly on the For You feed and can explore categories.
- Desktop uses a left navigation rail; mobile uses a five-item bottom bar.
- Protected destinations offer a local test account. Registration includes Personal, Creator and Business account types, validates form fields, stores a test profile in this browser, and unlocks protected frontend routes.
- Test accounts are not real VADO accounts. Passwords are checked for form validity but never stored; login still requires a real authentication service.
- Studio previews a selected MP4/MOV file in the browser and enforces the 50 MB and five-minute limits. It does not upload or publish the file.
- Inbox, feed, search and account screens do not contain fabricated user or activity records.

No backend, database, authentication provider, media service or AI provider is configured. Actions that require those services are presented as unavailable rather than reported as completed. Use the profile's Sign out button to remove the local test profile. Local video previews use a temporary browser object URL and are not persisted.
