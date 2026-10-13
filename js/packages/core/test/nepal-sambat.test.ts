import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    addDays,
    bsDate,
    findNepalSambatDays,
    formatNepalSambat,
    MAX_DATE,
    MIN_DATE,
    nepalSambatYear,
    toNepalSambat,
} from '../src/index.js';
import { NS_DAY_COUNT, NS_FIRST_TITHI, NS_FIRST_YEAR, NS_MONTHS, NS_STEPS } from '../src/nepal-sambat-data.js';

describe('toNepalSambat', () => {
    // Each row is a day's tithi in Nepal's official panchang, as Hamro Patro showed it in October 2026.
    it.each([
        [2083, 6, 10, 'NS 1146 Yanla Thwa Punhi'],
        [2083, 6, 11, 'NS 1146 Yanla Ga Paru'],
        [2083, 6, 18, 'NS 1146 Yanla Ga Ashtami'],
        [2083, 6, 19, 'NS 1146 Yanla Ga Dashami'],
        [2083, 6, 24, 'NS 1146 Yanla Ga Amai'],
        [2083, 6, 25, 'NS 1146 Kaula Thwa Paru'],
        [2083, 7, 1, 'NS 1146 Kaula Thwa Ashtami'],
        [2083, 7, 2, 'NS 1146 Kaula Thwa Ashtami'],
        [2083, 7, 12, 'NS 1146 Kaula Ga Chaturthi'],
        [2083, 7, 24, 'NS 1147 Kachhala Thwa Paru'],
        [2083, 8, 4, 'NS 1147 Kachhala Thwa Ekadashi'],
        [2083, 4, 4, 'NS 1146 Dilla Thwa Shashthi'],
        [2083, 10, 14, 'NS 1147 Pohela Ga Shashthi'],
        [2079, 6, 30, 'NS 1142 Kaula Ga Shashthi'],
        [2083, 2, 10, 'NS 1146 Anala Thwa Ashtami'],
    ])('BS %i-%i-%i is %s', (year, month, day, expected) => {
        expect(formatNepalSambat(toNepalSambat(bsDate(year, month, day)))).toBe(expected);
    });

    it('describes a day fully', () => {
        expect(toNepalSambat(bsDate(2083, 7, 2))).toEqual({
            year: 1146,
            month: 12,
            isLeapMonth: false,
            paksha: 'thwa',
            tithi: 8,
            lunarDay: 8,
            isRepeatedTithi: true,
        });
        expect(toNepalSambat(bsDate(2083, 2, 10))).toMatchObject({ month: 8, isLeapMonth: true });
    });

    it('formats in Devanagari', () => {
        const ns = toNepalSambat(bsDate(2083, 7, 24));
        expect(formatNepalSambat(ns, 'G', 'nepali')).toBe('ने.सं. ११४७ कछलाथ्व पारू');
        expect(formatNepalSambat(ns, 'M', 'nepali')).toBe('कछलाथ्व पारू');
        expect(formatNepalSambat(ns, 'Y', 'nepali')).toBe('ने.सं. ११४७');
        expect(formatNepalSambat(toNepalSambat(bsDate(2083, 6, 24)), 'M', 'nepali')).toBe('ञंलागा आमै');
        expect(() => formatNepalSambat(ns, 'd')).toThrow();
    });

    it('rejects dates outside the range', () => {
        expect(() => toNepalSambat({ year: 2091, month: 1, day: 1 })).toThrow(RangeError);
    });
});

describe('nepalSambatYear', () => {
    it('turns over on Kachhala Thwa Paru', () => {
        expect(nepalSambatYear(bsDate(2083, 7, 23))).toBe(1146);
        expect(nepalSambatYear(bsDate(2083, 7, 24))).toBe(1147);
        expect(nepalSambatYear(bsDate(2082, 7, 5))).toBe(1146);
        expect(nepalSambatYear(MIN_DATE)).toBe(1033);
    });
});

describe('findNepalSambatDays', () => {
    it('finds repeated, skipped and leap-month tithis', () => {
        expect(findNepalSambatDays(1146, 12, 'thwa', 8)).toEqual([bsDate(2083, 7, 1), bsDate(2083, 7, 2)]);
        expect(findNepalSambatDays(1146, 11, 'ga', 9)).toEqual([]);
        expect(findNepalSambatDays(1147, 1, 'thwa', 1)).toEqual([bsDate(2083, 7, 24)]);
        expect(findNepalSambatDays(1146, 8, 'thwa', 8, true)).toEqual([bsDate(2083, 2, 10)]);
    });

    it('validates its arguments', () => {
        expect(() => findNepalSambatDays(1147, 13, 'thwa', 1)).toThrow(RangeError);
        expect(() => findNepalSambatDays(1147, 1, 'thwa', 16)).toThrow(RangeError);
    });

    it('round-trips every day in the range', () => {
        let date = MIN_DATE;
        let previous = toNepalSambat(date);
        for (let i = 1; i < NS_DAY_COUNT; i++) {
            date = addDays(date, 1);
            const ns = toNepalSambat(date);
            const step = (ns.lunarDay - previous.lunarDay + 30) % 30;
            expect(step).toBeLessThanOrEqual(2);
            expect(ns.isRepeatedTithi).toBe(step === 0);
            if (i % 97 === 0) {
                expect(findNepalSambatDays(ns.year, ns.month, ns.paksha, ns.tithi, ns.isLeapMonth)).toContainEqual(
                    date,
                );
            }
            previous = ns;
        }
        expect(date).toEqual(MAX_DATE);
    });
});

describe('Nepal Sambat table', () => {
    it('matches the .NET library table', () => {
        const source = readFileSync(
            fileURLToPath(new URL('../../../../src/OSN.NepaliCalendar/NepalSambatData.cs', import.meta.url)),
            'utf8',
        );
        const constant = (name: string) => source.match(new RegExp(`${name} = (\\d+);`))![1];
        const text = (name: string) =>
            [
                ...source
                    .split(`${name} =`)[1]!
                    .split(';')[0]!
                    .matchAll(/"([^"]*)"/g),
            ]
                .map((m) => m[1])
                .join('');

        expect(Number(constant('DayCount'))).toBe(NS_DAY_COUNT);
        expect(Number(constant('FirstTithi'))).toBe(NS_FIRST_TITHI);
        expect(Number(constant('FirstYear'))).toBe(NS_FIRST_YEAR);
        expect(text('Steps')).toBe(NS_STEPS);
        expect(text('Months')).toBe(NS_MONTHS);
    });
});
