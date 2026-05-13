#!/usr/bin/env node
/**
 * Regenerate public/sitemap.xml from the live Supabase product catalog.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/generate-sitemap.js
 *
 * Falls back to .env / .env.production if those vars aren't already set.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

function loadEnv() {
  for (const f of [".env.production", ".env"]) {
    const path = join(repoRoot, f);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, "utf8").split("\n");
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
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. " +
      "Set them or add to .env.",
  );
  process.exit(1);
}

const SITE = "https://www.impressivejb.com";
const STATIC_URLS = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/products", priority: "0.9", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/contact", priority: "0.6", changefreq: "monthly" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const [{ data: products }, { data: categories }] = await Promise.all([
  supabase
    .from("products")
    .select("slug, updated_at")
    .eq("active", true)
    .order("slug"),
  supabase.from("categories").select("slug").eq("active", true).order("slug"),
]);

if (!products || !categories) {
  console.error("Failed to fetch products/categories from Supabase");
  process.exit(2);
}

function urlEntry({ loc, priority, changefreq, lastmod }) {
  const parts = [`  <url>`, `    <loc>${SITE}${loc}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

const entries = [
  ...STATIC_URLS.map(urlEntry),
  ...categories.map((c) =>
    urlEntry({
      loc: `/products?category=${c.slug}`,
      changefreq: "weekly",
      priority: "0.8",
    }),
  ),
  ...products.map((p) =>
    urlEntry({
      loc: `/products/${p.slug}`,
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.7",
    }),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

const out = join(repoRoot, "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(
  `Wrote ${out} (${products.length} products, ${categories.length} categories)`,
);
