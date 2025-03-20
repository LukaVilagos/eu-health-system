export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type DateInput =
  | Date
  | FirestoreTimestamp
  | { toDate: () => Date }
  | number
  | string
  | null
  | undefined;

export function isFirestoreTimestamp(
  value: DateInput
): value is FirestoreTimestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    "nanoseconds" in value &&
    typeof (value as FirestoreTimestamp).seconds === "number" &&
    typeof (value as FirestoreTimestamp).nanoseconds === "number"
  );
}

export function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }

  if (isFirestoreTimestamp(value)) {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
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

export function ensureDate(value: DateInput): Date {
  if (value === null || value === undefined) {
    return new Date();
  }

  return toDate(value);
}

export function formatDate(date: DateInput): string {
  const safeDate = ensureDate(date);
  return safeDate.toISOString();
}
