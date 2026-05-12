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

// Returns the earliest date (YYYY-MM-DD) a customer can request for pickup or delivery,
// based on the current time in America/New_York. No same-day orders. After the 3 PM ET
// cutoff, next-day orders are also unavailable — earliest rolls to the day after.
export function getEarliestFulfillmentDate(now: Date = new Date()): string {
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
  const etYear = parseInt(map.year, 10);
  const etMonth = parseInt(map.month, 10);
  const etDay = parseInt(map.day, 10);
  const etHour = parseInt(map.hour, 10);

  const base = new Date(etYear, etMonth - 1, etDay);
  const daysToAdd = etHour < 15 ? 1 : 2; // 3 PM ET cutoff
  base.setDate(base.getDate() + daysToAdd);

  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper function to get available pickup dates (Tue-Sat within the next ~21 days,
// starting from the earliest allowable date per the same-day / 3 PM cutoff rule).
export function getAvailablePickupDates(): { value: string; label: string }[] {
  return buildAvailableDates(
    (dayOfWeek) => !!CHECKOUT_CONFIG.PICKUP_HOURS[dayOfWeek],
  );
}

// Helper function to get available delivery dates (Mon-Fri within the next ~21 days,
// starting from the earliest allowable date per the same-day / 3 PM cutoff rule).
export function getAvailableDeliveryDates(): { value: string; label: string }[] {
  return buildAvailableDates(
    (dayOfWeek) => CHECKOUT_CONFIG.DELIVERY_DAYS.includes(dayOfWeek),
  );
}

function buildAvailableDates(
  isAvailable: (dayOfWeek: number) => boolean,
): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const earliest = getEarliestFulfillmentDate();
  const [ey, em, ed] = earliest.split("-").map(Number);
  const cursor = new Date(ey, em - 1, ed);

  // Scan 21 days from the earliest allowable date.
  for (let i = 0; i < 21; i++) {
    if (isAvailable(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      dates.push({
        value: `${y}-${m}-${d}`,
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
