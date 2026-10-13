import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    FUNCTIONS,
    InputError,
    adToSerial,
    bsDateSerial,
    bsDay,
    bsMonth,
    broadcast,
    bsYear,
    convertCells,
    daysInMonth,
    formatBsText,
    monthName,
    nsYear,
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
        expect(() => readBsDate('hello')).toThrow('Could not read "hello" as a date.');
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

describe('broadcast', () => {
    const toError = (error: unknown) => `#VALUE! ${(error as Error).message}`;
    const run = (id: string) => broadcast(FUNCTIONS[id]!.fn, FUNCTIONS[id]!.values, toError);

    it('converts each cell of a range and keeps blanks blank', () => {
        expect(run('TOBS')([[DASHAIN_SERIAL], [''], [null], ['2025-04-14']])).toEqual([
            ['2082-06-16'],
            [''],
            [''],
            ['2082-01-01'],
        ]);
        expect(run('TOBS')([[DASHAIN_SERIAL, '2025-04-14']], 'D', [['nepali']])).toEqual([
            ['१६ असोज २०८२', '१ बैशाख २०८२'],
        ]);
    });

    it('puts an error in each cell that fails', () => {
        expect(run('TOAD')([['2082-06-16'], ['2082-06-32']])).toEqual([
            [DASHAIN_SERIAL],
            ['#VALUE! 2082-6-32 is not a BS date between 1970-01-01 and 2090-12-30.'],
        ]);
    });

    it('treats a single cell like a plain value', () => {
        expect(run('TOAD')([['2082-06-16']])).toEqual([[DASHAIN_SERIAL]]);
        expect(run('TOAD')('2082-06-16')).toEqual([[DASHAIN_SERIAL]]);
        expect(run('TOAD')([['']])).toEqual([['']]);
        expect(() => run('TOAD')([['nope']])).toThrow(InputError);
    });

    it('matches ranges cell by cell and repeats single values', () => {
        expect(run('DATE')([[2082], [2081]], [[6], ['Baisakh']], 16)).toEqual([
            [DASHAIN_SERIAL],
            [adToSerial({ year: 2024, month: 4, day: 28 })],
        ]);
        // A column of dates against a row of formats gives a grid.
        expect(run('TOBS')([[DASHAIN_SERIAL], ['2025-04-14']], [['d', 'D']])).toEqual([
            ['2082-06-16', '16 Ashwin 2082'],
            ['2082-01-01', '1 Baisakh 2082'],
        ]);
        expect(run('TOBS')([[DASHAIN_SERIAL], [DASHAIN_SERIAL]], [['d'], ['D'], ['F']])).toEqual([
            ['2082-06-16'],
            ['16 Ashwin 2082'],
            ['#VALUE! The ranges are different sizes.'],
        ]);
    });

    it('leaves off blank rows at the end of a whole-column reference', () => {
        const column = [[DASHAIN_SERIAL], [''], ...Array.from({ length: 1000 }, () => [''])];
        expect(run('TOBS')(column)).toEqual([['2082-06-16']]);
    });

    it('takes a range in every parameter of every function in functions.json', () => {
        const metadata = JSON.parse(readFileSync(new URL('../src/functions.json', import.meta.url), 'utf8')) as {
            functions: { id: string; result: { dimensionality?: string }; parameters: { dimensionality?: string }[] }[];
        };
        for (const f of metadata.functions) {
            expect([f.id, f.result.dimensionality], f.id).toEqual([f.id, 'matrix']);
            expect(
                f.parameters.every((p) => p.dimensionality === 'matrix'),
                f.id,
            ).toBe(true);
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
