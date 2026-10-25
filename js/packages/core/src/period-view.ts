// Grids for picking a whole month or a whole year instead of a day, in any calendar.
import type { BsDate } from './calendar.js';
import type { CalendarType } from './calendar-type.js';
import { type CalendarDefinition, getCalendar } from './calendars.js';
import type { DateRange, MonthViewDay, MonthViewOptions } from './month-view.js';
import { AD_MONTH_NAMES, MONTH_NAMES, type Script, toDigits } from './names.js';

/**
 * What a calendar component lets the user pick: a `day` (the default), a whole `month` or a whole
 * `year`. The picked value is still a BS date: the first day of the month or year in range.
 */
export type PickLevel = 'day' | 'month' | 'year';

/** Every pick level, finest first. */
export const PICK_LEVELS: readonly PickLevel[] = Object.freeze(['day', 'month', 'year'] as const);

/** How many years a page of the year picker shows. */
export const YEARS_PER_PAGE = 12;

/** One month in a {@link MonthPickerView}. */
export interface MonthPickerCell {
    readonly year: number;
    /** The month's place in its year, from 1. */
    readonly month: number;
    /** `yyyy-MM`, handy as a key. */
    readonly key: string;
    /** The month's name, such as `Shrawan` or `July`. */
    readonly name: string;
    /** The month's name and year, such as `Shrawan 2081`, for screen readers and tooltips. */
    readonly label: string;
    /** The months of the other calendar it spans, such as `Jul/Aug`; the header gives their years. */
    readonly otherLabel: string;
    /** Whether today falls in the month. */
    readonly isCurrent: boolean;
    /** Whether the selected date falls in the month. */
    readonly isSelected: boolean;
    /** Whether no day of the month lies inside the supported range and `min`/`max`. */
    readonly isDisabled: boolean;
}

/** The months of one year of a calendar, ready to render as a grid. */
export interface MonthPickerView {
    readonly system: CalendarType;
    readonly year: number;
    readonly months: readonly MonthPickerCell[];
    /** The years of the other calendar the year spans, such as `2024/2025`. */
    readonly otherLabel: string;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

/** One year in a {@link YearPickerView}. */
export interface YearPickerCell {
    readonly year: number;
    /** The year as a string, handy as a key. */
    readonly key: string;
    /** The year in the chosen script's digits, such as `२०८१`. */
    readonly name: string;
    /** The year with the calendar's abbreviation, such as `2081 BS`, for screen readers and tooltips. */
    readonly label: string;
    /** The years of the other calendar it spans, such as `2024/2025`. Empty when it is disabled. */
    readonly otherLabel: string;
    readonly isCurrent: boolean;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
}

/** A page of {@link YEARS_PER_PAGE} years of a calendar, ready to render as a grid. */
export interface YearPickerView {
    readonly system: CalendarType;
    /** The year the page was built for. */
    readonly year: number;
    /** The first and last years on the page. */
    readonly first: number;
    readonly last: number;
    readonly years: readonly YearPickerCell[];
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

/** Builds the month grid for one year of `system`. */
export function buildMonthPicker(system: CalendarType, year: number, options: MonthViewOptions = {}): MonthPickerView {
    const cal = getCalendar(system);
    const script = options.script ?? 'roman';
    const today = options.today ? cal.monthOf(options.today) : null;
    const selected = options.selected ? cal.monthOf(options.selected) : null;
    const years = cal.years(options);
    const months = cal.monthNames(script, year).map((name, i): MonthPickerCell => {
        const month = i + 1;
        return {
            year,
            month,
            key: `${year}-${String(month).padStart(2, '0')}`,
            name,
            label: `${name} ${toDigits(year, script)}`,
            otherLabel: otherMonthsLabel(cal, year, month, script),
            isCurrent: today?.year === year && today.month === month,
            isSelected: selected?.year === year && selected.month === month,
            isDisabled: !cal.isMonthInRange(year, month, options),
        };
    });
    return {
        system,
        year,
        months,
        otherLabel: otherYearsLabel(cal, year, script),
        hasPrevious: years.length > 0 && years[0]! < year,
        hasNext: years.length > 0 && years[years.length - 1]! > year,
    };
}

/**
 * Builds the page of the year grid that holds `year`. Pages start at multiples of
 * {@link YEARS_PER_PAGE}, so paging back and forth always shows the same years together.
 */
export function buildYearPicker(system: CalendarType, year: number, options: MonthViewOptions = {}): YearPickerView {
    const cal = getCalendar(system);
    const script = options.script ?? 'roman';
    const inRange = new Set(cal.years(options));
    const today = options.today ? cal.monthOf(options.today).year : null;
    const selected = options.selected ? cal.monthOf(options.selected).year : null;
    const first = yearPageStart(year);
    const last = first + YEARS_PER_PAGE - 1;
    const years = Array.from({ length: YEARS_PER_PAGE }, (_, i): YearPickerCell => {
        const y = first + i;
        const enabled = inRange.has(y);
        return {
            year: y,
            key: String(y),
            name: toDigits(y, script),
            label: `${toDigits(y, script)} ${cal.abbreviation[script]}`,
            otherLabel: enabled ? otherYearsLabel(cal, y, script) : '',
            isCurrent: today === y,
            isSelected: selected === y,
            isDisabled: !enabled,
        };
    });
    const all = [...inRange];
    return {
        system,
        year,
        first,
        last,
        years,
        hasPrevious: all.length > 0 && all[0]! < first,
        hasNext: all.length > 0 && all[all.length - 1]! > last,
    };
}

/** The first year on the year-picker page that holds `year`. */
export function yearPageStart(year: number): number {
    return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/**
 * The first day of a month of `system` that lies inside the supported range and `range`, as a BS
 * date: what a month picker selects. `null` when no day of the month is in range.
 */
export function firstDayOfMonth(
    system: CalendarType,
    year: number,
    month: number,
    range: DateRange = {},
): BsDate | null {
    const cal = getCalendar(system);
    if (!cal.isMonthInRange(year, month, range)) {
        return null;
    }
    return firstEnabled(cal.buildView(year, month, range).weeks.flat())?.bs ?? null;
}

/**
 * The first day of a year of `system` that lies inside the supported range and `range`, as a BS
 * date: what a year picker selects. `null` when no day of the year is in range.
 */
export function firstDayOfYear(system: CalendarType, year: number, range: DateRange = {}): BsDate | null {
    const months = getCalendar(system).monthNames('roman', year).length;
    for (let month = 1; month <= months; month++) {
        const day = firstDayOfMonth(system, year, month, range);
        if (day) return day;
    }
    return null;
}

/**
 * The BS date to select when the user picks `year` (and `month`, for the `month` level) of `system`:
 * the first day of that period inside the supported range and `range`.
 */
export function pickedDate(
    system: CalendarType,
    level: Exclude<PickLevel, 'day'>,
    year: number,
    month: number,
    range: DateRange = {},
): BsDate | null {
    return level === 'year' ? firstDayOfYear(system, year, range) : firstDayOfMonth(system, year, month, range);
}

function firstEnabled(days: readonly (MonthViewDay | null)[]): MonthViewDay | undefined {
    return days.find((d): d is MonthViewDay => d !== null && !d.isDisabled);
}

function lastDay(days: readonly (MonthViewDay | null)[]): MonthViewDay | undefined {
    for (let i = days.length - 1; i >= 0; i--) {
        const day = days[i];
        if (day) return day;
    }
    return undefined;
}

/** The months of the other calendar (AD for BS, BS for the rest) that a month spans, without years. */
function otherMonthsLabel(cal: CalendarDefinition, year: number, month: number, script: Script): string {
    const days = cal.buildView(year, month).weeks.flat();
    const first = firstEnabled(days);
    const last = lastDay(days);
    if (!first || !last) {
        return '';
    }
    const name = (day: MonthViewDay) =>
        cal.type === 'bs' ? AD_MONTH_NAMES[script][day.ad.month - 1]! : MONTH_NAMES[script][day.bs.month - 1]!;
    return name(first) === name(last) ? name(first) : `${name(first)}/${name(last)}`;
}

/** The years of the other calendar (AD for BS, BS for the rest) that a year spans. */
function otherYearsLabel(cal: CalendarDefinition, year: number, script: Script): string {
    const months = cal.monthNames(script, year).length;
    const firstMonth = cal.clampMonth(year, 1);
    const lastMonth = cal.clampMonth(year, months);
    if (firstMonth.year !== year || lastMonth.year !== year) {
        return '';
    }
    const first = firstEnabled(cal.buildView(year, firstMonth.month).weeks.flat());
    const last = lastDay(cal.buildView(year, lastMonth.month).weeks.flat());
    if (!first || !last) {
        return '';
    }
    const from = cal.type === 'bs' ? first.ad.year : first.bs.year;
    const to = cal.type === 'bs' ? last.ad.year : last.bs.year;
    return from === to ? toDigits(from, script) : `${toDigits(from, script)}/${toDigits(to, script)}`;
}
