import {
    type CalendarSystem,
    buildAdMonthView,
    clampAdMonth,
    isAdMonthInRange,
    supportedAdYears,
} from './ad-month-view.js';
import { formatBs } from './format.js';
import {
    type DateRange,
    type MonthViewDay,
    type MonthViewOptions,
    buildMonthView,
    clampMonth,
    isMonthInRange,
    supportedYears,
} from './month-view.js';
import { DAY_NAMES, FULL_AD_MONTH_NAMES, MONTH_NAMES, type Script, toDigits } from './names.js';

/**
 * One month of either calendar, in the shape a calendar component renders: a BS month from
 * `buildMonthView` or a Gregorian month from `buildAdMonthView`.
 */
export interface CalendarView {
    readonly system: CalendarSystem;
    readonly year: number;
    readonly month: number;
    readonly weeks: readonly (readonly (MonthViewDay | null)[])[];
    /** The months of the other calendar that this month spans. */
    readonly otherLabel: string;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

/** Builds the grid for one month of `system`. */
export function buildCalendarView(
    system: CalendarSystem,
    year: number,
    month: number,
    options: MonthViewOptions = {},
): CalendarView {
    if (system === 'ad') {
        const { bsLabel, ...view } = buildAdMonthView(year, month, options);
        return { system, ...view, otherLabel: bsLabel };
    }
    const { adLabel, ...view } = buildMonthView(year, month, options);
    return { system, ...view, otherLabel: adLabel };
}

/** Brings a year and month of `system` inside the supported range and `range`. The month may overflow. */
export function clampCalendarMonth(
    system: CalendarSystem,
    year: number,
    month: number,
    range: DateRange = {},
): { year: number; month: number } {
    return system === 'ad' ? clampAdMonth(year, month, range) : clampMonth(year, month, range);
}

/** Whether any day of a month of `system` lies inside the supported range and `range`. */
export function isCalendarMonthInRange(
    system: CalendarSystem,
    year: number,
    month: number,
    range: DateRange = {},
): boolean {
    return system === 'ad' ? isAdMonthInRange(year, month, range) : isMonthInRange(year, month, range);
}

/** The years of `system` with a day inside the supported range and `range`. */
export function calendarYears(system: CalendarSystem, range: DateRange = {}): number[] {
    return system === 'ad' ? supportedAdYears(range) : supportedYears(range);
}

/** The month names of `system`, first month first. */
export function calendarMonthNames(system: CalendarSystem, script: Script = 'roman'): readonly string[] {
    return system === 'ad' ? FULL_AD_MONTH_NAMES[script] : MONTH_NAMES[script];
}

/**
 * A full name for a day in `system`, such as `Mangalbar, 15 Shrawan 2081` or
 * `Mangalbar, 30 July 2024`, for screen readers.
 */
export function dayLabel(day: MonthViewDay, system: CalendarSystem, script: Script = 'roman'): string {
    if (system === 'bs') {
        return formatBs(day.bs, 'F', script);
    }
    const { year, month, day: date } = day.ad;
    const weekday = DAY_NAMES[script][day.dayOfWeek];
    return `${weekday}, ${toDigits(date, script)} ${FULL_AD_MONTH_NAMES[script][month - 1]} ${toDigits(year, script)}`;
}
