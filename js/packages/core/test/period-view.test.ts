import { describe, expect, it } from 'vitest';
import {
    CALENDAR_TYPES,
    PICK_LEVELS,
    YEARS_PER_PAGE,
    buildMonthPicker,
    buildYearPicker,
    firstDayOfMonth,
    firstDayOfYear,
    getCalendar,
    pickedDate,
    yearPageStart,
} from '../src/index.js';

const shrawan15 = { year: 2081, month: 4, day: 15 };

describe('month picker', () => {
    it('lists the months of a BS year with the AD months they span', () => {
        const view = buildMonthPicker('bs', 2081, { selected: shrawan15, today: { year: 2081, month: 9, day: 1 } });
        expect(view.months).toHaveLength(12);
        expect(view.months[3]).toMatchObject({
            year: 2081,
            month: 4,
            key: '2081-04',
            name: 'Shrawan',
            label: 'Shrawan 2081',
            otherLabel: 'Jul/Aug',
            isSelected: true,
            isCurrent: false,
            isDisabled: false,
        });
        expect(view.months[8]!.isCurrent).toBe(true);
        expect(view.otherLabel).toBe('2024/2025');
        expect(view.hasPrevious).toBe(true);
        expect(view.hasNext).toBe(true);
    });

    it('marks the selected month in AD and Nepal Sambat by their own months', () => {
        expect(buildMonthPicker('ad', 2024, { selected: shrawan15 }).months.find((m) => m.isSelected)?.name).toBe(
            'July',
        );
        const ns = buildMonthPicker('ns', 1144, { selected: shrawan15 });
        expect(ns.months.find((m) => m.isSelected)?.name).toBe('Dilla');
        expect(ns.otherLabel).toBe('2080/2081');
    });

    it('disables months outside min and max and stops at the ends of the range', () => {
        const range = { min: { year: 2081, month: 3, day: 10 }, max: { year: 2081, month: 10, day: 5 } };
        const view = buildMonthPicker('bs', 2081, { ...range, script: 'nepali' });
        expect(view.months.filter((m) => !m.isDisabled).map((m) => m.month)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
        expect(view.months[0]!.name).toBe('बैशाख');
        expect(view.hasPrevious).toBe(false);
        expect(view.hasNext).toBe(false);
    });
});

describe('year picker', () => {
    it('pages years in fixed blocks', () => {
        expect(yearPageStart(2081)).toBe(2076);
        expect(yearPageStart(2076)).toBe(2076);
        expect(yearPageStart(2075)).toBe(2064);
        const view = buildYearPicker('bs', 2081, { selected: shrawan15, today: { year: 2082, month: 1, day: 1 } });
        expect(view.first).toBe(2076);
        expect(view.last).toBe(2076 + YEARS_PER_PAGE - 1);
        expect(view.years.map((y) => y.year)).toEqual(Array.from({ length: 12 }, (_, i) => 2076 + i));
        expect(view.years.find((y) => y.isSelected)?.year).toBe(2081);
        expect(view.years.find((y) => y.isCurrent)?.year).toBe(2082);
        expect(view.years[5]).toMatchObject({ key: '2081', name: '2081', label: '2081 BS', otherLabel: '2024/2025' });
    });

    it('disables years outside the supported range and min/max', () => {
        const first = getCalendar('bs').years()[0]!;
        const view = buildYearPicker('bs', first);
        expect(view.hasPrevious).toBe(false);
        expect(view.years.filter((y) => y.isDisabled).every((y) => y.year < first && y.otherLabel === '')).toBe(true);
        const ranged = buildYearPicker('ad', 2024, { min: shrawan15, max: { year: 2083, month: 1, day: 1 } });
        expect(ranged.years.filter((y) => !y.isDisabled).map((y) => y.year)).toEqual([2024, 2025, 2026]);
        expect(ranged.hasPrevious).toBe(false);
        expect(ranged.hasNext).toBe(false);
    });

    it('uses Devanagari digits and abbreviations in the Nepali script', () => {
        const view = buildYearPicker('ns', 1145, { script: 'nepali' });
        expect(view.years.find((y) => y.year === 1145)?.name).toBe('११४५');
    });
});

describe('picked dates', () => {
    it('has the three levels', () => {
        expect(PICK_LEVELS).toEqual(['day', 'month', 'year']);
    });

    it('is the first day of the month or year in every calendar', () => {
        expect(firstDayOfMonth('bs', 2081, 4)).toEqual({ year: 2081, month: 4, day: 1 });
        expect(firstDayOfYear('bs', 2081)).toEqual({ year: 2081, month: 1, day: 1 });
        // 1 July 2024 and 1 January 2024.
        expect(firstDayOfMonth('ad', 2024, 7)).toEqual({ year: 2081, month: 3, day: 17 });
        expect(firstDayOfYear('ad', 2024)).toEqual({ year: 2080, month: 9, day: 16 });
        for (const type of CALENDAR_TYPES) {
            const cal = getCalendar(type);
            const { year, month } = cal.monthOf(shrawan15);
            expect(cal.monthOf(firstDayOfMonth(type, year, month)!)).toEqual({ year, month });
            expect(cal.monthOf(firstDayOfYear(type, year)!)).toEqual({ year, month: 1 });
        }
    });

    it('starts at min when the period begins before it, and is null outside the range', () => {
        const range = { min: { year: 2081, month: 2, day: 10 } };
        expect(firstDayOfMonth('bs', 2081, 2, range)).toEqual(range.min);
        expect(firstDayOfYear('bs', 2081, range)).toEqual(range.min);
        expect(firstDayOfMonth('bs', 2081, 1, range)).toBeNull();
        expect(firstDayOfYear('bs', 2080, range)).toBeNull();
        expect(pickedDate('bs', 'year', 2082, 1, range)).toEqual({ year: 2082, month: 1, day: 1 });
        expect(pickedDate('bs', 'month', 2082, 5, range)).toEqual({ year: 2082, month: 5, day: 1 });
    });

    it('starts the first supported year at the first supported day', () => {
        for (const type of CALENDAR_TYPES) {
            const first = getCalendar(type).years()[0]!;
            expect(firstDayOfYear(type, first)).toEqual({ year: 1970, month: 1, day: 1 });
        }
    });
});
