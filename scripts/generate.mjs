#!/usr/bin/env node
/**
 * Landing Page Generator
 *
 * Usage:  npm run generate
 * Requires: CLAUDE_CODE_OAUTH_TOKEN in environment
 *           (run `claude setup-token` once to generate it)
 *
 * Workflow:
 *   1. Asks for business type (lawyer, plumber, electrician, …)
 *   2. You paste everything you found on Google / Yelp / GMB
 *   3. Claude extracts facts + writes unique page copy
 *   4. Writes client.config.json to project root
 *   5. Optionally launches `npm run dev` so you can preview instantly
 */

import { createInterface }       from 'readline/promises';
import { query }                  from '@anthropic-ai/claude-agent-sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname }       from 'path';
import { fileURLToPath }          from 'url';
import { spawn }                  from 'child_process';
import dotenv                     from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: resolve(ROOT, '.env') });

// ── Auth gate ─────────────────────────────────────────────────────────────────
// Follows the pattern from claude_token_template.md:
//   API key present  → throw (prevents silent metered billing)
//   OAuth token set  → live mode
//   Neither + !prod  → mock mode (useful for local testing without a token)
//   Neither + prod   → throw

function resolveAuth() {
  if (process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is set, but this project uses CLAUDE_CODE_OAUTH_TOKEN\n' +
      '(Claude Code subscription billing). Unset ANTHROPIC_API_KEY so calls are\n' +
      'not routed onto metered API billing.\n\n' +
      'Generate a subscription token with:  claude setup-token'
    );
  }

  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return { mode: 'oauth' };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('\n  ⚠️  CLAUDE_CODE_OAUTH_TOKEN not set — returning MOCK output.\n' +
                 '     Run `claude setup-token` for real AI generation.\n');
    return { mode: 'mock' };
  }

  throw new Error(
    'CLAUDE_CODE_OAUTH_TOKEN is not set in production.\n' +
    'Generate a subscription token with:  claude setup-token'
  );
}

// ── Preset loader ─────────────────────────────────────────────────────────────
// Loads presets/<trade>_preset.json if it exists. Handles common aliases.

const ALIASES = {
  attorney:    'lawyer',
  attorneys:   'lawyer',
  lawyers:     'lawyer',
  cafe:        'restaurant',
  diner:       'restaurant',
  eatery:      'restaurant',
  electricians:'electrician',
  plumbers:    'plumber',
  hvac:        'hvac',
  'air conditioning': 'hvac',
};

function loadPreset(tradeType) {
  const slug = tradeType.toLowerCase().replace(/\s+/g, '_');
  const resolved = ALIASES[slug] ?? slug;

  for (const name of [resolved, slug]) {
    const path = resolve(ROOT, 'presets', `${name}_preset.json`);
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  }
  return null;
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `\
You are a conversion-focused landing page copywriter for local service businesses.

Given raw business information scraped from Google, Yelp, Google Maps, Facebook, etc., you:
  1. Extract every factual detail present (name, phone, address, hours, services, reviews, years open, certifications, etc.)
  2. Infer reasonable values for any optional fields not in the raw data, using the trade preset as guidance
  3. Generate compelling, specific, conversion-focused page copy — never write generic filler
  4. Choose professional brand colors suited to the trade type
  5. Return a single, complete JSON object matching the schema — nothing else

COPY RULES:
  - hero_headline: city + service + a concrete benefit or differentiator, ≤ 10 words, no exclamation marks
  - hero_subhead: 1–2 sentences, cite specific facts (years in business, certifications, guarantee), builds trust
  - service.description: 2–3 sentences, unique to this business, what they actually do — NOT generic boilerplate
  - differentiators: extract specific, real selling points from the raw data (e.g. "Family-owned since 2009", "Same-day service guaranteed") — never write "quality service" or similar vague phrases
  - reviews: ONLY include entries that are explicitly present in the raw data — never invent reviews
  - trust_badges: ONLY real/confirmed facts from the raw data
  - form_endpoint: always return exactly "https://formspree.io/f/TODO_FORM_ID" — the operator replaces this after signing up at formspree.io

BRAND COLOR & DESIGN GUIDELINES:
  Pick typography, colors, and a layout theme_style that match the business vertical and target clientele:
  - Law / Professional Services:
      theme_style: "classic-serif"
      font_headings: "Playfair Display" or "Lora" or "Cinzel"
      font_body: "Inter" or "Plus Jakarta Sans"
      colors: deep navy (#1e3a5f) primary, warm gold (#c9a84c) accent
  - Trades (Plumbing, Electrician, HVAC):
      theme_style: "modern-bold"
      font_headings: "Bricolage Grotesque" or "Montserrat"
      font_body: "Inter"
      colors: bold blue (#1d4ed8) or charcoal (#1f2937) primary, safety yellow/orange (#f59e0b) accent
  - Food & Beverage / Cafe / Fine Dining:
      theme_style: "elegant-dark" (high-end/moody) or "warm-organic" (cozy cafe)
      font_headings: "Fraunces" or "Cormorant Garamond" or "Syne"
      font_body: "Outfit" or "DM Sans"
      colors: rich plum (#2d1b3d) or espresso (#3b2314) primary, champange (#e9c46a) accent
  - Modern Tech / Corporate / Real Estate / Medical:
      theme_style: "corporate-clean"
      font_headings: "Outfit" or "Plus Jakarta Sans"
      font_body: "Inter" or "Plus Jakarta Sans"
      colors: slate/teal (#0f766e or #0f172a) primary, bright sky blue (#0ea5e9) accent

RESPOND WITH VALID JSON ONLY. No markdown code fences, no explanation outside the JSON. Output must be directly parseable by JSON.parse().`;

// ── User prompt builder ───────────────────────────────────────────────────────
function buildUserPrompt(tradeType, preset, rawInfo) {
  const schema = JSON.stringify({
    business_name:    'string — required',
    slug:             'string — lowercase-hyphenated business name, e.g. "smith-law-firm"',
    trade_type:       'string — e.g. "lawyer", "plumber", "electrician"',
    city:             'string — primary city served',
    service_area:     ['array of strings — neighborhoods / cities served'],
    phone:            'string — formatted for display, e.g. "(512) 555-0100"',
    phone_href:       'string — tel: link, e.g. "tel:+15125550100"',
    years_in_business:'string or null',
    hours:            'string or null — e.g. "Mon–Fri 9am–6pm, Sat 9am–2pm"',
    address:          'string or null — omit if service-area only',
    hero_headline:    'string — compelling headline, ≤10 words',
    hero_subhead:     'string — 1–2 trust-building sentences with specific facts',
    differentiators:  ['array of specific real selling points'],
    services: [{ title: 'string', description: 'string — unique 2–3 sentence description' }],
    reviews:  [{ name: 'string', text: 'string — REAL only, never fabricated', rating: '1-5' }],
    trust_badges:     ['array of confirmed real facts only'],
    emergency_banner: 'boolean',
    pricing_display:  '"fixed" | "estimate" | "none"',
    seo: {
      primary_service:  'string — e.g. "Personal Injury Attorney"',
      meta_description: 'string — 140–160 chars, city + service + CTA',
    },
    brand: {
      primary_color:   'string — hex code, e.g. "#1e3a5f"',
      secondary_color: 'string — hex code',
      font_headings:   'string — e.g. "Playfair Display" or "Montserrat"',
      font_body:       'string — e.g. "Inter" or "Outfit"',
      theme_style:     '"classic-serif" | "modern-bold" | "elegant-dark" | "warm-organic" | "corporate-clean"'
    },
    form_endpoint: 'https://formspree.io/f/TODO_FORM_ID',
  }, null, 2);

  return `\
Business type: ${tradeType}

${preset ? `Trade preset (apply these defaults for any field missing from the raw info below):\n${JSON.stringify(preset, null, 2)}\n` : '(No preset found for this trade — use generic professional defaults.)\n'}
Output schema:
${schema}

Raw business information scraped from the web:
---
${rawInfo}
---

Generate the complete client config JSON. Rules:
  - Extract ONLY facts that appear in the raw info above
  - Do NOT invent phone numbers, addresses, or reviews
  - If reviews are absent from the raw info, return an empty array
  - Infer the slug from the business name
  - Fill the seo.meta_description with city, primary service, and a clear call-to-action`;
}

// ── Hermetic model call ───────────────────────────────────────────────────────
// maxTurns:5, allowedTools:[], settingSources:[] → single structured completion
// No filesystem access, no CLAUDE.md, no tool use — behaves like a direct API call.
// Needs >1 turn to allow the underlying agent loop to initialize and finalize.

async function runModel(tradeType, preset, rawInfo) {
  const prompt = buildUserPrompt(tradeType, preset, rawInfo);

  const response = query({
    prompt,
    options: {
      systemPrompt:   SYSTEM_PROMPT,
      model:          'sonnet',
      maxTurns:       5,
      allowedTools:   [],
      settingSources: [],
    },
  });

  let finalText = null;
  for await (const message of response) {
    if (message.type === 'result') {
      if (message.subtype !== 'success') {
        throw new Error(`Claude call did not succeed (subtype: ${message.subtype}).`);
      }
      finalText = message.result;
    }
  }

  if (!finalText) throw new Error('Claude returned no content.');
  return finalText;
}

// ── JSON parser (tolerant) ────────────────────────────────────────────────────
// Strips markdown fences in case the model adds them despite the instruction.

function parseConfig(text) {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new Error(
      `Failed to parse Claude's response as JSON: ${err.message}\n` +
      `Raw output (first 600 chars):\n${text.substring(0, 600)}`
    );
  }

  // Shape validation — required top-level keys
  const required = ['business_name', 'trade_type', 'city', 'phone', 'services'];
  for (const key of required) {
    if (!(key in parsed)) {
      throw new Error(`Claude response is missing required field: "${key}"`);
    }
  }

  return parsed;
}

// ── Mock fallback ─────────────────────────────────────────────────────────────
// Returned when CLAUDE_CODE_OAUTH_TOKEN is absent in non-production.
// Every field is prefixed with [MOCK] so it can't be mistaken for real output.

function buildMockConfig(tradeType) {
  const display = tradeType.charAt(0).toUpperCase() + tradeType.slice(1);
  return {
    business_name:    `[MOCK] Sample ${display} Business`,
    slug:             `mock-${tradeType}-business`,
    trade_type:       tradeType,
    city:             '[MOCK] Austin',
    service_area:     ['[MOCK] Downtown', '[MOCK] East Side'],
    phone:            '(555) 000-0000',
    phone_href:       'tel:+15550000000',
    years_in_business:'10',
    hours:            'Mon–Fri 9am–5pm',
    address:          null,
    hero_headline:    `[MOCK] Trusted ${display} in Austin`,
    hero_subhead:     '[MOCK] Set CLAUDE_CODE_OAUTH_TOKEN for real AI-generated copy. Run: claude setup-token',
    differentiators:  ['[MOCK] Licensed & Insured', '[MOCK] Free Estimates'],
    services: [
      { title: '[MOCK] Service One', description: '[MOCK] Set CLAUDE_CODE_OAUTH_TOKEN for AI-generated descriptions.' },
      { title: '[MOCK] Service Two', description: '[MOCK] Set CLAUDE_CODE_OAUTH_TOKEN for AI-generated descriptions.' },
      { title: '[MOCK] Service Three', description: '[MOCK] Set CLAUDE_CODE_OAUTH_TOKEN for AI-generated descriptions.' },
    ],
    reviews:          [],
    trust_badges:     ['[MOCK] Licensed & Insured', '[MOCK] Free Consultation'],
    emergency_banner: false,
    pricing_display:  'estimate',
    seo: {
      primary_service:  `${display} Services`,
      meta_description: `[MOCK] ${display} services in Austin. Call (555) 000-0000 today.`,
    },
    brand: {
      primary_color:   '#2563eb',
      secondary_color: '#1d4ed8',
    },
    form_endpoint: 'https://formspree.io/f/TODO_FORM_ID',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🚀  Landing Page Generator               ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const auth = resolveAuth();
  const rl   = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // ── Step 1: Business type ──────────────────────────────────────────────
    const tradeTypeRaw = (await rl.question(
      '  Business type (e.g. lawyer, plumber, electrician, restaurant): '
    )).trim();

    if (!tradeTypeRaw) throw new Error('Business type is required.');
    const tradeType = tradeTypeRaw.toLowerCase();

    // ── Step 2: Load preset ────────────────────────────────────────────────
    const preset = loadPreset(tradeType);
    if (preset) {
      console.log(`\n  ✓ Loaded preset: ${preset.trade_type ?? tradeType}`);
    } else {
      console.log(`\n  ℹ  No preset found for "${tradeType}" — using generic defaults.`);
    }

    // ── Step 3: Collect raw info ───────────────────────────────────────────
    console.log('\n  Paste everything you found (name, phone, address, hours,');
    console.log('  services, reviews, Yelp/Google snippets, etc.).');
    console.log('  When done, type END on a new line and press Enter:\n');

    const infoLines = [];
    // Collect lines until the sentinel "END"
    while (true) {
      const line = await rl.question('  ');
      if (line.trim() === 'END') break;
      infoLines.push(line);
    }

    const rawInfo = infoLines.join('\n').trim();
    if (rawInfo.length < 20) {
      throw new Error(
        'Not enough info provided. Paste at least the business name, city, and phone number.'
      );
    }

    console.log(`\n  ✓ Collected ${rawInfo.length} characters.`);
    console.log('  ⏳ Generating config with Claude...\n');

    // ── Step 4: Generate config ────────────────────────────────────────────
    let config;
    if (auth.mode === 'mock') {
      config = buildMockConfig(tradeType);
      console.log('  ⚠️  Returning MOCK config (no token set).\n');
    } else {
      const text = await runModel(tradeType, preset, rawInfo);
      config = parseConfig(text);
    }

    // ── Step 5: Summary ────────────────────────────────────────────────────
    console.log('  ┌─ Generated Summary ─────────────────────────────────');
    console.log(`  │  Business : ${config.business_name}`);
    console.log(`  │  City     : ${config.city}`);
    console.log(`  │  Phone    : ${config.phone}`);
    console.log(`  │  Services : ${config.services?.length ?? 0}`);
    console.log(`  │  Reviews  : ${config.reviews?.length ?? 0}`);
    console.log(`  │  Color    : ${config.brand?.primary_color ?? '#2563eb'}`);
    console.log('  └─────────────────────────────────────────────────────\n');

    // ── Step 6: Confirm write ──────────────────────────────────────────────
    const confirm = (await rl.question('  Write client.config.json? (y/n): ')).trim().toLowerCase();
    if (confirm !== 'y') {
      console.log('\n  Aborted. No files written.\n');
      rl.close();
      return;
    }

    const outPath = resolve(ROOT, 'client.config.json');
    writeFileSync(outPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('\n  ✅ client.config.json written.\n');

    // ── Step 7: Remind about Formspree ────────────────────────────────────
    console.log('  📋 Next steps:');
    console.log('     1. Sign up at formspree.io and replace TODO_FORM_ID in client.config.json');
    console.log('     2. Add real photos to public/images/ (replace gallery placeholders)');
    console.log('     3. Deploy with: vercel deploy --prod\n');

    // ── Step 8: Launch dev server ──────────────────────────────────────────
    const launch = (await rl.question('  Launch dev server now? (y/n): ')).trim().toLowerCase();
    rl.close();

    if (launch === 'y') {
      console.log('\n  Starting dev server... (Ctrl+C to stop)\n');
      const dev = spawn('npm', ['run', 'dev'], {
        cwd:   ROOT,
        stdio: 'inherit',
        shell: true,
      });
      dev.on('error', err => console.error(`\n  Dev server error: ${err.message}`));
    } else {
      console.log('  Run `npm run dev` to preview → http://localhost:4321\n');
    }

  } catch (err) {
    rl.close();
    throw err;
  }
}

main().catch(err => {
  console.error(`\n  ❌ Error: ${err.message}\n`);
  process.exit(1);
});
