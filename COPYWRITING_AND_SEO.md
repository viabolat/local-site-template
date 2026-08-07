# COPYWRITING_AND_SEO.md — Content Generation Rules

## Non-Negotiable Rule

**No sentence, headline, or paragraph may be reused verbatim across two different
client sites.** Even when two clients are the same trade, in different cities, write
distinct copy for each. This is both an SEO requirement (thin/duplicate content
underperforms) and a trust requirement (avoids the "obviously templated" problem if
two business owners ever compare sites).

## How to Generate Copy Per Client

For every client, before writing any copy:

1. Read the full `client.config.json`, especially `differentiators` and `services`.
2. If `differentiators` is sparse (fewer than 2 real entries), ask the user for more
   detail before writing — do not pad with generic claims.
3. Draft copy that foregrounds the client's *specific, real* facts — years in
   business, a specific guarantee, a specific service nuance — rather than generic
   trade language ("quality service you can trust").

## SEO Rules

### Title Tag
Format: `{seo.primary_service} in {city} | {business_name}`
Example: `Emergency Plumbing in Denver | ABC Plumbing Co.`

### H1 (Hero Headline)
Must contain the same core phrase as the title tag, written naturally as a headline,
not just copy-pasted from the title tag.
Example: `Denver's Trusted Team for Emergency Plumbing`

### Meta Description
150–160 characters. Must include: primary service, city, and a call to action.
Example: `Fast, reliable emergency plumbing in Denver. Licensed, insured, and
available same-day. Call ABC Plumbing Co. for a free estimate.`

### LocalBusiness Schema
Populate per client with:
- Real business name
- Real phone number
- Real address (if applicable) or service area
- Real hours
- `@type` matching the trade (e.g., `Plumber`, `Electrician`, `HomeAndConstructionBusiness`)

Never copy this block unedited from a previous client — it constitutes false business
data if left with another business's details.

### Secondary Keywords
If `seo.secondary_keywords` is populated, naturally weave 1-2 into service
descriptions or the service area section. Do not keyword-stuff — one natural mention
per keyword is sufficient.

## Section-by-Section Copy Guidance

**Hero subheadline:** Pull directly from the strongest 1-2 items in
`differentiators`. This is the single most important sentence on the page — it should
never be generic.

**Service descriptions:** Rewrite the raw `description` field in each service object
into a client-voiced sentence or two. Reference something specific to how this
business performs that service if the config provides it.

**Trust signals:** Use only confirmed items from `trust_badges`. If a badge like
"Licensed & Insured" is claimed, it must be present in the config as user-confirmed
— never assumed.

**Reviews:** Use real review text only. If reviews exist but are lightly edited for
length, preserve the original meaning and tone exactly — do not embellish.

## Programmatic Multi-Location Pages (only if a single client serves multiple towns)

If a client's `service_area` includes multiple distinct towns and they request
individual location pages (not just a single service-area list):

- Each location page needs genuinely distinct content — real local references, not
  just a swapped city name in a copy-pasted template.
- Use format: H1 = `{Service} in {Location}`
- Share the site's nav/footer/branding shell, but never duplicate body paragraphs
  across location pages verbatim.
- If there isn't enough real, distinct information to justify a page for a given
  town, do not create that page — fold it into the shared service-area list instead.

## Quality Checklist Before Finalizing Copy

- [ ] No sentence duplicated from another client's site
- [ ] Hero subheadline uses a real differentiator, not generic language
- [ ] Title tag, H1, and meta description all follow the format rules above
- [ ] LocalBusiness schema populated with this client's real data only
- [ ] No fabricated reviews, certifications, or claims
