import { describe, expect, it } from 'vitest';
import {
    BIKRAM_SAMBAT,
    CALENDARS,
    CALENDAR_TYPES,
    GREGORIAN,
    MAX_DATE,
    MIN_DATE,
    NEPAL_SAMBAT,
    type CalendarType,
    type MonthViewDay,
    buildCalendarView,
    calendarMonthNames,
    convertMonth,
    getCalendar,
    monthOf,
    nepalSambatMonthName,
    nepalSambatMonths,
} from '../src/index.js';

const days = (weeks: readonly (readonly (MonthViewDay | null)[])[]) =>
    weeks.flat().filter((d): d is MonthViewDay => d !== null);

describe('calendar definitions', () => {
    it('has one definition per type', () => {
        expect(CALENDAR_TYPES).toEqual(['bs', 'ad', 'ns']);
        for (const type of CALENDAR_TYPES) {
            expect(getCalendar(type).type).toBe(type);
            expect(CALENDARS[type]).toBe(getCalendar(type));
        }
        expect(getCalendar('bs')).toBe(BIKRAM_SAMBAT);
        expect(getCalendar('ad')).toBe(GREGORIAN);
        expect(getCalendar('ns')).toBe(NEPAL_SAMBAT);
        expect(() => getCalendar('xx' as CalendarType)).toThrow(RangeError);
    });

    it('names each calendar in both scripts', () => {
        expect(CALENDAR_TYPES.map((t) => CALENDARS[t].name.roman)).toEqual([
            'Bikram Sambat',
            'Gregorian',
            'Nepal Sambat',
        ]);
        expect(CALENDAR_TYPES.map((t) => CALENDARS[t].abbreviation.nepali)).toEqual(['वि.सं.', 'ई.सं.', 'ने.सं.']);
    });

    it('agrees with the BS and AD month views', () => {
        const date = { year: 2081, month: 4, day: 20 };
        expect(BIKRAM_SAMBAT.monthOf(date)).toEqual({ year: 2081, month: 4 });
        expect(GREGORIAN.monthOf(date)).toEqual({ year: 2024, month: 8 });
        expect(BIKRAM_SAMBAT.shiftMonth(2081, 12, 1)).toEqual({ year: 2082, month: 1 });
        expect(GREGORIAN.shiftMonth(2024, 1, -1)).toEqual({ year: 2023, month: 12 });
        const day = days(GREGORIAN.buildView(2024, 7).weeks).find((d) => d.ad.day === 30)!;
        expect(GREGORIAN.dayNumber(day)).toBe(30);
        expect(GREGORIAN.otherDayNumber(day)).toBe(15);
        expect(BIKRAM_SAMBAT.dayNumber(day)).toBe(15);
        expect(BIKRAM_SAMBAT.otherDayNumber(day)).toBe(30);
    });
});

describe('Nepal Sambat calendar', () => {
    it('lists the months of a year, with the leap month in its place', () => {
        // NS 1146 has a leap Tachhala (Anala) before Tachhala.
        const months = nepalSambatMonths(1146);
        expect(months).toHaveLength(13);
        expect(months[7]).toMatchObject({ month: 8, isLeapMonth: true, first: { year: 2083, month: 2, day: 3 } });
        expect(months[8]).toMatchObject({ month: 8, isLeapMonth: false });
        expect(NEPAL_SAMBAT.monthNames('roman', 1146).slice(6, 9)).toEqual(['Bachhala', 'Anala', 'Tachhala']);
        expect(NEPAL_SAMBAT.monthNames('nepali', 1147)).toHaveLength(12);
        expect(calendarMonthNames('ns', 'nepali')[0]).toBe('कछला');
        expect(nepalSambatMonths(1000)).toEqual([]);
        expect(nepalSambatMonthName(1, true, 'nepali')).toBe('अनला');
    });

    it('starts the year at Kachhala Thwa Paru', () => {
        const kachhala = { year: 2083, month: 7, day: 24 };
        expect(NEPAL_SAMBAT.monthOf(kachhala)).toEqual({ year: 1147, month: 1 });
        expect(NEPAL_SAMBAT.monthOf({ year: 2083, month: 7, day: 23 })).toEqual({ year: 1146, month: 13 });
        expect(monthOf(kachhala, 'ns')).toEqual({ year: 1147, month: 1 });
    });

    it('lays out a lunar month with its tithis', () => {
        const view = buildCalendarView('ns', 1147, 1, { selected: { year: 2083, month: 7, day: 24 } });
        expect(view).toMatchObject({ system: 'ns', year: 1147, month: 1, otherLabel: 'Kartik/Mangsir 2083' });
        const shown = days(view.weeks);
        expect(shown[0]).toMatchObject({ bs: { year: 2083, month: 7, day: 24 }, dayOfWeek: 2, isSelected: true });
        expect(shown.map((d) => NEPAL_SAMBAT.dayNumber(d)).join(' ')).toBe(
            '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 1 2 3 4 5 6 8 9 10 11 12 13 14 15',
        );
        expect(NEPAL_SAMBAT.otherDayNumber(shown[0]!)).toBe(24);
        expect(NEPAL_SAMBAT.dayLabel(shown[0]!)).toBe('Mangalbar, NS 1147 Kachhala Thwa Paru');
        expect(NEPAL_SAMBAT.dayLabel(shown[0]!, 'nepali')).toBe('मङ्गलबार, ने.सं. ११४७ कछलाथ्व पारू');
        expect(view.weeks.flat().length % 7).toBe(0);
    });

    it('moves across years and leap months', () => {
        expect(NEPAL_SAMBAT.shiftMonth(1146, 13, 1)).toEqual({ year: 1147, month: 1 });
        expect(NEPAL_SAMBAT.shiftMonth(1147, 1, -1)).toEqual({ year: 1146, month: 13 });
        expect(NEPAL_SAMBAT.shiftMonth(1146, 7, 1)).toEqual({ year: 1146, month: 8 });
        // NS 1148 also has a leap month, so 25 months on is the first month of 1149.
        expect(nepalSambatMonths(1148)).toHaveLength(13);
        expect(NEPAL_SAMBAT.shiftMonth(1147, 1, 25)).toEqual({ year: 1149, month: 1 });
    });

    it('keeps to the supported range and to min and max', () => {
        expect(NEPAL_SAMBAT.monthOf(MIN_DATE)).toEqual({ year: 1033, month: 1 });
        expect(NEPAL_SAMBAT.monthOf(MAX_DATE)).toEqual({ year: 1154, month: 6 });
        expect(NEPAL_SAMBAT.shiftMonth(1033, 1, -1)).toEqual({ year: 1033, month: 1 });
        expect(NEPAL_SAMBAT.clampMonth(1200, 1)).toEqual({ year: 1154, month: 6 });
        expect(NEPAL_SAMBAT.clampMonth(1147, 14)).toEqual({ year: 1147, month: 12 });

        const range = { min: { year: 2083, month: 7, day: 30 }, max: { year: 2083, month: 9, day: 1 } };
        expect(NEPAL_SAMBAT.years(range)).toEqual([1147]);
        expect(NEPAL_SAMBAT.isMonthInRange(1147, 1, range)).toBe(true);
        expect(NEPAL_SAMBAT.isMonthInRange(1147, 3, range)).toBe(false);
        expect(NEPAL_SAMBAT.isMonthInRange(1146, 13, range)).toBe(false);
        expect(NEPAL_SAMBAT.clampMonth(1146, 5, range)).toEqual({ year: 1147, month: 1 });
        const view = NEPAL_SAMBAT.buildView(1147, 1, range);
        expect(view.hasPrevious).toBe(false);
        expect(view.hasNext).toBe(true);
        expect(days(view.weeks).find((d) => d.bs.day === 29)?.isDisabled).toBe(true);
    });

    it('converts the shown month to and from the other calendars', () => {
        expect(convertMonth(2083, 7, 'bs', 'ns')).toEqual({ year: 1146, month: 13 });
        expect(convertMonth(2083, 7, 'bs', 'ns', { year: 2083, month: 7, day: 25 })).toEqual({ year: 1147, month: 1 });
        expect(convertMonth(1147, 1, 'ns', 'bs')).toEqual({ year: 2083, month: 8 });
        expect(convertMonth(1147, 1, 'ns', 'ad')).toEqual({ year: 2026, month: 11 });
        expect(convertMonth(2026, 11, 'ad', 'ns')).toEqual({ year: 1147, month: 1 });
    });
});
