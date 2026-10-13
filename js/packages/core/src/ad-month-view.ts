import { type AdDate, type BsDate, MAX_DATE, MIN_DATE, compareBs, isSameBs, toAd, toBs } from './calendar.js';
import { bsSpanLabel } from './month-grid.js';
import { type DateRange, type MonthViewDay, type MonthViewOptions, isInRange } from './month-view.js';

/** A Gregorian month laid out as weeks starting on Sunday, with the BS date of each day. */
export interface AdMonthView {
    readonly year: number;
    readonly month: number;
    /**
     * Rows of seven cells; `null` pads the days before the 1st and after the last day, and stands
     * in for days outside the supported BS range.
     */
    readonly weeks: readonly (readonly (MonthViewDay | null)[])[];
    /** The BS months the Gregorian month spans, such as `Shrawan/Bhadra 2081` or `Chaitra 2081/Baisakh 2082`. */
    readonly bsLabel: string;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

/** Builds the grid for one Gregorian month. The options are the same as for `buildMonthView`. */
export function buildAdMonthView(year: number, month: number, options: MonthViewOptions = {}): AdMonthView {
    const firstUtc = Date.UTC(year, month - 1, 1);
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const offset = new Date(firstUtc).getUTCDay();

    const cells: (MonthViewDay | null)[] = Array.from({ length: offset }, () => null);
    const days: MonthViewDay[] = [];
    for (let day = 1; day <= length; day++) {
        const ad: AdDate = { year, month, day };
        const bs = tryToBs(ad);
        if (bs === null) {
            cells.push(null);
            continue;
        }
        const cell: MonthViewDay = {
            bs,
            ad,
            dayOfWeek: (offset + day - 1) % 7,
            key: `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`,
            isToday: isSameBs(bs, options.today),
            isSelected: isSameBs(bs, options.selected),
            isDisabled: !isInRange(bs, options),
        };
        cells.push(cell);
        days.push(cell);
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weeks: (MonthViewDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    return {
        year,
        month,
        weeks,
        bsLabel: days.length ? bsSpanLabel(days[0]!.bs, days[days.length - 1]!.bs, options.script ?? 'roman') : '',
        hasPrevious: monthIndex(year, month) > lowestAdMonth(options),
        hasNext: monthIndex(year, month) < highestAdMonth(options),
    };
}

/** Moves a Gregorian year and month by `delta` months, clamped to the supported range and to `range`. */
export function shiftAdMonth(
    year: number,
    month: number,
    delta: number,
    range: DateRange = {},
): { year: number; month: number } {
    return clampAdMonth(year, month + delta, range);
}

/** Brings a Gregorian year and month inside the supported range and `range`. The month may overflow. */
export function clampAdMonth(year: number, month: number, range: DateRange = {}): { year: number; month: number } {
    const index = Math.min(Math.max(monthIndex(year, month), lowestAdMonth(range)), highestAdMonth(range));
    return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Whether any day of a Gregorian month lies inside the supported range and `range`. */
export function isAdMonthInRange(year: number, month: number, range: DateRange = {}): boolean {
    const index = monthIndex(year, month);
    return index >= lowestAdMonth(range) && index <= highestAdMonth(range);
}

/** Every Gregorian year with a day inside the supported range and `range`, in order, for a year picker. */
export function supportedAdYears(range: DateRange = {}): number[] {
    const first = Math.floor(lowestAdMonth(range) / 12);
    const last = Math.floor(highestAdMonth(range) / 12);
    return Array.from({ length: Math.max(last - first + 1, 0) }, (_, i) => first + i);
}

function tryToBs(date: AdDate): BsDate | null {
    try {
        return toBs(date);
    } catch {
        return null;
    }
}

function monthIndex(year: number, month: number): number {
    return year * 12 + month - 1;
}

function lowestAdMonth({ min }: DateRange): number {
    const ad = toAd(min && compareBs(min, MIN_DATE) > 0 ? min : MIN_DATE);
    return monthIndex(ad.year, ad.month);
}

function highestAdMonth({ max }: DateRange): number {
    const ad = toAd(max && compareBs(max, MAX_DATE) < 0 ? max : MAX_DATE);
    return monthIndex(ad.year, ad.month);
}
