# SITE_TEMPLATE_SPEC.md — Required Page Structure

This defines the single, universal page structure used for every client, regardless
of trade. Only content changes between clients — never the section order or overall
layout, unless a second layout variant is explicitly requested (see "Layout Variants"
below).

## Required Sections (in order)

### 1. Hero
- Business name
- Headline: `[Primary Service] in [City]` (see COPYWRITING_AND_SEO.md for exact rules)
- Subheadline: one sentence of differentiation (years in business, guarantee, etc.)
- Primary CTA button: click-to-call phone number
- Secondary CTA (optional): "Get a Free Quote" form link

### 2. Services
- 3–5 core services, each with:
  - Icon (trade-appropriate, see presets)
  - Short title
  - 1–2 sentence description (unique per client, not generic filler)

### 3. Trust Signals
- Years in business
- License/insurance status (only if confirmed by client — never fabricate)
- Certifications or affiliations, if provided

### 4. Reviews / Social Proof
- 3–5 real reviews if available (name, short quote, star rating)
- If no reviews exist yet, omit this section entirely rather than fabricate content

### 5. Gallery
- Grid of real client-supplied photos (work completed, team, vehicles)
- Use descriptive alt text for each image (accessibility + SEO)

### 6. Service Area
- List of cities/neighborhoods served
- Optional embedded map

### 7. Contact
- Large, clickable phone number
- Simple form: name, phone, message (wired to Formspree or equivalent)
- Business hours
- Address (if applicable — many trades are mobile/service-area only, omit if not
  relevant)

## Layout Variants

Maintain exactly ONE layout for now (per current build phase). When a second layout
variant becomes necessary (e.g., two direct competitors in the same city both become
clients), duplicate this spec as `SITE_TEMPLATE_SPEC_V2.md` with a different section
order or visual treatment, and document when to use which variant in
`NEW_CLIENT_WORKFLOW.md`.

## Trade-Specific Toggles (config-driven, not separate templates)

These are optional config flags that adjust content within the same structure:

- `emergency_banner: true/false` — shows a "24/7 Emergency Service" bar near the hero
  (common for plumbers/electricians, usually off for pool cleaners/landscapers)
- `pricing_display: "fixed" | "estimate" | "none"` — controls whether the Services
  section shows recurring pricing (pool cleaners, lawn care) or defaults to
  "Free Estimate" (plumbers, electricians)
- `service_icons`: mapped per trade in the preset file (see `presets/`)

## Accessibility Requirements

- All images require descriptive alt text
- Color contrast must meet WCAG AA minimum
- All interactive elements (buttons, form fields) must be keyboard-navigable
- Phone numbers must use `tel:` links for one-tap calling on mobile
