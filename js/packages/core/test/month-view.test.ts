import { describe, expect, it } from 'vitest';
import {
    MAX_YEAR,
    MIN_YEAR,
    buildMonthView,
    clampBs,
    clampMonth,
    isInRange,
    isMonthInRange,
    shiftMonth,
    supportedYears,
} from '../src/index.js';

const range = { min: { year: 2081, month: 4, day: 10 }, max: { year: 2082, month: 2, day: 5 } };

describe('buildMonthView', () => {
    it('lays out Shrawan 2081 starting on its weekday', () => {
        const view = buildMonthView(2081, 4, {
            today: { year: 2081, month: 4, day: 15 },
            selected: { year: 2081, month: 4, day: 20 },
        });

        // Shrawan 2081 starts on Tuesday 2024-07-16 and has 32 days.
        const cells = view.weeks.flat();
        expect(cells.slice(0, 2)).toEqual([null, null]);
        expect(cells[2]).toMatchObject({ bs: { day: 1 }, ad: { year: 2024, month: 7, day: 16 }, dayOfWeek: 2 });
        expect(cells.filter((c) => c !== null)).toHaveLength(32);
        expect(cells.length % 7).toBe(0);
        expect(view.weeks.every((w) => w.length === 7)).toBe(true);
        expect(cells.find((c) => c?.isToday)?.bs.day).toBe(15);
        expect(cells.find((c) => c?.isSelected)?.bs.day).toBe(20);
        expect(view.adLabel).toBe('Jul/Aug 2024');
    });

    it('labels months that cross a Gregorian year', () => {
        expect(buildMonthView(2081, 9).adLabel).toBe('Dec 2024/Jan 2025');
        expect(buildMonthView(2081, 9, { script: 'nepali' }).adLabel).toBe('डिसेम्बर २०२४/जनवरी २०२५');
    });

    it('knows the ends of the range', () => {
        expect(buildMonthView(MIN_YEAR, 1).hasPrevious).toBe(false);
        expect(buildMonthView(MAX_YEAR, 12).hasNext).toBe(false);
        expect(buildMonthView(2081, 1)).toMatchObject({ hasPrevious: true, hasNext: true });
    });

    it('disables days outside min and max and stops at their months', () => {
        const first = buildMonthView(2081, 4, range);
        const days = first.weeks.flat().filter((d) => d !== null);
        expect(days.filter((d) => d.isDisabled).map((d) => d.bs.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(first).toMatchObject({ hasPrevious: false, hasNext: true });

        const last = buildMonthView(2082, 2, range);
        expect(last.weeks.flat().find((d) => d?.bs.day === 5)?.isDisabled).toBe(false);
        expect(last.weeks.flat().find((d) => d?.bs.day === 6)?.isDisabled).toBe(true);
        expect(last).toMatchObject({ hasPrevious: true, hasNext: false });

        expect(
            buildMonthView(2081, 8, range)
                .weeks.flat()
                .some((d) => d?.isDisabled),
        ).toBe(false);
    });
});

describe('shiftMonth', () => {
    it('moves and clamps', () => {
        expect(shiftMonth(2081, 12, 1)).toEqual({ year: 2082, month: 1 });
        expect(shiftMonth(MIN_YEAR, 1, -1)).toEqual({ year: MIN_YEAR, month: 1 });
        expect(shiftMonth(MAX_YEAR, 12, 1)).toEqual({ year: MAX_YEAR, month: 12 });
    });

    it('stays inside min and max', () => {
        expect(shiftMonth(2081, 4, -1, range)).toEqual({ year: 2081, month: 4 });
        expect(shiftMonth(2082, 1, 12, range)).toEqual({ year: 2082, month: 2 });
        expect(shiftMonth(2081, 12, 1, range)).toEqual({ year: 2082, month: 1 });
    });
});

describe('range helpers', () => {
    it('checks and clamps dates, both ends inclusive', () => {
        expect(isInRange({ year: 2081, month: 4, day: 10 }, range)).toBe(true);
        expect(isInRange({ year: 2081, month: 4, day: 9 }, range)).toBe(false);
        expect(isInRange({ year: 2082, month: 2, day: 6 }, range)).toBe(false);
        expect(isInRange({ year: 1990, month: 1, day: 1 })).toBe(true);
        expect(clampBs({ year: 2070, month: 1, day: 1 }, range)).toEqual(range.min);
        expect(clampBs({ year: 2090, month: 1, day: 1 }, range)).toEqual(range.max);
        expect(clampBs({ year: 2081, month: 9, day: 1 }, range)).toEqual({ year: 2081, month: 9, day: 1 });
    });

    it('clamps months and lists the years in range', () => {
        expect(clampMonth(2081, 13)).toEqual({ year: 2082, month: 1 });
        expect(clampMonth(2075, 6, range)).toEqual({ year: 2081, month: 4 });
        expect(clampMonth(2085, 6, range)).toEqual({ year: 2082, month: 2 });
        expect(isMonthInRange(2081, 3, range)).toBe(false);
        expect(isMonthInRange(2082, 2, range)).toBe(true);
        expect(supportedYears(range)).toEqual([2081, 2082]);
        expect(supportedYears({ min: { year: 2085, month: 1, day: 1 } }).at(-1)).toBe(MAX_YEAR);
        expect(supportedYears()).toHaveLength(MAX_YEAR - MIN_YEAR + 1);
    });
});
