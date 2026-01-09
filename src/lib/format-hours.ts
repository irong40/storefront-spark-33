/**
 * Formats business hours from database JSON into a display-friendly format
 */

type HoursRecord = Record<string, string>;

interface HoursGroup {
  days: string;
  hours: string;
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayAbbreviations: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

/**
 * Groups consecutive days with the same hours together
 * e.g., { tuesday: "10am - 6pm", wednesday: "10am - 6pm", ... }
 * becomes [{ days: "Tue - Fri", hours: "10am - 6pm" }, ...]
 */
export function formatHoursGrouped(hours: HoursRecord | null): HoursGroup[] {
  if (!hours) return [];

  const groups: HoursGroup[] = [];
  let currentGroup: { startDay: string; endDay: string; hours: string } | null = null;

  for (const day of dayOrder) {
    const dayHours = hours[day];
    if (!dayHours) continue;

    if (currentGroup && currentGroup.hours === dayHours) {
      // Extend current group
      currentGroup.endDay = day;
    } else {
      // Save previous group and start new one
      if (currentGroup) {
        groups.push({
          days: currentGroup.startDay === currentGroup.endDay
            ? dayAbbreviations[currentGroup.startDay]
            : `${dayAbbreviations[currentGroup.startDay]} - ${dayAbbreviations[currentGroup.endDay]}`,
          hours: currentGroup.hours,
        });
      }
      currentGroup = { startDay: day, endDay: day, hours: dayHours };
    }
  }

  // Don't forget the last group
  if (currentGroup) {
    groups.push({
      days: currentGroup.startDay === currentGroup.endDay
        ? dayAbbreviations[currentGroup.startDay]
        : `${dayAbbreviations[currentGroup.startDay]} - ${dayAbbreviations[currentGroup.endDay]}`,
      hours: currentGroup.hours,
    });
  }

  return groups;
}

/**
 * Formats hours as simple lines for display
 * Filters out "Closed" days by default
 */
export function formatHoursLines(hours: HoursRecord | null, showClosed = false): string[] {
  const groups = formatHoursGrouped(hours);
  return groups
    .filter(g => showClosed || g.hours.toLowerCase() !== 'closed')
    .map(g => `${g.days}: ${g.hours}`);
}
