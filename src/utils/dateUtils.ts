export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

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

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

export function ensureDate(value: any): Date {
  if (value === null || value === undefined) {
    return new Date();
  }

  return toDate(value);
}

export function formatDate(date: Date | any): string {
  const safeDate = ensureDate(date);
  return safeDate.toISOString();
}
