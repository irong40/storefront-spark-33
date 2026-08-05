// Checkout configuration constants
// These values can be adjusted based on business requirements

export const CHECKOUT_CONFIG = {
  // Tax rate as a decimal (e.g., 0.08 = 8%)
  TAX_RATE: 0.08,

  // Delivery fee defaults (overridden by business_settings.delivery_fee/threshold)
  DELIVERY_FEE: 8,
  DELIVERY_FREE_THRESHOLD: 50,
  DELIVERY_WINDOWS: [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
  ] as string[],

  // Pickup hours by day (0 = Sunday, 1 = Monday, etc.)
  // Tuesday-Friday: 10 AM - 6 PM, Saturday: 10 AM - 5 PM
  PICKUP_HOURS: {
    2: { open: "10:00", close: "18:00", label: "Tuesday" },
    3: { open: "10:00", close: "18:00", label: "Wednesday" },
    4: { open: "10:00", close: "18:00", label: "Thursday" },
    5: { open: "10:00", close: "18:00", label: "Friday" },
    6: { open: "10:00", close: "17:00", label: "Saturday" },
  } as Record<number, { open: string; close: string; label: string }>,

  // Delivery available days (Monday-Friday)
  DELIVERY_DAYS: [1, 2, 3, 4, 5] as number[],
} as const;

export type FulfillmentMode = "pickup" | "delivery";

// ---------------------------------------------------------------------------
// Renovation window
//
// The shop at 719 High St. is closed to walk-in customers for renovations.
// Until PICKUP_RESUMES_DATE we deliver only; from that date on we do pickup only
// (delivery is paused until third-party couriers are set up).
//
// The date is a plain America/New_York calendar date. Override it on Vercel with
// VITE_PICKUP_RESUMES_DATE if the renovation slips — Vite inlines env vars at
// build time, so the project must be REDEPLOYED for a change to take effect.
// ---------------------------------------------------------------------------

const DEFAULT_PICKUP_RESUMES_DATE = "2026-09-16";

// A malformed override must not silently poison every date comparison.
function readCutoverDate(): string {
  const raw = import.meta.env.VITE_PICKUP_RESUMES_DATE;
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw
    : DEFAULT_PICKUP_RESUMES_DATE;
}

export const PICKUP_RESUMES_DATE = readCutoverDate();

// YYYY-MM-DD compares lexicographically = chronologically, so no Date object
// exists at comparison time and no timezone can shift the boundary.
export const isPickupDateAllowed = (isoDate: string): boolean =>
  isoDate >= PICKUP_RESUMES_DATE;
export const isDeliveryDateAllowed = (isoDate: string): boolean =>
  isoDate < PICKUP_RESUMES_DATE;

// "T12:00:00" is load-bearing: new Date("2026-09-16") parses as UTC midnight,
// which is Sept 15 in Eastern Time and would print the wrong day.
const CUTOVER_LABEL = new Date(
  `${PICKUP_RESUMES_DATE}T12:00:00`,
).toLocaleDateString("en-US", { month: "long", day: "numeric" });

const DELIVERY_ONLY_NOTICE =
  `Our shop at 719 High St. is closed for renovations, so we're delivery-only ` +
  `right now. In-store pickup returns ${CUTOVER_LABEL}.`;

const PICKUP_ONLY_NOTICE =
  `We're back open at 719 High St.! Pickup only for the moment — delivery is ` +
  `paused while we get fully settled back in.`;

// Calendar parts for a moment as observed in America/New_York.
function getEtDateParts(now: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
  };
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Returns the earliest date (YYYY-MM-DD) a customer can request for pickup or delivery,
// based on the current time in America/New_York. No same-day orders. After the 3 PM ET
// cutoff, next-day orders are also unavailable — earliest rolls to the day after.
export function getEarliestFulfillmentDate(now: Date = new Date()): string {
  const et = getEtDateParts(now);
  const base = new Date(et.year, et.month - 1, et.day);
  const daysToAdd = et.hour < 15 ? 1 : 2; // 3 PM ET cutoff
  base.setDate(base.getDate() + daysToAdd);
  return toIsoDate(base);
}

// Helper function to get available pickup dates (Tue-Sat within the next ~21 days,
// starting from the earliest allowable date per the same-day / 3 PM cutoff rule).
// Dates before the renovation cutover are excluded — the shop is closed to walk-ins.
export function getAvailablePickupDates(
  now: Date = new Date(),
): { value: string; label: string }[] {
  return buildAvailableDates(
    (dayOfWeek) => !!CHECKOUT_CONFIG.PICKUP_HOURS[dayOfWeek],
    isPickupDateAllowed,
    now,
  );
}

// Helper function to get available delivery dates (Mon-Fri within the next ~21 days,
// starting from the earliest allowable date per the same-day / 3 PM cutoff rule).
// Dates on or after the renovation cutover are excluded — delivery is paused then.
export function getAvailableDeliveryDates(
  now: Date = new Date(),
): { value: string; label: string }[] {
  return buildAvailableDates(
    (dayOfWeek) => CHECKOUT_CONFIG.DELIVERY_DAYS.includes(dayOfWeek),
    isDeliveryDateAllowed,
    now,
  );
}

function buildAvailableDates(
  isDayAvailable: (dayOfWeek: number) => boolean,
  isDateAllowed: (isoDate: string) => boolean = () => true,
  now: Date = new Date(),
): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const earliest = getEarliestFulfillmentDate(now);
  const [ey, em, ed] = earliest.split("-").map(Number);
  const cursor = new Date(ey, em - 1, ed);

  // Scan 21 days from the earliest allowable date.
  for (let i = 0; i < 21; i++) {
    const iso = toIsoDate(cursor);
    if (isDayAvailable(cursor.getDay()) && isDateAllowed(iso)) {
      dates.push({
        value: iso,
        label: cursor.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export interface FulfillmentAvailability {
  // Modes a customer can actually book right now. A mode is offered if and only
  // if it has at least one bookable date — availability is derived, not declared.
  modes: FulfillmentMode[];
  defaultMode: FulfillmentMode;
  pickupDates: { value: string; label: string }[];
  deliveryDates: { value: string; label: string }[];
  // Explanation shown to the customer when a mode is missing. Null when both run.
  notice: string | null;
}

export function getFulfillmentAvailability(
  now: Date = new Date(),
): FulfillmentAvailability {
  const pickupDates = getAvailablePickupDates(now);
  const deliveryDates = getAvailableDeliveryDates(now);

  // Pickup first so the existing left/right card order is preserved.
  const modes: FulfillmentMode[] = [];
  if (pickupDates.length > 0) modes.push("pickup");
  if (deliveryDates.length > 0) modes.push("delivery");

  let notice: string | null = null;
  if (modes.length === 1) {
    notice = modes[0] === "delivery" ? DELIVERY_ONLY_NOTICE : PICKUP_ONLY_NOTICE;
  }

  return {
    modes,
    defaultMode: modes.includes("pickup") ? "pickup" : "delivery",
    pickupDates,
    deliveryDates,
    notice,
  };
}

// Helper function to get available time slots for a given date
export function getAvailableTimeSlots(
  dateStr: string,
): { value: string; label: string }[] {
  const date = new Date(dateStr + "T12:00:00"); // Parse in local timezone
  const dayOfWeek = date.getDay();
  const hours = CHECKOUT_CONFIG.PICKUP_HOURS[dayOfWeek];

  if (!hours) return [];

  const slots: { value: string; label: string }[] = [];
  const [openHour, openMin] = hours.open.split(":").map(Number);
  const [closeHour, closeMin] = hours.close.split(":").map(Number);

  // Generate 30-minute slots
  let currentHour = openHour;
  let currentMin = openMin;

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMin < closeMin)
  ) {
    const timeValue = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
    const timeLabel = formatTime(currentHour, currentMin);
    slots.push({ value: timeValue, label: timeLabel });

    // Add 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

// Format time as 12-hour AM/PM
function formatTime(hour: number, min: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min.toString().padStart(2, "0")} ${period}`;
}
