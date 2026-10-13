// Functions that take a calendar type and forward to its CalendarDefinition. Components can call
// getCalendar(type) once and use the definition directly instead.
import type { BsDate } from './calendar.js';
import type { CalendarType, YearMonth } from './calendar-type.js';
import { type CalendarView, getCalendar } from './calendars.js';
import type { DateRange, MonthViewDay, MonthViewOptions } from './month-view.js';
import type { Script } from './names.js';

/** Builds the grid for one month of `system`. */
export function buildCalendarView(
    system: CalendarType,
    year: number,
    month: number,
    options: MonthViewOptions = {},
): CalendarView {
    return getCalendar(system).buildView(year, month, options);
}

/**
 * Brings a year and month of `system` inside the supported range and `range`. For BS and AD the
 * month may overflow, so month 13 is the first month of the next year.
 */
export function clampCalendarMonth(
    system: CalendarType,
    year: number,
    month: number,
    range: DateRange = {},
): YearMonth {
    return getCalendar(system).clampMonth(year, month, range);
}

/** Whether any day of a month of `system` lies inside the supported range and `range`. */
export function isCalendarMonthInRange(
    system: CalendarType,
    year: number,
    month: number,
    range: DateRange = {},
): boolean {
    return getCalendar(system).isMonthInRange(year, month, range);
}

/** The years of `system` with a day inside the supported range and `range`. */
export function calendarYears(system: CalendarType, range: DateRange = {}): number[] {
    return getCalendar(system).years(range);
}

/**
 * The month names of `system`, first month first. Nepal Sambat years differ (some have a leap
 * month), so pass `year` to get the months of that year.
 */
export function calendarMonthNames(system: CalendarType, script: Script = 'roman', year?: number): readonly string[] {
    return getCalendar(system).monthNames(script, year);
}

/**
 * A full name for a day in `system`, such as `Mangalbar, 15 Shrawan 2081` or
 * `Mangalbar, 30 July 2024`, for screen readers.
 */
export function dayLabel(day: MonthViewDay, system: CalendarType, script: Script = 'roman'): string {
    return getCalendar(system).dayLabel(day, script);
}

/**
 * The year and month, in `system`, of the month that contains a BS date. Handy for switching a
 * calendar between systems while keeping the same days in view.
 */
export function monthOf(date: BsDate, system: CalendarType): YearMonth {
    return getCalendar(system).monthOf(date);
}

/**
 * Converts a month shown in one calendar to the month to show in another. The selected date is
 * kept in view when it is in the month; otherwise the middle of the month decides.
 */
export function convertMonth(
    year: number,
    month: number,
    from: CalendarType,
    to: CalendarType,
    selected?: BsDate | null,
): YearMonth {
    if (from === to) {
        return { year, month };
    }
    const source = getCalendar(from);
    if (selected) {
        const selectedMonth = source.monthOf(selected);
        if (selectedMonth.year === year && selectedMonth.month === month) {
            return getCalendar(to).monthOf(selected);
        }
    }
    return getCalendar(to).monthOf(source.midMonth(year, month));
}
