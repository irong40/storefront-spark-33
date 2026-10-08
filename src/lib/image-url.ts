/**
 * Every PNG in public/products has a pre-encoded .webp sibling (scripts/optimize-images.js)
 * that is roughly 10x smaller. DB rows and size overrides still point at the PNG, so swap
 * to the WebP at render time. ProductImage falls back to the original PNG if the WebP fails.
 */
const LOCAL_PRODUCT_PNG =
  /^(?:https?:\/\/(?:www\.)?impressivejb\.com)?(\/products\/[^/?#]+)\.png$/i;

export function optimizedImageSrc(src: string): string {
  const match = src.match(LOCAL_PRODUCT_PNG);
  return match ? `${match[1]}.webp` : src;
}
