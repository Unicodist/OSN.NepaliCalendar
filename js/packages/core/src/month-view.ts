import {
    type AdDate,
    type BsDate,
    MAX_YEAR,
    MIN_YEAR,
    addMonths,
    daysInMonth,
    dayOfWeek,
    isSameBs,
    toAd,
} from './calendar.js';
import { AD_MONTH_NAMES, type Script, toDigits } from './names.js';

/** One day in a {@link MonthView}. */
export interface MonthViewDay {
    readonly bs: BsDate;
    readonly ad: AdDate;
    /** 0 (Sunday) to 6 (Saturday). */
    readonly dayOfWeek: number;
    /** `yyyy-MM-dd` of the BS date, handy as a key. */
    readonly key: string;
    readonly isToday: boolean;
    readonly isSelected: boolean;
}

/** A BS month laid out as weeks starting on Sunday, ready to render as a grid. */
export interface MonthView {
    readonly year: number;
    readonly month: number;
    /** Rows of seven cells; `null` pads the days before the 1st and after the last day. */
    readonly weeks: readonly (readonly (MonthViewDay | null)[])[];
    /** The Gregorian months the BS month spans, such as `Jul/Aug 2024` or `Dec 2024/Jan 2025`. */
    readonly adLabel: string;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
}

export interface MonthViewOptions {
    readonly today?: BsDate | null;
    readonly selected?: BsDate | null;
    readonly script?: Script;
}

/** Builds the grid for one BS month. */
export function buildMonthView(year: number, month: number, options: MonthViewOptions = {}): MonthView {
    const length = daysInMonth(year, month);
    const first: BsDate = { year, month, day: 1 };
    const firstAd = toAd(first);
    const lastAd = toAd({ year, month, day: length });
    const offset = dayOfWeek(first);

    const cells: (MonthViewDay | null)[] = Array.from({ length: offset }, () => null);
    const firstAdUtc = Date.UTC(firstAd.year, firstAd.month - 1, firstAd.day);
    for (let day = 1; day <= length; day++) {
        const bs: BsDate = { year, month, day };
        const adUtc = new Date(firstAdUtc + (day - 1) * 86_400_000);
        cells.push({
            bs,
            ad: { year: adUtc.getUTCFullYear(), month: adUtc.getUTCMonth() + 1, day: adUtc.getUTCDate() },
            dayOfWeek: (offset + day - 1) % 7,
            key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            isToday: isSameBs(bs, options.today),
            isSelected: isSameBs(bs, options.selected),
        });
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
        adLabel: adSpanLabel(firstAd, lastAd, options.script ?? 'roman'),
        hasPrevious: year > MIN_YEAR || month > 1,
        hasNext: year < MAX_YEAR || month < 12,
    };
}

function adSpanLabel(first: AdDate, last: AdDate, script: Script): string {
    const names = AD_MONTH_NAMES[script];
    const firstMonth = names[first.month - 1]!;
    const lastMonth = names[last.month - 1]!;
    const firstYear = toDigits(first.year, script);
    const lastYear = toDigits(last.year, script);
    if (first.year !== last.year) {
        return `${firstMonth} ${firstYear}/${lastMonth} ${lastYear}`;
    }
    return first.month === last.month ? `${firstMonth} ${firstYear}` : `${firstMonth}/${lastMonth} ${firstYear}`;
}

/** Moves a year and month by `delta` months, clamped to the supported range. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
    try {
        return addMonths(year, month, delta);
    } catch {
        return delta < 0 ? { year: MIN_YEAR, month: 1 } : { year: MAX_YEAR, month: 12 };
    }
}

/** Every supported BS year, in order, for a year picker. */
export function supportedYears(): number[] {
    return Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
}
