import { describe, expect, it } from 'vitest';
import { MAX_YEAR, MIN_YEAR, buildMonthView, shiftMonth } from '../src/index.js';

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
});

describe('shiftMonth', () => {
    it('moves and clamps', () => {
        expect(shiftMonth(2081, 12, 1)).toEqual({ year: 2082, month: 1 });
        expect(shiftMonth(MIN_YEAR, 1, -1)).toEqual({ year: MIN_YEAR, month: 1 });
        expect(shiftMonth(MAX_YEAR, 12, 1)).toEqual({ year: MAX_YEAR, month: 12 });
    });
});
