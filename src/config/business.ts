// Business facts shared by page copy, SEO strings and checkout.
//
// The live source of truth for hours is the Supabase business_settings row
// (Admin > Business Settings). Components that can wait for that row should
// render it through formatHoursLines(). The constants below mirror the row for
// the places that cannot: static SEO strings, index.html JSON-LD, the checkout
// pickup slot table (CHECKOUT_CONFIG.PICKUP_HOURS) and load-failure fallbacks.
// When the row's hours change, update FALLBACK_HOURS, HOURS_SUMMARY,
// CHECKOUT_CONFIG.PICKUP_HOURS and the index.html openingHoursSpecification.

export const FALLBACK_HOURS: Record<string, string> = {
  monday: "Closed",
  tuesday: "7am-7pm",
  wednesday: "7am-7pm",
  thursday: "7am-7pm",
  friday: "7am-7pm",
  saturday: "8am-5pm",
  sunday: "Closed",
};

export const HOURS_SUMMARY = "Tue-Fri 7am-7pm, Sat 8am-5pm";

export const STREET_ADDRESS = "719 High St";

// How the pickup spot is named everywhere on the site.
export const PICKUP_LOCATION_NAME = "imPRESSive Juice Bar, inside Bloom Market";
export const PICKUP_LOCATION = `${PICKUP_LOCATION_NAME}, ${STREET_ADDRESS}`;

// One fulfillment sentence for SEO descriptions. The shop is pickup only.
export const FULFILLMENT_SNIPPET = `Order online for pickup at ${STREET_ADDRESS}, ${HOURS_SUMMARY}.`;

// Contact facts, matching the business_settings row (2026-10-07). Used only
// when the row cannot be read, and by the build-time prerender.
export const BUSINESS_NAME = "imPRESSive Juice Bar";
export const CITY = "Portsmouth";
export const STATE = "VA";
export const ZIP = "23704";
export const BUSINESS_EMAIL = "info@impressivejb.com";
export const BUSINESS_PHONE = "(757) 381-6980";
