#!/usr/bin/env node
/**
 * Prerender static HTML for crawlers that do not run JavaScript.
 *
 * Runs automatically as the npm "postbuild" step, after `vite build`.
 * Manual run (after a build):  node scripts/prerender.js
 *
 * What it writes into dist/ (Vercel serves them with cleanUrls, so
 * about.html answers /about):
 *   app-shell.html            the untouched SPA shell; vercel.json rewrites
 *                             every app route without its own file to it
 *   index.html                /            (home)
 *   products.html             /products    (also answers ?category=...)
 *   about.html, contact.html, privacy-policy.html, terms.html
 *   products/<slug>.html      every product that is active AND is_available
 *   404.html                  served with a 404 status for unknown paths
 *
 * The page HTML comes from src/lib/prerender-html.ts, bundled here with the
 * esbuild that ships with Vite, so titles, descriptions, canonicals, prices and
 * copy use the same code as the React pages.
 *
 * Failure handling:
 *   - If app-shell.html cannot be written, the build fails: without it every
 *     rewritten route would 404.
 *   - If the Supabase fetch fails or the env vars are missing, only the static
 *     routes are written (with the fallback hours in src/config/business.ts).
 *   - Any other prerender error logs a warning and exits 0. Routes without a
 *     file fall back to app-shell.html, which is the site as it was before.
 */

import { createClient } from "@supabase/supabase-js";
import { build } from "esbuild";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const DIST = join(repoRoot, "dist");
const SHELL = join(DIST, "index.html");
const APP_SHELL = join(DIST, "app-shell.html");
const BUNDLE = join(repoRoot, "node_modules", ".cache", "prerender", "prerender-html.mjs");
const FETCH_TIMEOUT_MS = 15000;
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/i;

const log = (msg) => console.log(`[prerender] ${msg}`);
const warn = (msg) => console.warn(`[prerender] ${msg}`);

// 1. Keep a copy of the plain shell. Everything below depends on it.
if (!existsSync(SHELL)) {
  console.error("[prerender] dist/index.html is missing. Run vite build first.");
  process.exit(1);
}
const shell = readFileSync(SHELL, "utf8");
if (!shell.includes('<div id="root"></div>')) {
  // Already prerendered (script ran twice on one build): reuse the saved shell.
  if (!existsSync(APP_SHELL)) {
    console.error("[prerender] dist/index.html is not a plain shell and no app-shell.html exists.");
    process.exit(1);
  }
} else {
  try {
    copyFileSync(SHELL, APP_SHELL);
  } catch (err) {
    console.error(`[prerender] Could not write dist/app-shell.html (${err?.message || err})`);
    process.exit(1);
  }
}
const plainShell = readFileSync(APP_SHELL, "utf8");

function loadEnv() {
  for (const f of [".env.production", ".env"]) {
    const path = join(repoRoot, f);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

const EMPTY_DATA = {
  business: null,
  products: [],
  featured: [],
  categories: [],
  globalSizes: [],
};

async function fetchData() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Static routes only.");
    return EMPTY_DATA;
  }
  const timedFetch = (input, init = {}) =>
    fetch(input, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });

  try {
    // Same filters and order as useProducts(), useFeaturedProducts(),
    // useCategories(), useProductSizes() and useBusinessSettings().
    const [productsRes, featuredRes, categoriesRes, sizesRes, overridesRes, businessRes] =
      await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .eq("active", true)
          .eq("is_available", true)
          .order("sort_order", { foreignTable: "categories", ascending: true })
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .eq("active", true)
          .eq("is_featured", true)
          .order("sort_order", { ascending: true })
          .limit(4),
        supabase
          .from("categories")
          .select("name, slug")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("product_sizes")
          .select("name, price")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("product_size_overrides")
          .select("product_id, size_name, price, is_subscription, subscription_interval, sort_order")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("business_settings").select("*").single(),
      ]);
    for (const res of [productsRes, featuredRes, categoriesRes, sizesRes, overridesRes, businessRes]) {
      if (res.error) throw res.error;
    }
    if (!productsRes.data?.length) {
      warn("Supabase returned no listed products. Static routes only.");
      return { ...EMPTY_DATA, business: businessRes.data };
    }

    const variantsByProduct = new Map();
    for (const o of overridesRes.data) {
      const list = variantsByProduct.get(o.product_id) ?? [];
      list.push({
        size_name: o.size_name,
        price: Number(o.price),
        is_subscription: o.is_subscription,
        subscription_interval: o.subscription_interval,
      });
      variantsByProduct.set(o.product_id, list);
    }
    const shape = (p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      description: p.description,
      short_description: p.short_description,
      ingredients: p.ingredients,
      features: p.features,
      image_url: p.image_url,
      sku: p.sku,
      is_available: p.is_available,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      variants: variantsByProduct.get(p.id) ?? [],
    });

    return {
      business: businessRes.data,
      products: productsRes.data.map(shape),
      featured: featuredRes.data.map(shape),
      categories: categoriesRes.data,
      globalSizes: sizesRes.data.map((s) => ({ name: s.name, price: Number(s.price) })),
    };
  } catch (err) {
    warn(`Supabase fetch failed (${err?.message || err}). Static routes only.`);
    return EMPTY_DATA;
  }
}

async function loadRenderer() {
  await build({
    entryPoints: [join(repoRoot, "src", "lib", "prerender-html.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    outfile: BUNDLE,
    alias: { "@": join(repoRoot, "src") },
    logLevel: "warning",
  });
  // Query string defeats Node's module cache on repeat runs in one process.
  return import(`${pathToFileURL(BUNDLE).href}?t=${Date.now()}`);
}

try {
  const [{ prerenderPages }, data] = await Promise.all([loadRenderer(), fetchData()]);
  const products = data.products.filter((p) => {
    if (SAFE_SLUG.test(p.slug)) return true;
    warn(`Skipping product with unsafe slug ${JSON.stringify(p.slug)}`);
    return false;
  });
  const pages = prerenderPages(plainShell, { ...data, products });

  let written = 0;
  for (const page of pages) {
    if (!page.html.includes('<div id="root"><')) {
      warn(`${page.route}: empty snapshot, not written`);
      continue;
    }
    const out = join(DIST, page.file);
    try {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, page.html, "utf8");
      written += 1;
    } catch (err) {
      warn(`${page.route}: could not write ${page.file} (${err?.message || err})`);
    }
  }
  log(
    `Wrote ${written} of ${pages.length} pages (${products.length} products${
      data.business ? "" : ", no business row: fallback hours"
    }).`,
  );
} catch (err) {
  warn(`Prerender failed (${err?.stack || err}). The SPA shell still serves every route.`);
  process.exit(0);
}
