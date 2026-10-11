import { describe, expect, it } from 'vitest';
import {
    MAX_DATE,
    buildAdMonthView,
    buildCalendarView,
    calendarMonthNames,
    calendarYears,
    clampCalendarMonth,
    dayLabel,
    isCalendarMonthInRange,
    clampAdMonth,
    isAdMonthInRange,
    convertMonth,
    monthOf,
    shiftAdMonth,
    supportedAdYears,
    toAd,
} from '../src/index.js';

describe('buildAdMonthView', () => {
    it('lays out July 2024 with the BS date of each day', () => {
        const view = buildAdMonthView(2024, 7, {
            today: { year: 2081, month: 4, day: 15 },
            selected: { year: 2081, month: 3, day: 31 },
        });

        // 1 July 2024 was a Monday and BS 2081-03-17.
        const cells = view.weeks.flat();
        expect(cells[0]).toBeNull();
        expect(cells[1]).toMatchObject({
            ad: { year: 2024, month: 7, day: 1 },
            bs: { year: 2081, month: 3, day: 17 },
            dayOfWeek: 1,
            key: '2081-03-17',
        });
        expect(cells.filter((c) => c !== null)).toHaveLength(31);
        expect(cells.length % 7).toBe(0);
        expect(cells.find((c) => c?.isToday)?.ad.day).toBe(30);
        expect(cells.find((c) => c?.isSelected)?.ad.day).toBe(15);
        expect(view.bsLabel).toBe('Ashadh/Shrawan 2081');
        expect(buildAdMonthView(2024, 7, { script: 'nepali' }).bsLabel).toBe('असार/साउन २०८१');
    });

    it('labels months that cross a BS year', () => {
        expect(buildAdMonthView(2025, 4).bsLabel).toBe('Chaitra 2081/Baisakh 2082');
    });

    it('disables days outside min and max and stops at their months', () => {
        const range = { min: { year: 2081, month: 4, day: 1 }, max: { year: 2081, month: 4, day: 32 } };
        // Shrawan 2081 is 16 July to 16 August 2024.
        const july = buildAdMonthView(2024, 7, range);
        const enabled = july.weeks.flat().filter((d) => d && !d.isDisabled);
        expect(enabled.map((d) => d!.ad.day)).toEqual(Array.from({ length: 16 }, (_, i) => 16 + i));
        expect(july).toMatchObject({ hasPrevious: false, hasNext: true });
        expect(buildAdMonthView(2024, 8, range)).toMatchObject({ hasPrevious: true, hasNext: false });
    });

    it('leaves days outside the supported range empty', () => {
        // BS 1970-01-01 is 13 April 1913.
        const first = buildAdMonthView(1913, 4);
        expect(first.weeks.flat().filter((c) => c !== null)).toHaveLength(18);
        expect(first.hasPrevious).toBe(false);
        const last = toAd(MAX_DATE);
        expect(buildAdMonthView(last.year, last.month).hasNext).toBe(false);
    });
});

describe('AD month helpers', () => {
    const range = { min: { year: 2081, month: 4, day: 1 }, max: { year: 2082, month: 1, day: 5 } };

    it('moves, clamps and checks months against the range', () => {
        expect(shiftAdMonth(2024, 12, 1)).toEqual({ year: 2025, month: 1 });
        expect(shiftAdMonth(2024, 7, -1, range)).toEqual({ year: 2024, month: 7 });
        expect(clampAdMonth(2030, 1, range)).toEqual({ year: 2025, month: 4 });
        expect(isAdMonthInRange(2024, 6, range)).toBe(false);
        expect(isAdMonthInRange(2025, 4, range)).toBe(true);
        expect(supportedAdYears(range)).toEqual([2024, 2025]);
        expect(supportedAdYears()[0]).toBe(1913);
    });

    it('finds the month of a date in either system', () => {
        const date = { year: 2081, month: 4, day: 20 };
        expect(monthOf(date, 'bs')).toEqual({ year: 2081, month: 4 });
        expect(monthOf(date, 'ad')).toEqual({ year: 2024, month: 8 });
    });

    it('converts the shown month between systems', () => {
        expect(convertMonth(2081, 4, 'bs', 'ad')).toEqual({ year: 2024, month: 7 });
        expect(convertMonth(2081, 4, 'bs', 'ad', { year: 2081, month: 4, day: 20 })).toEqual({ year: 2024, month: 8 });
        expect(convertMonth(2024, 7, 'ad', 'bs')).toEqual({ year: 2081, month: 3 });
        expect(convertMonth(2024, 7, 'ad', 'bs', { year: 2081, month: 4, day: 1 })).toEqual({ year: 2081, month: 4 });
        expect(convertMonth(1913, 1, 'ad', 'bs')).toEqual({ year: 1970, month: 1 });
        expect(convertMonth(2081, 4, 'bs', 'bs')).toEqual({ year: 2081, month: 4 });
    });
});

describe('calendar views', () => {
    it('builds either system in one shape', () => {
        const bs = buildCalendarView('bs', 2081, 4);
        expect(bs).toMatchObject({ system: 'bs', year: 2081, month: 4, otherLabel: 'Jul/Aug 2024' });
        const ad = buildCalendarView('ad', 2024, 7, { script: 'nepali' });
        expect(ad).toMatchObject({ system: 'ad', year: 2024, month: 7, otherLabel: 'असार/साउन २०८१' });
        expect(calendarMonthNames('ad')[6]).toBe('July');
        expect(calendarMonthNames('bs', 'nepali')[3]).toBe('साउन');
        expect(calendarYears('ad', { max: { year: 1971, month: 1, day: 1 } })).toEqual([1913, 1914]);
        expect(clampCalendarMonth('ad', 2024, 13)).toEqual({ year: 2025, month: 1 });
        expect(isCalendarMonthInRange('bs', 2081, 4)).toBe(true);
    });

    it('names days for screen readers', () => {
        const day = buildCalendarView('ad', 2024, 7)
            .weeks.flat()
            .find((d) => d?.ad.day === 30)!;
        expect(dayLabel(day, 'bs')).toBe('Mangalbar, 15 Shrawan 2081');
        expect(dayLabel(day, 'ad')).toBe('Mangalbar, 30 July 2024');
        expect(dayLabel(day, 'ad', 'nepali')).toBe('मङ्गलबार, ३० जुलाई २०२४');
    });
});
