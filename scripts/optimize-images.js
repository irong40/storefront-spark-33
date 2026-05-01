import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = './public/products';
const FAVICON_PATH = './public/favicon.png';

async function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  console.log('=== JuiceBar Image Optimizer ===\n');

  // --- Product images: PNG → WebP ---
  console.log('Processing product images...');
  const files = await readdir(PRODUCTS_DIR);
  const pngs = files.filter(f => f.toLowerCase().endsWith('.png'));

  if (pngs.length === 0) {
    console.log('No PNG files found in', PRODUCTS_DIR);
  }

  let totalInputBytes = 0;
  let totalOutputBytes = 0;

  for (const file of pngs) {
    const inputPath = join(PRODUCTS_DIR, file);
    const outputPath = join(PRODUCTS_DIR, file.replace(/\.png$/i, '.webp'));

    const inputStat = await stat(inputPath);
    totalInputBytes += inputStat.size;

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const outputStat = await stat(outputPath);
    totalOutputBytes += outputStat.size;

    const reduction = Math.round((1 - outputStat.size / inputStat.size) * 100);
    console.log(
      `  ${file.padEnd(40)} ${await formatSize(inputStat.size)} → ${await formatSize(outputStat.size)} (-${reduction}%)`
    );
  }

  if (pngs.length > 0) {
    const totalReduction = Math.round((1 - totalOutputBytes / totalInputBytes) * 100);
    console.log(`\n  TOTAL: ${await formatSize(totalInputBytes)} → ${await formatSize(totalOutputBytes)} (-${totalReduction}% saved across ${pngs.length} images)\n`);
  }

  // --- Favicon: resize to 32x32 PNG ---
  console.log('Processing favicon...');
  const faviconStat = await stat(FAVICON_PATH);
  const tempPath = './public/favicon-optimized.png';

  await sharp(FAVICON_PATH)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(tempPath);

  await rename(tempPath, FAVICON_PATH);

  const newFaviconStat = await stat(FAVICON_PATH);
  const faviconReduction = Math.round((1 - newFaviconStat.size / faviconStat.size) * 100);
  console.log(
    `  favicon.png: ${await formatSize(faviconStat.size)} → ${await formatSize(newFaviconStat.size)} (-${faviconReduction}%)`
  );

  if (newFaviconStat.size > 10 * 1024) {
    console.log(`  WARNING: favicon is still ${await formatSize(newFaviconStat.size)}, expected under 10 KB`);
  } else {
    console.log(`  favicon size OK (under 10 KB)`);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error during optimization:', err);
  process.exit(1);
});
