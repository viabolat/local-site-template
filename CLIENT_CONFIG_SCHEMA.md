# CLIENT_CONFIG_SCHEMA.md — Per-Client Data Model

Every client site is generated from a single `client.config.json` file. Claude should
never hardcode client details directly into template files — always populate this
config, then generate the site from it.

## Schema

```json
{
  "business_name": "string, required",
  "trade_type": "plumber | electrician | pool_cleaner | other, required",
  "city": "string, required — primary city served",
  "service_area": ["array of strings — cities/neighborhoods served"],
  "phone": "string, required — formatted for tel: links",
  "hours": "string, e.g. 'Mon-Fri 8am-6pm, Sat 9am-2pm'",
  "address": "string, optional — omit if service-area only",

  "differentiators": [
    "array of strings — real, specific facts that make this business stand out",
    "e.g. 'Family-owned since 2009', 'Same-day emergency response', 'Licensed and bonded'"
  ],

  "services": [
    {
      "title": "string",
      "description": "string — will be REWRITTEN uniquely by Claude, this is raw input only",
      "icon": "string — icon identifier from trade preset"
    }
  ],

  "reviews": [
    {
      "name": "string",
      "text": "string — must be a REAL review, never fabricated",
      "rating": "number 1-5"
    }
  ],

  "trust_badges": ["array of strings, only real/confirmed items"],

  "emergency_banner": "boolean",
  "pricing_display": "fixed | estimate | none",

  "seo": {
    "primary_service": "string — e.g. 'Emergency Plumbing'",
    "secondary_keywords": ["array of strings, optional"]
  },

  "form_endpoint": "string — Formspree or equivalent endpoint URL",

  "brand": {
    "logo_path": "string — path in public/images/",
    "primary_color": "string — hex code",
    "secondary_color": "string — hex code, optional"
  },

  "domain": {
    "registrar": "string, e.g. 'Namecheap' — informational only",
    "custom_domain": "string, optional — filled in once purchased"
  }
}
```

## Required vs Optional Fields

**Required before Claude generates any content:**
`business_name`, `trade_type`, `city`, `phone`, `services` (at least 1)

**Required before Claude writes review section:**
At least one real entry in `reviews` — otherwise Claude must omit the section
entirely per `SITE_TEMPLATE_SPEC.md`.

**If any required field is missing, Claude must stop and ask the user for it —
never invent placeholder business facts.**

## Note on `differentiators`

This field exists specifically to satisfy the instruction that generated content
should "enhance the client's business." Claude should mine this field heavily when
writing copy — real, specific differentiators (not generic claims like "quality
service") are what make each site feel genuinely tailored and credible. If the user
hasn't supplied any, ask 2-3 clarifying questions to extract them before writing copy
(e.g., "How many years have they been in business?", "What do their reviews usually
compliment them on?", "What makes them different from competitors nearby?").
