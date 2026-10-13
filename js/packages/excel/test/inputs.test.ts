import { describe, expect, it } from 'vitest';
import { adToSerial, readAdDate, readBsDate } from '../src/functions.js';
import { findMonth, parseDateText } from '../src/parse.js';

const DASHAIN_AD = { year: 2025, month: 10, day: 2 };
const DASHAIN_BS = { year: 2082, month: 6, day: 16 };

describe('AD dates', () => {
    it.each([
        ['an Excel date', adToSerial(DASHAIN_AD)],
        ['an Excel date with a time', adToSerial(DASHAIN_AD) + 0.6],
        ['a serial written as text', String(adToSerial(DASHAIN_AD))],
        ['yyyymmdd as a number', 20251002],
        ['yyyymmdd as text', '20251002'],
        ['ISO', '2025-10-02'],
        ['ISO with a time', '2025-10-02T10:30:00Z'],
        ['ISO with an offset', '2025-10-02T10:30:00+05:45'],
        ['a date and a time', '2025-10-02 14:30'],
        ['a date and a 12-hour time', '2025/10/02 2:30 PM'],
        ['slashes', '2025/10/2'],
        ['dots', '2025.10.02'],
        ['spaces', '2025 10 02'],
        ['month name', '2 Oct 2025'],
        ['month name first', 'October 2, 2025'],
        ['ordinal', 'October 2nd, 2025'],
        ['dashes and a month', '02-Oct-2025'],
        ['weekday', 'Thursday, 2 October 2025'],
        ['AD suffix', '2 Oct 2025 AD'],
        ['Nepali month name', '२ अक्टोबर २०२५'],
        ['Devanagari digits', '२०२५-१०-०२'],
        ['non-breaking spaces', '2 Oct 2025'],
        ['year first with a name', '2025 Oct 02'],
    ])('reads %s', (_, value) => {
        expect(readAdDate(value)).toEqual(DASHAIN_AD);
    });

    it('reads day-first and month-first when one part is over 12', () => {
        expect(readAdDate('25/12/2025')).toEqual({ year: 2025, month: 12, day: 25 });
        expect(readAdDate('12/25/2025')).toEqual({ year: 2025, month: 12, day: 25 });
        expect(readAdDate('05/05/2025')).toEqual({ year: 2025, month: 5, day: 5 });
    });

    it('explains what is wrong', () => {
        expect(() => readAdDate('02/10/2025')).toThrow('could be day/month or month/day');
        expect(() => readAdDate('2025-02-30')).toThrow('2025-2-30 is not a date.');
        expect(() => readAdDate(true)).toThrow('Expected a date, not TRUE.');
        expect(() => readAdDate(-5)).toThrow('-5 is not an Excel date.');
        expect(() => readAdDate('2 Smarch 2025')).toThrow('"Smarch" is not an AD month name.');
        expect(() => readAdDate('2/10/25')).toThrow('Write the year with four digits.');
        expect(() => readAdDate('')).toThrow('The date is empty.');
    });
});

describe('BS dates', () => {
    it.each([
        ['ISO', '2082-06-16'],
        ['slashes', '2082/6/16'],
        ['day first with a clear day', '16/06/2082'],
        ['dots', '16.06.2082'],
        ['yyyymmdd', '20820616'],
        ['yyyymmdd as a number', 20820616],
        ['typed text Excel turned into a date', adToSerial({ year: 2082, month: 6, day: 16 })],
        ['the D format', '16 Ashwin 2082'],
        ['the F format', 'Bihibar, 16 Ashwin 2082'],
        ['Nepali D format', '१६ असोज २०८२'],
        ['Nepali F format', 'बिहीबार, १६ असोज २०८२'],
        ['another spelling', '16 Asoj 2082'],
        ['month first', 'Ashwin 16, 2082'],
        ['year first with a name', '2082 Ashwin 16'],
        ['BS suffix', '16 Ashwin 2082 BS'],
        ['B.S. suffix', '16 Ashwin 2082 B.S.'],
        ['वि.सं. and गते', 'वि.सं. २०८२ असोज १६ गते'],
        ['साल', '२०८२ साल असोज १६ गते'],
        ['abbreviation', '16 Ashw 2082'],
        ['upper case', '16 ASHWIN 2082'],
    ])('reads %s', (_, value) => {
        expect(readBsDate(value)).toEqual(DASHAIN_BS);
    });

    it('reads 32-day months that Excel keeps as text', () => {
        expect(readBsDate('2081-02-32')).toEqual({ year: 2081, month: 2, day: 32 });
        expect(readBsDate('32 Jestha 2081')).toEqual({ year: 2081, month: 2, day: 32 });
    });

    it('explains what is wrong', () => {
        expect(() => readBsDate('2082-06-32')).toThrow('2082-6-32 is not a BS date');
        expect(() => readBsDate('16 Ash 2082')).toThrow('"Ash" is not a BS month name.');
        expect(() => readBsDate('05/06/2082')).toThrow('Write it year first, like 2082-06-05.');
        expect(() => readBsDate('16 Ashwin Kartik 2082')).toThrow('more than one month');
    });
});

describe('findMonth', () => {
    it('knows the common spellings of BS months', () => {
        const spellings: [string, number][] = [
            ['Baishakh', 1],
            ['Jeth', 2],
            ['Asar', 3],
            ['Saun', 4],
            ['Bhadau', 5],
            ['Asoj', 6],
            ['Kattik', 7],
            ['Mangsir', 8],
            ['Push', 9],
            ['Magh', 10],
            ['Phalgun', 11],
            ['Chait', 12],
            ['श्रावण', 4],
            ['कार्तिक', 7],
        ];
        for (const [word, month] of spellings) {
            expect([word, findMonth(word, 'bs')]).toEqual([word, month]);
        }
    });

    it('keeps AD and BS names apart', () => {
        expect(findMonth('Oct', 'ad')).toBe(10);
        expect(findMonth('Oct', 'bs')).toBeNull();
        expect(findMonth('Sept', 'ad')).toBe(9);
    });
});

describe('parseDateText', () => {
    it('reports ambiguity instead of guessing', () => {
        expect(parseDateText('03/04/2025', 'ad')).toEqual({
            ok: false,
            reason: '03/04/2025 could be day/month or month/day. Write it year first, like 2025-04-03.',
        });
    });
});
