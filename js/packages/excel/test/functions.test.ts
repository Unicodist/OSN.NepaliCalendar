import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    type CellValue,
    FUNCTIONS,
    InputError,
    RANGE_FUNCTIONS,
    adToSerial,
    bsDateSerial,
    bsDay,
    bsMonth,
    bsYear,
    convertCells,
    daysInMonth,
    formatBsText,
    monthName,
    nsYear,
    overRange,
    readAdDate,
    readBsDate,
    serialToAd,
    toAdSerial,
    toBsText,
    toNsText,
    todayText,
} from '../src/functions.js';

// Excel serials: 2025-10-02 is 45932 and 1913-04-13 is 4852.
const DASHAIN_SERIAL = 45932;

describe('Excel serials', () => {
    it('round-trips AD dates', () => {
        expect(adToSerial({ year: 2025, month: 10, day: 2 })).toBe(DASHAIN_SERIAL);
        expect(serialToAd(DASHAIN_SERIAL)).toEqual({ year: 2025, month: 10, day: 2 });
        expect(adToSerial({ year: 1913, month: 4, day: 13 })).toBe(4852);
        expect(serialToAd(1)).toEqual({ year: 1899, month: 12, day: 31 });
    });

    it('ignores the time of day', () => {
        expect(serialToAd(DASHAIN_SERIAL + 0.75)).toEqual({ year: 2025, month: 10, day: 2 });
    });
});

describe('reading cells', () => {
    it('reads AD dates from serials and text', () => {
        expect(readAdDate(DASHAIN_SERIAL)).toEqual({ year: 2025, month: 10, day: 2 });
        expect(readAdDate('2025-10-02')).toEqual({ year: 2025, month: 10, day: 2 });
        expect(readAdDate(' 2025/10/2 ')).toEqual({ year: 2025, month: 10, day: 2 });
    });

    it('rejects empty and invalid AD dates', () => {
        expect(() => readAdDate('')).toThrow('The date is empty.');
        expect(() => readAdDate(null)).toThrow(InputError);
        expect(() => readAdDate('2025-02-30')).toThrow(InputError);
        expect(() => readAdDate(true)).toThrow(InputError);
        expect(() => readAdDate(0)).toThrow(InputError);
    });

    it('reads BS dates from text, including Devanagari digits', () => {
        expect(readBsDate('2082-06-16')).toEqual({ year: 2082, month: 6, day: 16 });
        expect(readBsDate('2082/6/16')).toEqual({ year: 2082, month: 6, day: 16 });
        expect(readBsDate('२०८२-०६-१६')).toEqual({ year: 2082, month: 6, day: 16 });
    });

    it('reads typed BS text that Excel turned into a date', () => {
        // Typing 2082-06-16 in a cell stores the AD date 2082-06-16.
        expect(readBsDate(adToSerial({ year: 2082, month: 6, day: 16 }))).toEqual({ year: 2082, month: 6, day: 16 });
    });

    it('rejects BS dates that do not exist', () => {
        expect(() => readBsDate('2082-06-32')).toThrow('2082-6-32 is not a BS date');
        expect(() => readBsDate('2091-01-01')).toThrow(InputError);
        expect(() => readBsDate('hello')).toThrow('Expected BS text like 2082-06-16.');
    });
});

describe('worksheet functions', () => {
    it('TOBS converts AD to BS text', () => {
        expect(toBsText(DASHAIN_SERIAL)).toBe('2082-06-16');
        expect(toBsText('2025-10-02', 'D')).toBe('16 Ashwin 2082');
        expect(toBsText(DASHAIN_SERIAL, 'D', 'nepali')).toBe('१६ असोज २०८२');
        expect(toBsText(DASHAIN_SERIAL, '', 'NEPALI')).toBe('२०८२-०६-१६');
        expect(() => toBsText('1900-01-01')).toThrow(InputError);
        expect(() => toBsText(DASHAIN_SERIAL, 'D', 'klingon')).toThrow('Script must be');
        expect(() => toBsText(DASHAIN_SERIAL, 'Q')).toThrow(InputError);
    });

    it('TOAD converts BS to an Excel date', () => {
        expect(toAdSerial('2082-06-16')).toBe(DASHAIN_SERIAL);
        expect(toAdSerial('1970-01-01')).toBe(4852);
    });

    it('DATE builds an Excel date from BS parts', () => {
        expect(bsDateSerial(2082, 6, 16)).toBe(DASHAIN_SERIAL);
        expect(bsDateSerial('2082', '6', '16')).toBe(DASHAIN_SERIAL);
        expect(() => bsDateSerial(2082, 13, 1)).toThrow(InputError);
        expect(() => bsDateSerial(2082, 6.5, 1)).toThrow('The month must be a whole number.');
    });

    it('YEAR, MONTH and DAY return BS parts of an AD date', () => {
        expect([bsYear(DASHAIN_SERIAL), bsMonth(DASHAIN_SERIAL), bsDay(DASHAIN_SERIAL)]).toEqual([2082, 6, 16]);
    });

    it('FORMAT reformats a BS date', () => {
        expect(formatBsText('2082-06-16', 'dddd, d MMMM yyyy')).toBe('Bihibar, 16 Ashwin 2082');
        expect(formatBsText('2082-06-16', 'F', 'nepali')).toBe('बिहीबार, १६ असोज २०८२');
    });

    it('TODAY formats the BS date of a local day', () => {
        expect(todayText(undefined, undefined, new Date(2025, 9, 2, 23, 30))).toBe('2082-06-16');
        expect(todayText('D', 'nepali', new Date(2025, 9, 2))).toBe('१६ असोज २०८२');
    });

    it('DAYSINMONTH and MONTHNAME describe BS months', () => {
        expect(daysInMonth(2082, 6)).toBe(31);
        expect(() => daysInMonth(2082, 0)).toThrow(InputError);
        expect(monthName(6)).toBe('Ashwin');
        expect(monthName(6, 'nepali')).toBe('असोज');
    });
});

describe('Nepal Sambat functions', () => {
    it('TONS converts AD to a Nepal Sambat date', () => {
        expect(toNsText(DASHAIN_SERIAL)).toBe('NS 1145 Kaula Thwa Dashami');
        expect(toNsText(DASHAIN_SERIAL, 'G', 'nepali')).toBe('ने.सं. ११४५ कौलाथ्व दशमी');
        expect(toNsText('2025-10-22', 'M')).toBe('Kachhala Thwa Paru');
        expect(() => toNsText(DASHAIN_SERIAL, 'D')).toThrow(InputError);
    });

    it('NSYEAR changes at the Nepal Sambat new year', () => {
        expect(nsYear('2025-10-21')).toBe(1145);
        expect(nsYear('2025-10-22')).toBe(1146);
    });
});

describe('functions.json', () => {
    const metadata = JSON.parse(readFileSync(new URL('../src/functions.json', import.meta.url), 'utf8')) as {
        functions: { id: string; name: string }[];
    };

    it('describes every function and nothing else', () => {
        expect(metadata.functions.map((f) => f.id).sort()).toEqual(Object.keys(FUNCTIONS).sort());
        expect(metadata.functions.every((f) => f.name === f.id)).toBe(true);
    });
});

describe('ranges', () => {
    const toError = (error: unknown) => `#VALUE! ${(error as Error).message}`;

    it('converts each cell of a range and keeps blanks blank', () => {
        const tobs = overRange(toBsText as (...a: CellValue[]) => unknown, toError);
        expect(tobs([[DASHAIN_SERIAL], [''], [null], ['2025-04-14']])).toEqual([
            ['2082-06-16'],
            [''],
            [''],
            ['2082-01-01'],
        ]);
        expect(tobs([[DASHAIN_SERIAL, '2025-04-14']], 'D', 'nepali')).toEqual([['१६ असोज २०८२', '१ बैशाख २०८२']]);
    });

    it('puts an error in each cell that fails', () => {
        const toad = overRange(toAdSerial as (...a: CellValue[]) => unknown, toError);
        expect(toad([['2082-06-16'], ['2082-06-32']])).toEqual([
            [DASHAIN_SERIAL],
            ['#VALUE! 2082-6-32 is not a BS date between 1970-01-01 and 2090-12-30.'],
        ]);
    });

    it('throws for a single cell, like a plain value', () => {
        const toad = overRange(toAdSerial as (...a: CellValue[]) => unknown, toError);
        expect(toad([['2082-06-16']])).toEqual([[DASHAIN_SERIAL]]);
        expect(() => toad([['']])).toThrow('The date is empty.');
    });

    it('lists only functions that exist, each with a range first parameter in functions.json', () => {
        const metadata = JSON.parse(readFileSync(new URL('../src/functions.json', import.meta.url), 'utf8')) as {
            functions: { id: string; result: { dimensionality?: string }; parameters: { dimensionality?: string }[] }[];
        };
        for (const f of metadata.functions) {
            const isRange = RANGE_FUNCTIONS.has(f.id as keyof typeof FUNCTIONS);
            expect([f.id, f.parameters[0]?.dimensionality === 'matrix'], f.id).toEqual([f.id, isRange]);
            expect([f.id, f.result.dimensionality === 'matrix'], f.id).toEqual([f.id, isRange]);
        }
    });
});

describe('convertCells', () => {
    it('converts AD to BS text and counts what failed', () => {
        expect(convertCells([[DASHAIN_SERIAL], [''], ['nope']], 'toBs')).toEqual({
            values: [['2082-06-16'], [''], ['']],
            numberFormat: [['@'], ['@'], ['@']],
            converted: 1,
            failed: 1,
        });
    });

    it('converts BS to Excel dates', () => {
        const result = convertCells([['2082-06-16', '२०८२-०१-०१']], 'toAd');
        expect(result.values).toEqual([[DASHAIN_SERIAL, adToSerial({ year: 2025, month: 4, day: 14 })]]);
        expect(result.numberFormat).toEqual([['yyyy-mm-dd', 'yyyy-mm-dd']]);
    });
});
