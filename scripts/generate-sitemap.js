#!/usr/bin/env node
/**
 * Regenerate public/sitemap.xml from the live Supabase catalog.
 *
 * Runs automatically as the npm "prebuild" step (local builds and Vercel).
 * Manual run:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/generate-sitemap.js
 *
 * Falls back to .env / .env.production if those vars aren't already set.
 *
 * Never fails the build: if the env vars are missing or the fetch fails, it
 * logs a warning, leaves the committed public/sitemap.xml untouched and exits 0.
 *
 * Included URLs:
 *   - static public pages
 *   - /products?category=<slug> for active categories that have at least one
 *     listed product (the Products page canonicalizes these to themselves)
 *   - /products/<slug> for products that are active AND is_available, with
 *     lastmod from products.updated_at
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");
const OUT = join(repoRoot, "public", "sitemap.xml");
const FETCH_TIMEOUT_MS = 15000;

function warnAndKeep(message) {
  console.warn(`[sitemap] ${message}. Keeping the committed public/sitemap.xml.`);
  process.exit(0);
}

function loadEnv() {
  for (const f of [".env.production", ".env"]) {
    const path = join(repoRoot, f);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, raw] = m;
      if (process.env[k]) continue;
      let v = raw.trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON) {
  warnAndKeep("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
}

const SITE = "https://www.impressivejb.com";
const STATIC_PATHS = [
  "/",
  "/products",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
];

const timedFetch = (input, init = {}) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: timedFetch },
});

let products;
let categories;
try {
  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at, category_id")
      .eq("active", true)
      .eq("is_available", true)
      .order("slug"),
    supabase
      .from("categories")
      .select("id, slug")
      .eq("active", true)
      .order("sort_order"),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  products = productsRes.data;
  categories = categoriesRes.data;
} catch (err) {
  warnAndKeep(`Supabase fetch failed (${err?.message || err})`);
}

if (!products?.length) {
  warnAndKeep("Supabase returned no listed products");
}

const xmlEscape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function urlEntry(path, lastmod) {
  const parts = [`  <url>`, `    <loc>${xmlEscape(SITE + path)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

const listedCategoryIds = new Set(products.map((p) => p.category_id));
const listedCategories = (categories ?? []).filter((c) =>
  listedCategoryIds.has(c.id),
);

const entries = [
  ...STATIC_PATHS.map((path) => urlEntry(path)),
  ...listedCategories.map((c) =>
    urlEntry(`/products?category=${encodeURIComponent(c.slug)}`),
  ),
  ...products.map((p) =>
    urlEntry(
      `/products/${encodeURIComponent(p.slug)}`,
      p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
    ),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

try {
  writeFileSync(OUT, xml, "utf8");
} catch (err) {
  warnAndKeep(`Could not write sitemap (${err?.message || err})`);
}
console.log(
  `[sitemap] Wrote ${OUT} (${products.length} products, ${listedCategories.length} categories)`,
);
