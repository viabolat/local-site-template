# TECH_STACK.md — Tools and Setup

## Chosen Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Astro | Static-first, ships near-zero JS by default, ideal for fast, content-driven one-page sites. No backend needed. |
| Styling | Tailwind CSS | Utility-first, avoids per-client custom CSS files, keeps every site visually consistent and fast to theme. |
| Hosting | Vercel (Hobby → Pro as volume grows) | Free tier, instant preview URLs, simple custom domain support, zero server maintenance. |
| Version control | GitHub (template repo pattern) | One base template repo, "Use this template" creates a clean independent repo per client. |
| Forms (optional) | Formspree or similar | Avoids need for a database or backend for contact forms. |
| Domains | Client-owned registrar (Namecheap/GoDaddy), DNS pointed to Vercel | Domain never registered through Vercel — avoids lock-in and account-deletion risk. |

## Why Not Alternatives

- **Next.js/React**: overkill for static one-pagers with no interactivity or dynamic
  server logic. Adds build complexity with no meaningful benefit here.
- **WordPress**: requires ongoing maintenance, plugin security patching, and hosting
  overhead — the opposite of the "fast, secure, low-maintenance" goal.
- **Plain HTML/CSS with manual copy-paste**: viable at very small scale, but doesn't
  scale cleanly past a handful of clients and makes shared-layout updates painful.

## Local Setup (one-time, done by the operator, not per client)

```bash
# Install Astro base template
npm create astro@latest local-site-template -- --template minimal
cd local-site-template
npx astro add tailwind

# Initialize as a GitHub template repo
gh repo create local-site-template --public --source=. --push
# Then in GitHub repo settings: enable "Template repository"
```

## CLI Tools Required

- `gh` (GitHub CLI) — for creating new client repos from the template
- `vercel` (Vercel CLI) — for linking and deploying projects
- Node.js + npm — for local Astro builds

## Security Notes

- No database = no SQL injection surface, no credential leakage risk from a backend.
- No server-side code = no server to patch or exploit.
- Domains registered externally = no single point of failure tied to your hosting
  account (see `NEW_CLIENT_WORKFLOW.md` continuity notes).
- Any third-party form service (Formspree, etc.) should use its own API key stored in
  Vercel environment variables — never committed to the repo.

## Scaling Note

Vercel's Hobby plan officially permits non-commercial use only. Once multiple client
sites are live and generating revenue, budget for the Pro plan (~$20/month) to stay
within terms of service.
