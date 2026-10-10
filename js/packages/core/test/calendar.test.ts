import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    MAX_DATE,
    MAX_YEAR,
    MIN_DATE,
    MIN_YEAR,
    MONTH_LENGTHS,
    addDays,
    addMonths,
    bsDate,
    dayOfWeek,
    daysInMonth,
    isValidBsDate,
    parseBs,
    toAd,
    toBs,
    toIsoString,
    toJsDate,
} from '../src/index.js';

// The same reference dates as tests/OSN.NepaliCalendar.Tests/NepaliDateConverterTests.cs.
const referenceDates: [number, number, number, string][] = [
    [1970, 1, 1, '1913-04-13'], // Start of the supported range
    [1971, 5, 24, '1914-09-08'], // Birth of B.P. Koirala
    [1975, 6, 1, '1918-09-17'], // Ashwin 1975
    [1977, 2, 30, '1920-06-11'], // Birth of King Mahendra
    [1977, 7, 1, '1920-10-17'], // Kartik 1977
    [1990, 10, 2, '1934-01-15'], // Nepal-Bihar earthquake
    [1991, 9, 1, '1934-12-16'], // Poush 1991
    [2000, 1, 1, '1943-04-14'], // New year 2000
    [2007, 11, 7, '1951-02-18'], // Democracy Day
    [2063, 1, 11, '2006-04-24'], // Loktantra Diwas
    [2065, 2, 15, '2008-05-28'], // Republic Day
    [2072, 1, 12, '2015-04-25'], // Gorkha earthquake
    [2072, 6, 3, '2015-09-20'], // Constitution Day
    [2079, 1, 1, '2022-04-14'], // New year 2079
    [2080, 1, 1, '2023-04-14'], // New year 2080
    [2081, 1, 1, '2024-04-13'], // New year 2081
    [2081, 12, 31, '2025-04-13'], // Last day of 2081
    [2082, 1, 1, '2025-04-14'], // New year 2082
    [2082, 6, 16, '2025-10-02'], // Vijaya Dashami 2082
    [2083, 1, 1, '2026-04-14'], // New year 2083
    [2090, 12, 30, '2034-04-13'], // End of the supported range
];

function ad(iso: string) {
    const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
    return { year, month, day };
}

describe('conversion', () => {
    it.each(referenceDates)('BS %i-%i-%i is AD %s', (year, month, day, gregorian) => {
        expect(toAd({ year, month, day })).toEqual(ad(gregorian));
        expect(toBs(ad(gregorian))).toEqual({ year, month, day });
    });

    it('round-trips every day in the range, one AD day per BS day', () => {
        let bs = MIN_DATE;
        let expected = Date.UTC(1913, 3, 13);
        for (;;) {
            const converted = toAd(bs);
            expect(Date.UTC(converted.year, converted.month - 1, converted.day)).toBe(expected);
            expect(toBs(converted)).toEqual(bs);
            if (toIsoString(bs) === toIsoString(MAX_DATE)) {
                break;
            }
            bs = addDays(bs, 1);
            expected += 86_400_000;
        }
    });

    it('reads a Date in local time and ignores the time of day', () => {
        expect(toBs(new Date(2024, 3, 13, 23, 59, 59))).toEqual({ year: 2081, month: 1, day: 1 });
        expect(toJsDate({ year: 2024, month: 4, day: 13 })).toEqual(new Date(2024, 3, 13));
    });

    it.each(['1913-04-12', '2034-04-14'])('rejects AD %s outside the range', (iso) => {
        expect(() => toBs(ad(iso))).toThrow(RangeError);
    });

    it('rejects AD dates that do not exist', () => {
        expect(() => toBs({ year: 2024, month: 2, day: 30 })).toThrow(RangeError);
        expect(() => toBs(new Date(Number.NaN))).toThrow(RangeError);
    });
});

describe('validation', () => {
    it.each([
        [2081, 1, 31],
        [2081, 2, 32],
        [2081, 9, 29],
        [2081, 12, 31],
    ])('accepts BS %i-%i-%i', (year, month, day) => {
        expect(isValidBsDate(year, month, day)).toBe(true);
        expect(bsDate(year, month, day)).toEqual({ year, month, day });
    });

    it.each([
        [2081, 1, 32],
        [1969, 12, 30],
        [2091, 1, 1],
        [2081, 0, 1],
        [2081, 13, 1],
        [2081, 1, 0],
        [2081, 1, 1.5],
    ])('rejects BS %i-%i-%i', (year, month, day) => {
        expect(isValidBsDate(year, month, day)).toBe(false);
        expect(() => bsDate(year, month, day)).toThrow(RangeError);
        expect(() => toAd({ year, month, day })).toThrow(RangeError);
    });

    it('reports month lengths', () => {
        expect(daysInMonth(2081, 2)).toBe(32);
        expect(() => daysInMonth(2091, 1)).toThrow(RangeError);
        expect(() => daysInMonth(2081, 13)).toThrow(RangeError);
    });

    it('parses ISO-style BS dates', () => {
        expect(parseBs('2081-04-15')).toEqual({ year: 2081, month: 4, day: 15 });
        expect(parseBs('2081/4/5')).toEqual({ year: 2081, month: 4, day: 5 });
        expect(parseBs('2081-01-32')).toBeNull();
        expect(parseBs('hello')).toBeNull();
    });
});

describe('arithmetic', () => {
    it('gives the weekday of every day of a year, matching the Gregorian calendar', () => {
        for (let bs = bsDate(2081, 1, 1); bs.year === 2081; bs = addDays(bs, 1)) {
            expect(dayOfWeek(bs)).toBe(toJsDate(toAd(bs)).getDay());
        }
    });

    it('adds months across years and refuses to leave the range', () => {
        expect(addMonths(2081, 12, 1)).toEqual({ year: 2082, month: 1 });
        expect(addMonths(2081, 1, -1)).toEqual({ year: 2080, month: 12 });
        expect(addMonths(2081, 4, 25)).toEqual({ year: 2083, month: 5 });
        expect(() => addMonths(MIN_YEAR, 1, -1)).toThrow(RangeError);
        expect(() => addMonths(MAX_YEAR, 12, 1)).toThrow(RangeError);
    });

    it('refuses to add days past the range', () => {
        expect(() => addDays(MAX_DATE, 1)).toThrow(RangeError);
        expect(() => addDays(MIN_DATE, -1)).toThrow(RangeError);
    });
});

describe('month-length table', () => {
    it('matches the .NET library table row for row', () => {
        const source = readFileSync(
            fileURLToPath(new URL('../../../../src/OSN.NepaliCalendar/BsCalendarData.cs', import.meta.url)),
            'utf8',
        );
        const rows = [...source.matchAll(/\[([\d, ]+)\], \/\/ (\d{4})/g)].map((m) => ({
            year: Number(m[2]),
            lengths: m[1]!.split(',').map((n) => Number(n.trim())),
        }));

        expect(rows).toHaveLength(MONTH_LENGTHS.length);
        rows.forEach((row, i) => {
            expect(row.year).toBe(MIN_YEAR + i);
            expect(MONTH_LENGTHS[i]).toEqual(row.lengths);
        });
    });
});
