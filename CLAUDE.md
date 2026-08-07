# CLAUDE.md — Master Project Instructions

## Purpose

This project generates fast, high-quality, one-page marketing websites for local trade
businesses (plumbers, electricians, pool cleaners, etc.) as a paid service. Each client
gets their own GitHub repo, their own Vercel deployment, and (optionally) their own
custom domain.

You (Claude Code) are responsible for scaffolding new client sites end-to-end: creating
the repo from the template, populating it with client-specific content, generating
locally-optimized copy, and preparing it for deployment.

## Read Order

When starting any task in this project, read files in this order:

1. `CLAUDE.md` (this file) — overview and guardrails
2. `TECH_STACK.md` — what tools to use and why
3. `SITE_TEMPLATE_SPEC.md` — the required page structure
4. `CLIENT_CONFIG_SCHEMA.md` — the data model for each client
5. `COPYWRITING_AND_SEO.md` — how to write content for each client
6. `NEW_CLIENT_WORKFLOW.md` — the exact step-by-step process to run
7. `presets/plumber.json` — example trade preset (reference only)

## Core Principles

- **One template, many clients.** Never fork the visual structure or component code
  per client. Only the config data and generated copy should differ.
- **Every client site must feel genuinely custom.** Never reuse identical sentences,
  headlines, or paragraphs across two different client sites. See
  `COPYWRITING_AND_SEO.md` for exact rules.
- **No database, no backend.** These are static sites. If a client wants a contact
  form, use a third-party form endpoint (e.g., Formspree) — do not build custom
  backend logic or provision a database.
- **Security and portability first.** Domains are registered by the business owner
  (or held externally, never inside Vercel). Site code always lives in a GitHub repo,
  never only inside a deployment platform.
- **Ask before assuming.** If a client config is missing required fields (see
  `CLIENT_CONFIG_SCHEMA.md`), stop and ask the user rather than inventing business
  details.

## Guardrails

- Do not fabricate reviews, certifications, license numbers, or awards. If the user
  hasn't supplied them, leave those sections out or mark them as `TODO`.
- Do not deploy to production (Vercel) without explicit confirmation from the user.
- Do not register or purchase domains automatically — flag when a domain step is
  needed and let the user handle purchase manually unless they've explicitly
  authorized CLI-based registration.
- Keep every generated site accessible (semantic HTML, alt text on images, sufficient
  color contrast) — these are trust-driving local business sites, not experimental UI.

## File Map (what you will generate per new client)

```
clients/<client-slug>/
├── client.config.json      # from CLIENT_CONFIG_SCHEMA.md
├── src/
│   ├── pages/index.astro   # generated from SITE_TEMPLATE_SPEC.md
│   └── content/copy.json   # generated per COPYWRITING_AND_SEO.md
├── public/
│   └── images/             # placeholder folder, client supplies real photos
└── README.md               # client-specific deployment notes
```

## Success Criteria for Any Client Site

A finished site is considered done when:

- All 7 required sections from `SITE_TEMPLATE_SPEC.md` are present and populated.
- Copy is unique to this client (no duplicated sentences from other clients).
- SEO title, meta description, and H1 follow `COPYWRITING_AND_SEO.md` rules.
- LocalBusiness schema is present and filled with real client data.
- Site builds and previews successfully before deployment is requested.
