/**
 * Interface representing a Firestore timestamp
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Checks if a value is a Firestore timestamp
 */
export function isFirestoreTimestamp(value: any): value is FirestoreTimestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    "nanoseconds" in value &&
    typeof value.seconds === "number" &&
    typeof value.nanoseconds === "number"
  );
}

/**
 * Converts a Firestore timestamp to a JavaScript Date object
 */
export function toDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }

  if (isFirestoreTimestamp(value)) {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
  }

  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate();
  }

  // If it's a valid timestamp (number), convert it to a date
  if (typeof value === "number") {
    return new Date(value);
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Default to current date if value is invalid
  return new Date();
}

/**
 * Safely converts any date-like value to a Date object
 */
export function ensureDate(value: any): Date {
  if (value === null || value === undefined) {
    return new Date();
  }

  return toDate(value);
}

/**
 * Formats a date as ISO string (or another standard format)
 */
export function formatDate(date: Date | any): string {
  const safeDate = ensureDate(date);
  return safeDate.toISOString();
}
