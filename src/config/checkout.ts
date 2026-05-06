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

// Helper function to get available pickup dates (next 14 days, only valid days)
export function getAvailablePickupDates(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();

    // Check if this day has pickup hours (Tue-Sat: 2-6)
    if (CHECKOUT_CONFIG.PICKUP_HOURS[dayOfWeek]) {
      const dateStr = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dates.push({ value: dateStr, label });
    }
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
