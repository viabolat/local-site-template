# NEW_CLIENT_WORKFLOW.md — End-to-End Process

This is the exact sequence Claude Code should follow when the operator runs the
new-client command, or asks manually to set up a new client site.

## Trigger

The operator will typically invoke this as a natural-language command, e.g.:

> "New client: ABC Plumbing, plumber, Denver CO, phone 555-0100, 10 years in business,
> licensed and insured, services: drain cleaning, water heater repair, leak detection"

Claude should parse this into the `client.config.json` schema (see
`CLIENT_CONFIG_SCHEMA.md`), asking clarifying questions for any required field that's
missing or any thin `differentiators` data.

## Step-by-Step Process

### Step 1 — Gather and validate config
- Parse operator input into `client.config.json`.
- Check all required fields per `CLIENT_CONFIG_SCHEMA.md`.
- If anything required is missing, stop and ask before proceeding.
- Generate a `client-slug` (lowercase, hyphenated business name, e.g. `abc-plumbing`).

### Step 2 — Create the repo from template
```bash
gh repo create <client-slug>-site \
  --template your-username/local-site-template \
  --public \
  --clone
cd <client-slug>-site
```

### Step 3 — Populate config and generate content
- Write `client.config.json` into the new repo.
- Apply the matching trade preset from `presets/<trade_type>.json` as defaults for
  any optional fields not supplied (icons, emergency_banner default, etc.).
- Generate all page copy following `COPYWRITING_AND_SEO.md` rules.
- Generate SEO title, H1, meta description, and LocalBusiness schema.
- Run the quality checklist from `COPYWRITING_AND_SEO.md` before proceeding.

### Step 4 — Populate images
- If the operator has supplied real photos, place them in `public/images/`.
- If not yet supplied, use clearly-labeled placeholder images and add a `TODO` note
  in the client's `README.md` so they aren't accidentally shipped to production.

### Step 5 — Local preview
```bash
npm install
npm run dev
```
- Present the local preview URL to the operator for review before deploying.
- Do not proceed to deployment without explicit operator confirmation.

### Step 6 — Deploy to Vercel
```bash
vercel link
vercel deploy --prod
```
- Confirm the deployment URL works and matches the previewed content.

### Step 7 — Domain setup (only if operator confirms client wants a custom domain)
- Confirm the domain is being registered externally (Namecheap/GoDaddy/etc.), never
  through Vercel directly (see `TECH_STACK.md` security notes).
- In Vercel: Project → Settings → Domains → Add domain.
- Provide the operator the exact DNS records to add at their registrar:
  - A record: `@` → `76.76.21.21`
  - CNAME record: `www` → `cname.vercel-dns.com`
- Note propagation may take minutes to ~24 hours.

### Step 8 — Handoff notes
Generate a short `README.md` in the client repo summarizing:
- What's live and where (Vercel URL, custom domain if applicable)
- What's still a placeholder (images, missing reviews, etc.)
- How to request edits going forward

## Manual Tweak Support

After initial generation, the operator may request manual edits (copy changes, new
services, swapped images, layout tweaks). Claude should:
- Make the requested change directly in the client's repo files.
- Re-run the quality checklist from `COPYWRITING_AND_SEO.md` if copy was changed.
- Ask before re-deploying unless the operator explicitly requests it.

## Competitor-Proximity Check

Before finalizing a new client, ask the operator: "Do you have another client in the
same trade and same city/area as this one?" If yes:
- Use a different layout variant if one exists (see `SITE_TEMPLATE_SPEC.md` Layout
  Variants section).
- Ensure color scheme, photo style, and copy voice are clearly distinct between the
  two.

## Error Handling

- If `gh` or `vercel` CLI commands fail (auth issues, rate limits), stop and report
  the exact error to the operator rather than retrying blindly.
- Never force-push or overwrite an existing client repo without explicit
  confirmation.
