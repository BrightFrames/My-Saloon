/**
 * Intelligent Slot Calculation & Time Helper Utilities
 */

/**
 * Parses any duration string or number (e.g. "45 min", "120 min", "1 hour", "2 hrs", "30")
 * into a clean integer representing minutes.
 */
export function parseDurationInMinutes(durationVal: any): number {
  if (typeof durationVal === "number" && !isNaN(durationVal) && durationVal > 0) {
    return durationVal;
  }
  if (!durationVal) return 30;

  const str = String(durationVal).trim().toLowerCase();

  // Match "1 hour", "2 hours", "1.5 hr", "2 hrs"
  const hourMatch = str.match(/^([\d.]+)\s*(?:hour|hours|hr|hrs)/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return Math.round(hours * 60);
  }

  // Match "45 min", "120 mins", "30", "45"
  const minMatch = str.match(/^([\d.]+)/);
  if (minMatch) {
    const mins = parseFloat(minMatch[1]);
    return Math.round(mins);
  }

  return 30;
}

/**
 * Converts a time string (e.g. "09:00 AM", "09:30", "14:30", "2:00 PM", "8 PM", "20:00:00")
 * into minutes from midnight (0..1439).
 */
export function timeToMinutes(timeStr: string | undefined | null): number {
  if (!timeStr) return 540; // Default 09:00 AM
  const cleanStr = String(timeStr).trim().toUpperCase();

  // Match short AM/PM format (e.g. "8 AM", "8 PM", "9PM")
  const shortAmPm = cleanStr.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (shortAmPm) {
    let hours = parseInt(shortAmPm[1], 10);
    const modifier = shortAmPm[2];
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60;
  }

  // Standardize delimiters (dots -> colons)
  const normalized = cleanStr.replace(/\./g, ":");

  // Match HH:MM or HH:MM:SS with optional AM/PM
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3];

    if (modifier) {
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
    } else {
      // 24-hour time or hour without modifier
      if (hours < 7) {
        // If hour is 1..6 without AM/PM in salon context, assume PM
        hours += 12;
      }
    }
    return hours * 60 + minutes;
  }

  // Fallback default
  return 540; // 09:00 AM default
}

/**
 * Converts minutes from midnight (e.g., 570) back to 12-hour formatted time string (e.g., "09:30 AM").
 */
export function minutesToTimeString(minutes: number): string {
  const normalizedMins = Math.max(0, minutes % 1440);
  let hours = Math.floor(normalizedMins / 60);
  const mins = normalizedMins % 60;
  const modifier = hours >= 12 ? "PM" : "AM";

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMins = mins.toString().padStart(2, "0");

  return `${paddedHours}:${paddedMins} ${modifier}`;
}

/**
 * Checks if two time intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 */
export function hasOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type SlotStatus = {
  time: string;
  available: boolean;
  reason?: string;
};

export type ActiveBooking = {
  id?: string;
  booking_time?: string;
  appointment_time?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number | string;
  service_name?: string;
  booking_status?: string;
};

/**
 * Generates all candidate slots and calculates availability based on:
 * - Barber specific active bookings
 * - Service duration of the requested service
 * - Salon working hours
 */
export function calculateAvailableSlots({
  requestedDuration = 30,
  salonOpeningTime = "09:00 AM",
  salonClosingTime = "08:00 PM",
  slotInterval = 30,
  existingBookings = [],
}: {
  requestedDuration?: number | string;
  salonOpeningTime?: string;
  salonClosingTime?: string;
  slotInterval?: number;
  existingBookings?: ActiveBooking[];
}): {
  availableSlots: string[];
  allSlots: SlotStatus[];
} {
  let openingMins = timeToMinutes(salonOpeningTime);
  let closingMins = timeToMinutes(salonClosingTime);

  // Guarantee valid opening/closing window (default 09:00 AM to 08:00 PM)
  if (openingMins <= 0 || openingMins >= 1440) openingMins = 540; // 09:00 AM
  if (closingMins <= openingMins) {
    if (closingMins + 720 > openingMins) {
      closingMins += 720;
    } else {
      closingMins = 1200; // 08:00 PM
    }
  }

  const safeReqDuration = parseDurationInMinutes(requestedDuration);

  // Convert existing active bookings into minute intervals [startMins, endMins)
  const bookedIntervals = existingBookings
    .filter((b) => b.booking_status !== "cancelled")
    .map((b) => {
      const timeStr = b.booking_time || b.appointment_time || b.start_time || "09:00 AM";
      const start = timeToMinutes(timeStr);
      const duration = parseDurationInMinutes(b.duration_minutes);
      const end = start + duration;
      return { start, end, booking: b };
    });

  const allSlots: SlotStatus[] = [];
  const availableSlots: string[] = [];

  // Iterate over salon working hours in slotInterval increments (e.g. every 30 mins)
  for (let current = openingMins; current < closingMins; current += slotInterval) {
    const slotTimeStr = minutesToTimeString(current);
    const candidateStart = current;
    const candidateEnd = candidateStart + safeReqDuration;

    // Check 1: Does requested service exceed salon closing time?
    if (candidateEnd > closingMins) {
      allSlots.push({
        time: slotTimeStr,
        available: false,
        reason: "Exceeds salon working hours",
      });
      continue;
    }

    // Check 2: Does candidate interval overlap with ANY existing booking interval?
    const conflictingBooking = bookedIntervals.find((interval) =>
      hasOverlap(candidateStart, candidateEnd, interval.start, interval.end)
    );

    if (conflictingBooking) {
      const busyStartStr = minutesToTimeString(conflictingBooking.start);
      const busyEndStr = minutesToTimeString(conflictingBooking.end);
      allSlots.push({
        time: slotTimeStr,
        available: false,
        reason: `Occupied (${busyStartStr} - ${busyEndStr})`,
      });
    } else {
      allSlots.push({
        time: slotTimeStr,
        available: true,
      });
      availableSlots.push(slotTimeStr);
    }
  }

  return { availableSlots, allSlots };
}
