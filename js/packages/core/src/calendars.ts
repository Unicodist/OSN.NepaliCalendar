import { buildAdMonthView, clampAdMonth, isAdMonthInRange, shiftAdMonth, supportedAdYears } from './ad-month-view.js';
import { type AdDate, type BsDate, MAX_DATE, MIN_DATE, addDays, compareBs, toAd, toBs } from './calendar.js';
import type { CalendarType, YearMonth } from './calendar-type.js';
import { formatBs } from './format.js';
import { bsSpanLabel, layoutWeeks } from './month-grid.js';
import {
    type DateRange,
    type MonthViewDay,
    type MonthViewOptions,
    buildMonthView,
    clampMonth,
    isMonthInRange,
    shiftMonth,
    supportedYears,
} from './month-view.js';
import { DAY_NAMES, FULL_AD_MONTH_NAMES, MONTH_NAMES, type Script, toDigits } from './names.js';
import {
    NEPAL_SAMBAT_MONTH_NAMES,
    formatNepalSambat,
    nepalSambatMonthName,
    nepalSambatMonths,
    nepalSambatYear,
    toNepalSambat,
} from './nepal-sambat.js';

/** One month of a calendar, in the shape a calendar component renders. */
export interface CalendarView {
    readonly system: CalendarType;
    readonly year: number;
    /** The month's place in its year, from 1. See {@link YearMonth}. */
    readonly month: number;
    /** Rows of seven cells; `null` pads the days before the first and after the last day of the month. */
    readonly weeks: readonly (readonly (MonthViewDay | null)[])[];
    /** The months of the other calendar that this month spans: AD months for BS, BS months for AD and NS. */
    readonly otherLabel: string;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

/**
 * Everything a calendar component needs to know about one calendar: its names, its months and how
 * to lay one out. Every day is still identified by its BS date, so a component can switch between
 * calendars and keep the same selection.
 *
 * Get one with {@link getCalendar} or from {@link CALENDARS}.
 */
export interface CalendarDefinition {
    readonly type: CalendarType;
    /** The calendar's name, such as `Bikram Sambat` or `विक्रम संवत्`. */
    readonly name: Readonly<Record<Script, string>>;
    /** The calendar's short name, such as `BS` or `वि.सं.`. */
    readonly abbreviation: Readonly<Record<Script, string>>;
    /** The years with a day inside the supported range and `range`, in order, for a year picker. */
    years(range?: DateRange): number[];
    /** The names of the months of `year`, first month first. Without a year, the names of an ordinary year. */
    monthNames(script?: Script, year?: number): readonly string[];
    /** The month that contains a BS date. */
    monthOf(date: BsDate): YearMonth;
    /** Brings a month inside the supported range and `range`. */
    clampMonth(year: number, month: number, range?: DateRange): YearMonth;
    /** Moves a month by `delta` months, clamped to the supported range and to `range`. */
    shiftMonth(year: number, month: number, delta: number, range?: DateRange): YearMonth;
    /** Whether any day of a month lies inside the supported range and `range`. */
    isMonthInRange(year: number, month: number, range?: DateRange): boolean;
    /** A day near the middle of a month, used to keep the same days in view when switching calendars. */
    midMonth(year: number, month: number): BsDate;
    /** Builds the grid for one month. */
    buildView(year: number, month: number, options?: MonthViewOptions): CalendarView;
    /** The number to show in a day's cell: the BS day, the AD day or the tithi. */
    dayNumber(day: MonthViewDay): number;
    /** The smaller number to show under it, from the other calendar: the AD day for BS, else the BS day. */
    otherDayNumber(day: MonthViewDay): number;
    /** A full name for a day, such as `Mangalbar, 15 Shrawan 2081`, for screen readers and tooltips. */
    dayLabel(day: MonthViewDay, script?: Script): string;
}

/** Bikram Sambat (विक्रम संवत्), Nepal's official solar calendar. */
export const BIKRAM_SAMBAT: CalendarDefinition = Object.freeze({
    type: 'bs',
    name: { roman: 'Bikram Sambat', nepali: 'विक्रम संवत्' },
    abbreviation: { roman: 'BS', nepali: 'वि.सं.' },
    years: (range: DateRange = {}) => supportedYears(range),
    monthNames: (script: Script = 'roman') => MONTH_NAMES[script],
    monthOf: ({ year, month }: BsDate) => ({ year, month }),
    clampMonth: (year: number, month: number, range: DateRange = {}) => clampMonth(year, month, range),
    shiftMonth: (year: number, month: number, delta: number, range: DateRange = {}) =>
        shiftMonth(year, month, delta, range),
    isMonthInRange: (year: number, month: number, range: DateRange = {}) => isMonthInRange(year, month, range),
    midMonth: (year: number, month: number) => clampToSupported({ year, month, day: 15 }),
    buildView(year: number, month: number, options: MonthViewOptions = {}): CalendarView {
        const { adLabel, ...view } = buildMonthView(year, month, options);
        return { system: 'bs', ...view, otherLabel: adLabel };
    },
    dayNumber: (day: MonthViewDay) => day.bs.day,
    otherDayNumber: (day: MonthViewDay) => day.ad.day,
    dayLabel: (day: MonthViewDay, script: Script = 'roman') => formatBs(day.bs, 'F', script),
});

/** The Gregorian calendar (ईस्वी संवत्, AD). */
export const GREGORIAN: CalendarDefinition = Object.freeze({
    type: 'ad',
    name: { roman: 'Gregorian', nepali: 'ईस्वी संवत्' },
    abbreviation: { roman: 'AD', nepali: 'ई.सं.' },
    years: (range: DateRange = {}) => supportedAdYears(range),
    monthNames: (script: Script = 'roman') => FULL_AD_MONTH_NAMES[script],
    monthOf: (date: BsDate) => {
        const { year, month } = toAd(date);
        return { year, month };
    },
    clampMonth: (year: number, month: number, range: DateRange = {}) => clampAdMonth(year, month, range),
    shiftMonth: (year: number, month: number, delta: number, range: DateRange = {}) =>
        shiftAdMonth(year, month, delta, range),
    isMonthInRange: (year: number, month: number, range: DateRange = {}) => isAdMonthInRange(year, month, range),
    midMonth: (year: number, month: number) =>
        tryToBs({ year, month, day: 15 }) ?? (year <= toAd(MIN_DATE).year ? MIN_DATE : MAX_DATE),
    buildView(year: number, month: number, options: MonthViewOptions = {}): CalendarView {
        const { bsLabel, ...view } = buildAdMonthView(year, month, options);
        return { system: 'ad', ...view, otherLabel: bsLabel };
    },
    dayNumber: (day: MonthViewDay) => day.ad.day,
    otherDayNumber: (day: MonthViewDay) => day.bs.day,
    dayLabel(day: MonthViewDay, script: Script = 'roman'): string {
        const { year, month, day: date } = day.ad;
        const weekday = DAY_NAMES[script][day.dayOfWeek];
        return `${weekday}, ${toDigits(date, script)} ${FULL_AD_MONTH_NAMES[script][month - 1]} ${toDigits(year, script)}`;
    },
});

/**
 * Nepal Sambat (नेपाल संवत्), the lunar calendar. Its months run from the day after a new moon to the
 * next new moon, and a year with a leap month (Anala) has 13 of them, so a month is identified by its
 * place in the year. Each day shows its tithi.
 */
export const NEPAL_SAMBAT: CalendarDefinition = Object.freeze({
    type: 'ns',
    name: { roman: 'Nepal Sambat', nepali: 'नेपाल संवत्' },
    abbreviation: { roman: 'NS', nepali: 'ने.सं.' },
    years(range: DateRange = {}): number[] {
        const { low, high } = nsBounds(range);
        return Array.from({ length: Math.max(high.year - low.year + 1, 0) }, (_, i) => low.year + i);
    },
    monthNames(script: Script = 'roman', year?: number): readonly string[] {
        if (year === undefined) {
            return NEPAL_SAMBAT_MONTH_NAMES[script];
        }
        return nepalSambatMonths(year).map((m) => nepalSambatMonthName(m.month, m.isLeapMonth, script));
    },
    monthOf: nsMonthOf,
    clampMonth: nsClampMonth,
    shiftMonth(year: number, month: number, delta: number, range: DateRange = {}): YearMonth {
        let y = year;
        let m = month + delta;
        while (m < 1 && nepalSambatMonths(y - 1).length) {
            y--;
            m += nepalSambatMonths(y).length;
        }
        while (m > nepalSambatMonths(y).length && nepalSambatMonths(y + 1).length) {
            m -= nepalSambatMonths(y).length;
            y++;
        }
        return nsClampMonth(y, m, range);
    },
    isMonthInRange(year: number, month: number, range: DateRange = {}): boolean {
        if (!nepalSambatMonths(year)[month - 1]) {
            return false;
        }
        const { low, high } = nsBounds(range);
        const at = { year, month };
        return compareMonths(at, low) >= 0 && compareMonths(at, high) <= 0;
    },
    midMonth(year: number, month: number): BsDate {
        const { year: y, month: m } = nsClampMonth(year, month);
        const span = nepalSambatMonths(y)[m - 1]!;
        const length = dayDifference(span.first, span.last) + 1;
        return addDays(span.first, Math.min(14, length - 1));
    },
    buildView(year: number, month: number, options: MonthViewOptions = {}): CalendarView {
        const span = nepalSambatMonths(year)[month - 1];
        if (!span) {
            throw new RangeError(`Nepal Sambat ${year} has no month ${month}.`);
        }
        const length = dayDifference(span.first, span.last) + 1;
        const days = Array.from({ length }, (_, i) => addDays(span.first, i));
        const { low, high } = nsBounds(options);
        const at = { year, month };
        return {
            system: 'ns',
            year,
            month,
            weeks: layoutWeeks(days, options),
            otherLabel: bsSpanLabel(span.first, span.last, options.script ?? 'roman'),
            hasPrevious: compareMonths(at, low) > 0,
            hasNext: compareMonths(at, high) < 0,
        };
    },
    dayNumber: (day: MonthViewDay) => toNepalSambat(day.bs).tithi,
    otherDayNumber: (day: MonthViewDay) => day.bs.day,
    dayLabel: (day: MonthViewDay, script: Script = 'roman') =>
        `${DAY_NAMES[script][day.dayOfWeek]}, ${formatNepalSambat(toNepalSambat(day.bs), 'G', script)}`,
});

/** Every calendar, by type. */
export const CALENDARS: Readonly<Record<CalendarType, CalendarDefinition>> = Object.freeze({
    bs: BIKRAM_SAMBAT,
    ad: GREGORIAN,
    ns: NEPAL_SAMBAT,
});

/**
 * Returns the definition of a calendar type.
 * @throws RangeError when `type` is not a calendar type.
 */
export function getCalendar(type: CalendarType): CalendarDefinition {
    const calendar = Object.prototype.hasOwnProperty.call(CALENDARS, type) ? CALENDARS[type] : undefined;
    if (!calendar) {
        throw new RangeError(
            `'${String(type)}' is not a calendar type. Use one of ${Object.keys(CALENDARS).join(', ')}.`,
        );
    }
    return calendar;
}

function nsMonthOf(date: BsDate): YearMonth {
    const year = nepalSambatYear(date);
    const index = nepalSambatMonths(year).findIndex((m) => compareBs(date, m.last) <= 0);
    return { year, month: index + 1 };
}

function nsClampMonth(year: number, month: number, range: DateRange = {}): YearMonth {
    const { low, high } = nsBounds(range);
    if (year < low.year) return low;
    if (year > high.year) return high;
    const count = nepalSambatMonths(year).length;
    const at = { year, month: Math.min(Math.max(month, 1), count) };
    if (compareMonths(at, low) < 0) return low;
    if (compareMonths(at, high) > 0) return high;
    return at;
}

/** The first and last Nepal Sambat months inside the supported range and `range`. */
function nsBounds({ min, max }: DateRange): { low: YearMonth; high: YearMonth } {
    return {
        low: nsMonthOf(min && compareBs(min, MIN_DATE) > 0 ? clampToSupported(min) : MIN_DATE),
        high: nsMonthOf(max && compareBs(max, MAX_DATE) < 0 ? clampToSupported(max) : MAX_DATE),
    };
}

function compareMonths(a: YearMonth, b: YearMonth): number {
    return a.year - b.year || a.month - b.month;
}

function clampToSupported(date: BsDate): BsDate {
    if (compareBs(date, MIN_DATE) < 0) return MIN_DATE;
    if (compareBs(date, MAX_DATE) > 0) return MAX_DATE;
    return date;
}

function dayDifference(from: BsDate, to: BsDate): number {
    return Math.round((utc(toAd(to)) - utc(toAd(from))) / 86_400_000);
}

function utc({ year, month, day }: AdDate): number {
    return Date.UTC(year, month - 1, day);
}

function tryToBs(date: AdDate): BsDate | null {
    try {
        return toBs(date);
    } catch {
        return null;
    }
}
