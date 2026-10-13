// Helpers shared by the month views. Not exported from the package.
import { type AdDate, type BsDate, dayOfWeek, isSameBs, toAd } from './calendar.js';
import { type MonthViewDay, type MonthViewOptions, isInRange } from './month-view.js';
import { MONTH_NAMES, type Script, toDigits } from './names.js';

/** Lays out consecutive BS days as weeks starting on Sunday, padding with `null`. */
export function layoutWeeks(days: readonly BsDate[], options: MonthViewOptions): (MonthViewDay | null)[][] {
    const offset = days.length ? dayOfWeek(days[0]!) : 0;
    const cells: (MonthViewDay | null)[] = Array.from({ length: offset }, () => null);
    days.forEach((bs, i) => {
        cells.push({
            bs,
            ad: toAd(bs),
            dayOfWeek: (offset + i) % 7,
            key: bsKey(bs),
            isToday: isSameBs(bs, options.today),
            isSelected: isSameBs(bs, options.selected),
            isDisabled: !isInRange(bs, options),
        });
    });
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    const weeks: (MonthViewDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
}

/** `yyyy-MM-dd` of a BS date. */
export function bsKey(bs: BsDate): string {
    return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`;
}

/** The BS months a span of days covers, such as `Shrawan/Bhadra 2081` or `Chaitra 2081/Baisakh 2082`. */
export function bsSpanLabel(first: BsDate, last: BsDate, script: Script): string {
    return spanLabel(first, last, MONTH_NAMES[script], script);
}

/** The months a span of AD days covers, with `names` for the month names. */
function spanLabel(first: BsDate | AdDate, last: BsDate | AdDate, names: readonly string[], script: Script): string {
    const firstMonth = names[first.month - 1]!;
    const lastMonth = names[last.month - 1]!;
    const firstYear = toDigits(first.year, script);
    const lastYear = toDigits(last.year, script);
    if (first.year !== last.year) {
        return `${firstMonth} ${firstYear}/${lastMonth} ${lastYear}`;
    }
    return first.month === last.month ? `${firstMonth} ${firstYear}` : `${firstMonth}/${lastMonth} ${firstYear}`;
}
