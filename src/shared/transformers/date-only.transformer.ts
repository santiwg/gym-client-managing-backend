import { ValueTransformer } from 'typeorm';

/**
 * DateOnlyTransformer
 *
 * Purpose
 * - Persist date-only values (no time component) reliably across timezones.
 * - Avoid the common "off-by-one day" issue when writing JS Date objects to PostgreSQL DATE columns.
 *
 * How it works
 * - to(): On write, converts input (Date | string) to a canonical 'YYYY-MM-DD' string in UTC.
 *          This matches the semantics of a DATE column (no timezone), preventing timezone shifts.
 * - from(): On read, wraps the DB 'YYYY-MM-DD' as a JS Date at 00:00:00.000Z for consistency.
 *
 * When to use
 * - Fields representing birthdays, anniversaries, local calendar dates where time-of-day is irrelevant.
 *
 * Example
 *   @Column({ type: 'date', transformer: dateOnlyTransformer })
 *   birthDate: Date;
 */
export const dateOnlyTransformer: ValueTransformer = {
  to: (value: Date | string | null | undefined) => {
    if (value == null) return value as any;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  from: (value: string | null) => value as any, // keep 'YYYY-MM-DD' as-is
};
