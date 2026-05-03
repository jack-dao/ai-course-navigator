/**
 * Shared time and day parsing utilities used across course filtering,
 * schedule conflict detection, and calendar rendering.
 */

const DAY_REGEX = /Tu|Th|Sa|Su|M|W|F/g;

const DAY_NAMES: Record<string, string> = {
  M: 'Monday',
  Tu: 'Tuesday',
  W: 'Wednesday',
  Th: 'Thursday',
  F: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

const DAY_INDEX: Record<string, number> = {
  M: 0,
  Tu: 1,
  W: 2,
  Th: 3,
  F: 4,
};

/**
 * Parse a time string like "10:30AM" into fractional hours (10.5).
 * Returns null if the string is missing or unparseable.
 */
export const parseTimeToHours = (timeStr: string | null | undefined): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + m / 60;
};

/**
 * Parse a time string like "10:30AM" into total minutes from midnight (630).
 * Returns 0 if the string is missing or unparseable.
 */
export const parseTimeToMinutes = (timeStr: string | undefined): number => {
  if (!timeStr || timeStr === 'TBA') return 0;
  const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

/**
 * Extract day abbreviations from a combined string like "MWF" or "TuTh".
 * Returns an array like ["M", "W", "F"].
 */
export const parseDays = (dayStr: string | null | undefined): string[] => {
  if (!dayStr || dayStr === 'TBA') return [];
  return dayStr.match(DAY_REGEX) || [];
};

/**
 * Expand abbreviated days to full names: "MWF" → "Monday, Wednesday, Friday"
 */
export const expandDays = (daysStr: string | undefined): string => {
  if (!daysStr || daysStr === 'TBA') return 'TBA';
  const matches = daysStr.match(DAY_REGEX);
  if (!matches) return daysStr;
  return matches.map((d) => DAY_NAMES[d]).join(', ');
};

/**
 * Get the 0-based column index for a day abbreviation (M=0, Tu=1, ..., F=4).
 * Returns undefined for weekend days.
 */
export const getDayIndex = (dayShort: string): number | undefined => DAY_INDEX[dayShort];

/**
 * Format a time string for display, stripping leading zero: "09:30AM" → "9:30AM"
 */
export const formatDisplayTime = (timeStr: string | undefined): string => {
  if (!timeStr || timeStr === 'TBA') return '';
  return timeStr.replace(/^0/, '');
};
