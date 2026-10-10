import { describe, expect, it } from 'vitest';
import { formatBs, monthName, toDigits } from '../src/index.js';

// Cases from tests/OSN.NepaliCalendar.Tests/NepaliDateFormattingTests.cs.
const date = { year: 2081, month: 4, day: 15 };

describe('formatBs', () => {
    it.each([
        ['d', '2081-04-15'],
        ['D', '15 Shrawan 2081'],
        ['F', 'Mangalbar, 15 Shrawan 2081'],
        ['M', '15 Shrawan'],
        ['Y', 'Shrawan 2081'],
        ['yyyy/MM/dd', '2081/04/15'],
        ['yy-M-d', '81-4-15'],
        ['dddd', 'Mangalbar'],
        ['ddd d MMMM', 'Mangal 15 Shrawan'],
        ['%d', '15'],
        ["'Year' yyyy", 'Year 2081'],
        ['"day" d', 'day 15'],
        ['\\d\\a\\y d', 'day 15'],
    ])('formats %s in Roman as %s', (format, expected) => {
        expect(formatBs(date, format)).toBe(expected);
    });

    it.each([
        ['d', '२०८१-०४-१५'],
        ['D', '१५ साउन २०८१'],
        ['F', 'मङ्गलबार, १५ साउन २०८१'],
        ['M', '१५ साउन'],
        ['Y', 'साउन २०८१'],
        ['yyyy/MM/dd', '२०८१/०४/१५'],
        ['dddd, d MMMM', 'मङ्गलबार, १५ साउन'],
        ['ddd', 'मङ्गल'],
        ["'साल' yyyy", 'साल २०८१'],
    ])('formats %s in Nepali as %s', (format, expected) => {
        expect(formatBs(date, format, 'nepali')).toBe(expected);
    });

    it('defaults to yyyy-MM-dd', () => {
        expect(formatBs(date)).toBe('2081-04-15');
        expect(formatBs({ year: 2082, month: 1, day: 5 }, 'dd MMMM', 'nepali')).toBe('०५ बैशाख');
    });

    it.each(['x', 'T', "'unterminated", 'yyyy\\'])('rejects the format %s', (format) => {
        expect(() => formatBs(date, format)).toThrow();
    });

    it('rejects dates that do not exist', () => {
        expect(() => formatBs({ year: 2081, month: 1, day: 32 })).toThrow(RangeError);
    });
});

describe('names', () => {
    it('names months in both scripts', () => {
        expect(monthName(12)).toBe('Chaitra');
        expect(monthName(12, 'nepali')).toBe('चैत');
        expect(() => monthName(13)).toThrow(RangeError);
    });

    it('writes Devanagari digits', () => {
        expect(toDigits(2081, 'nepali')).toBe('२०८१');
        expect(toDigits(5, 'nepali', 2)).toBe('०५');
        expect(toDigits(5)).toBe('5');
    });
});
