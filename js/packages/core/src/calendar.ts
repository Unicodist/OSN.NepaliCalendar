import { MONTH_LENGTHS } from './month-lengths.js';

/** A Nepali (Bikram Sambat) date. `month` runs from 1 (Baisakh) to 12 (Chaitra). */
export interface BsDate {
    readonly year: number;
    readonly month: number;
    readonly day: number;
}

/** A Gregorian (AD) calendar date with no time or time zone. `month` runs from 1 to 12. */
export interface AdDate {
    readonly year: number;
    readonly month: number;
    readonly day: number;
}

/** The first supported BS year. */
export const MIN_YEAR = 1970;

/** The last supported BS year. */
export const MAX_YEAR = MIN_YEAR + MONTH_LENGTHS.length - 1;

const MS_PER_DAY = 86_400_000;

/** BS 1970-01-01 is AD 1913-04-13. */
const ANCHOR = Date.UTC(1913, 3, 13);

/** Days from the anchor to the first day of each year, plus one trailing total. */
const YEAR_STARTS: readonly number[] = (() => {
    const starts = [0];
    for (const row of MONTH_LENGTHS) {
        starts.push(starts[starts.length - 1]! + row.reduce((sum, days) => sum + days, 0));
    }
    return starts;
})();

const TOTAL_DAYS = YEAR_STARTS[YEAR_STARTS.length - 1]!;

/** The first supported BS date, 1970-01-01. */
export const MIN_DATE: BsDate = Object.freeze({ year: MIN_YEAR, month: 1, day: 1 });

/** The last supported BS date. */
export const MAX_DATE: BsDate = Object.freeze({
    year: MAX_YEAR,
    month: 12,
    day: MONTH_LENGTHS[MONTH_LENGTHS.length - 1]![11]!,
});

/** Returns whether `year` is within the supported range. */
export function isSupportedYear(year: number): boolean {
    return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

/**
 * Returns the number of days in a BS month.
 * @throws RangeError when the year or month is out of range.
 */
export function daysInMonth(year: number, month: number): number {
    if (!isSupportedYear(year)) {
        throw new RangeError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new RangeError('Month must be between 1 and 12.');
    }
    return MONTH_LENGTHS[year - MIN_YEAR]![month - 1]!;
}

/** Returns whether the year, month and day make a BS date that exists in the supported range. */
export function isValidBsDate(year: number, month: number, day: number): boolean {
    return (
        isSupportedYear(year) &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12 &&
        Number.isInteger(day) &&
        day >= 1 &&
        day <= MONTH_LENGTHS[year - MIN_YEAR]![month - 1]!
    );
}

/**
 * Creates a BS date, checking that it exists.
 * @throws RangeError when the date does not exist or is out of range.
 */
export function bsDate(year: number, month: number, day: number): BsDate {
    assertValidBs({ year, month, day });
    return { year, month, day };
}

/** Returns the number of days from BS 1970-01-01 to a valid BS date. */
function toDayNumber(date: BsDate): number {
    const row = MONTH_LENGTHS[date.year - MIN_YEAR]!;
    let dayNumber = YEAR_STARTS[date.year - MIN_YEAR]!;
    for (let m = 1; m < date.month; m++) {
        dayNumber += row[m - 1]!;
    }
    return dayNumber + date.day - 1;
}

/** Returns the BS date `dayNumber` days after BS 1970-01-01. */
function fromDayNumber(dayNumber: number): BsDate {
    let index = 0;
    let high = MONTH_LENGTHS.length - 1;
    while (index < high) {
        const mid = (index + high + 1) >> 1;
        if (YEAR_STARTS[mid]! <= dayNumber) {
            index = mid;
        } else {
            high = mid - 1;
        }
    }

    const row = MONTH_LENGTHS[index]!;
    let remaining = dayNumber - YEAR_STARTS[index]!;
    let month = 1;
    while (remaining >= row[month - 1]!) {
        remaining -= row[month - 1]!;
        month++;
    }
    return { year: MIN_YEAR + index, month, day: remaining + 1 };
}

function assertValidBs(date: BsDate): void {
    if (!isValidBsDate(date.year, date.month, date.day)) {
        throw new RangeError(
            `${date.year}-${date.month}-${date.day} is not a BS date between ${MIN_YEAR}-01-01 and ${MAX_YEAR}-12-${MAX_DATE.day}.`,
        );
    }
}

function adToUtc(date: AdDate | Date): number {
    if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) {
            throw new RangeError('Date is invalid.');
        }
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const utc = Date.UTC(date.year, date.month - 1, date.day);
    const check = new Date(utc);
    if (
        !Number.isInteger(date.year) ||
        check.getUTCFullYear() !== date.year ||
        check.getUTCMonth() !== date.month - 1 ||
        check.getUTCDate() !== date.day
    ) {
        throw new RangeError(`${date.year}-${date.month}-${date.day} is not a valid Gregorian date.`);
    }
    return utc;
}

/**
 * Converts a BS date to its Gregorian (AD) equivalent.
 * @throws RangeError when the BS date does not exist or is out of range.
 */
export function toAd(date: BsDate): AdDate {
    assertValidBs(date);
    const utc = new Date(ANCHOR + toDayNumber(date) * MS_PER_DAY);
    return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/**
 * Converts a Gregorian (AD) date to its BS equivalent. A `Date` is read in local time and its
 * time of day is ignored.
 * @throws RangeError when the date is invalid or outside the supported range.
 */
export function toBs(date: AdDate | Date): BsDate {
    const dayNumber = Math.round((adToUtc(date) - ANCHOR) / MS_PER_DAY);
    if (dayNumber < 0 || dayNumber >= TOTAL_DAYS) {
        const max = toAd(MAX_DATE);
        throw new RangeError(`Date must be between 1913-04-13 and ${formatIso(max)}.`);
    }
    return fromDayNumber(dayNumber);
}

/** Returns a local-time `Date` at midnight for a Gregorian date. */
export function toJsDate(date: AdDate): Date {
    adToUtc(date);
    return new Date(date.year, date.month - 1, date.day);
}

/** Returns the BS date of today (or of `now`) in local time. */
export function todayBs(now: Date = new Date()): BsDate {
    return toBs(now);
}

/** Returns the day of the week of a BS date, 0 (Sunday, आइतबार) to 6 (Saturday, शनिबार). */
export function dayOfWeek(date: BsDate): number {
    assertValidBs(date);
    // BS 1970-01-01 (AD 1913-04-13) was a Sunday.
    return toDayNumber(date) % 7;
}

/** Returns the BS date `days` days after (or before, when negative) `date`. */
export function addDays(date: BsDate, days: number): BsDate {
    assertValidBs(date);
    const dayNumber = toDayNumber(date) + days;
    if (!Number.isInteger(days) || dayNumber < 0 || dayNumber >= TOTAL_DAYS) {
        throw new RangeError('The result is outside the supported range.');
    }
    return fromDayNumber(dayNumber);
}

/**
 * Returns the year and month `delta` months from the given BS month.
 * @throws RangeError when the result is outside the supported range.
 */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
    const index = year * 12 + (month - 1) + delta;
    const result = { year: Math.floor(index / 12), month: (index % 12) + 1 };
    if (!isSupportedYear(result.year)) {
        throw new RangeError('The result is outside the supported range.');
    }
    return result;
}

/** Compares two BS dates: negative when `a` is earlier, positive when later, 0 when equal. */
export function compareBs(a: BsDate, b: BsDate): number {
    return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Returns whether two BS dates are the same day. Either may be `null` or `undefined`. */
export function isSameBs(a: BsDate | null | undefined, b: BsDate | null | undefined): boolean {
    return a != null && b != null && compareBs(a, b) === 0;
}

function formatIso(date: AdDate | BsDate): string {
    return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

/** Returns `yyyy-MM-dd` for a BS or AD date, with Latin digits. */
export function toIsoString(date: AdDate | BsDate): string {
    return formatIso(date);
}

/**
 * Parses `yyyy-MM-dd` (or `yyyy/MM/dd`) as a BS date. Returns `null` when the text is not a valid BS date.
 */
export function parseBs(text: string): BsDate | null {
    const match = /^\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*$/.exec(text);
    if (!match) {
        return null;
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return isValidBsDate(year, month, day) ? { year, month, day } : null;
}
