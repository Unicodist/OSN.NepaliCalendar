import {
    type AdDate,
    type BsDate,
    type Script,
    daysInMonth as bsDaysInMonth,
    formatBs,
    formatNepalSambat,
    isSupportedYear,
    isValidBsDate,
    monthName as bsMonthName,
    toAd,
    toBs,
    toNepalSambat,
} from '@opensourcenepal/nepali-calendar';

/** A cell value as Excel passes it to a custom function parameter of type `any`. */
export type CellValue = number | string | boolean | null | undefined;

/** Bad input from the worksheet. The add-in reports it as `#VALUE!` with this message. */
export class InputError extends Error {
    override name = 'InputError';
}

const MS_PER_DAY = 86_400_000;
// Excel's serial 0 is 1899-12-30 for every date after 1900-02-28 (the 1900 date system).
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const DEVANAGARI_DIGITS = /[०-९]/g;

/** Converts an Excel date serial number (time of day ignored) to a Gregorian date. */
export function serialToAd(serial: number): AdDate {
    const utc = new Date(EXCEL_EPOCH + Math.floor(serial) * MS_PER_DAY);
    return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** Converts a Gregorian date to an Excel date serial number. */
export function adToSerial(date: AdDate): number {
    return Math.round((Date.UTC(date.year, date.month - 1, date.day) - EXCEL_EPOCH) / MS_PER_DAY);
}

function isBlank(value: CellValue): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function parseYmd(text: string): [number, number, number] | null {
    const normalized = text.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
    const match = /^\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*$/.exec(normalized);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** Reads an AD date from a cell: an Excel date, or text in `yyyy-MM-dd` form. */
export function readAdDate(value: CellValue): AdDate {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
        return serialToAd(value);
    }
    if (typeof value === 'string') {
        const parts = parseYmd(value);
        if (parts) {
            const [year, month, day] = parts;
            const utc = new Date(Date.UTC(year, month - 1, day));
            if (utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day) {
                return { year, month, day };
            }
        }
    }
    throw new InputError(isBlank(value) ? 'The date is empty.' : 'Expected an Excel date or AD text like 2025-10-02.');
}

/**
 * Reads a BS date from a cell: text in `yyyy-MM-dd` form (`/` and `.` separators and Devanagari digits
 * also work). When Excel has already turned typed BS text like `2082-06-16` into a date, its year, month
 * and day are read back as the BS date that was typed.
 */
export function readBsDate(value: CellValue): BsDate {
    let parts: [number, number, number] | null = null;
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
        const typed = serialToAd(value);
        parts = [typed.year, typed.month, typed.day];
    } else if (typeof value === 'string') {
        parts = parseYmd(value);
    }
    if (!parts) {
        throw new InputError(isBlank(value) ? 'The date is empty.' : 'Expected BS text like 2082-06-16.');
    }
    const [year, month, day] = parts;
    if (!isValidBsDate(year, month, day)) {
        throw new InputError(`${year}-${month}-${day} is not a BS date between 1970-01-01 and 2090-12-30.`);
    }
    return { year, month, day };
}

function readScript(value: CellValue): Script {
    if (isBlank(value)) {
        return 'roman';
    }
    const script = String(value).trim().toLowerCase();
    if (script === 'roman' || script === 'english' || script === 'en') {
        return 'roman';
    }
    if (script === 'nepali' || script === 'devanagari' || script === 'ne' || script === 'np') {
        return 'nepali';
    }
    throw new InputError('Script must be "roman" or "nepali".');
}

function readInteger(value: CellValue, name: string): number {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof number !== 'number' || !Number.isInteger(number)) {
        throw new InputError(`The ${name} must be a whole number.`);
    }
    return number;
}

function format(date: BsDate, pattern: CellValue, script: CellValue): string {
    try {
        return formatBs(date, isBlank(pattern) ? 'yyyy-MM-dd' : String(pattern), readScript(script));
    } catch (error) {
        throw error instanceof InputError ? error : new InputError((error as Error).message);
    }
}

function toBsChecked(date: AdDate): BsDate {
    try {
        return toBs(date);
    } catch (error) {
        throw new InputError((error as Error).message);
    }
}

/** `NEPALI.TOBS(date, [format], [script])`: the BS date of an AD date, as text. */
export function toBsText(date: CellValue, pattern?: CellValue, script?: CellValue): string {
    return format(toBsChecked(readAdDate(date)), pattern, script);
}

/** `NEPALI.TOAD(bs_date)`: the AD date of a BS date, as an Excel date. */
export function toAdSerial(bsDate: CellValue): number {
    return adToSerial(toAd(readBsDate(bsDate)));
}

/** `NEPALI.DATE(year, month, day)`: the AD date of a BS year, month and day, as an Excel date. */
export function bsDateSerial(year: CellValue, month: CellValue, day: CellValue): number {
    const [y, m, d] = [readInteger(year, 'year'), readInteger(month, 'month'), readInteger(day, 'day')];
    if (!isValidBsDate(y, m, d)) {
        throw new InputError(`${y}-${m}-${d} is not a BS date between 1970-01-01 and 2090-12-30.`);
    }
    return adToSerial(toAd({ year: y, month: m, day: d }));
}

/** `NEPALI.YEAR(date)`: the BS year of an AD date. */
export function bsYear(date: CellValue): number {
    return toBsChecked(readAdDate(date)).year;
}

/** `NEPALI.MONTH(date)`: the BS month (1 = Baisakh to 12 = Chaitra) of an AD date. */
export function bsMonth(date: CellValue): number {
    return toBsChecked(readAdDate(date)).month;
}

/** `NEPALI.DAY(date)`: the BS day of the month of an AD date. */
export function bsDay(date: CellValue): number {
    return toBsChecked(readAdDate(date)).day;
}

/** `NEPALI.FORMAT(bs_date, format, [script])`: reformats a BS date. */
export function formatBsText(bsDate: CellValue, pattern: CellValue, script?: CellValue): string {
    return format(readBsDate(bsDate), pattern, script);
}

/** `NEPALI.TODAY([format], [script])`: today's BS date, as text. */
export function todayText(pattern?: CellValue, script?: CellValue, now: Date = new Date()): string {
    return format(
        toBsChecked({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }),
        pattern,
        script,
    );
}

/** `NEPALI.DAYSINMONTH(year, month)`: the number of days in a BS month. */
export function daysInMonth(year: CellValue, month: CellValue): number {
    const [y, m] = [readInteger(year, 'year'), readInteger(month, 'month')];
    if (!isSupportedYear(y) || m < 1 || m > 12) {
        throw new InputError('The year must be 1970 to 2090 and the month 1 to 12.');
    }
    return bsDaysInMonth(y, m);
}

/** `NEPALI.MONTHNAME(month, [script])`: the name of a BS month. */
export function monthName(month: CellValue, script?: CellValue): string {
    const m = readInteger(month, 'month');
    if (m < 1 || m > 12) {
        throw new InputError('The month must be 1 to 12.');
    }
    return bsMonthName(m, readScript(script));
}

/** `NEPALI.TONS(date, [format], [script])`: the Nepal Sambat date of an AD date, as text. */
export function toNsText(date: CellValue, pattern?: CellValue, script?: CellValue): string {
    const ns = toNepalSambat(toBsChecked(readAdDate(date)));
    try {
        return formatNepalSambat(ns, isBlank(pattern) ? 'G' : String(pattern), readScript(script));
    } catch (error) {
        throw error instanceof InputError ? error : new InputError((error as Error).message);
    }
}

/** `NEPALI.NSYEAR(date)`: the Nepal Sambat year of an AD date. */
export function nsYear(date: CellValue): number {
    return toNepalSambat(toBsChecked(readAdDate(date))).year;
}

/** Every worksheet function, by the id it has in functions.json. */
export const FUNCTIONS = {
    TOBS: toBsText,
    TOAD: toAdSerial,
    DATE: bsDateSerial,
    YEAR: bsYear,
    MONTH: bsMonth,
    DAY: bsDay,
    FORMAT: formatBsText,
    TODAY: (pattern?: CellValue, script?: CellValue) => todayText(pattern, script),
    DAYSINMONTH: daysInMonth,
    MONTHNAME: monthName,
    TONS: toNsText,
    NSYEAR: nsYear,
} as const;

/** The functions whose first parameter also takes a range, like `=NEPALI.TOBS(A1:A100)`. */
export const RANGE_FUNCTIONS: ReadonlySet<keyof typeof FUNCTIONS> = new Set([
    'TOBS',
    'TOAD',
    'YEAR',
    'MONTH',
    'DAY',
    'FORMAT',
    'TONS',
    'NSYEAR',
]);

/**
 * Applies a function to each cell of the range Excel passes as its first argument, returning a range
 * of the same shape that spills into the cells below and beside the formula. A single cell behaves
 * like a plain value, so its errors are thrown. In a larger range, blank cells stay blank and a cell
 * that fails gets the error from `toError` in its place.
 */
export function overRange(
    fn: (first: CellValue, ...rest: CellValue[]) => unknown,
    toError: (error: unknown) => unknown,
): (first: CellValue[][], ...rest: CellValue[]) => unknown[][] {
    return (first, ...rest) => {
        if (first.length === 1 && first[0]!.length === 1) {
            return [[fn(first[0]![0], ...rest)]];
        }
        return first.map((row) =>
            row.map((cell) => {
                if (isBlank(cell)) {
                    return '';
                }
                try {
                    return fn(cell, ...rest);
                } catch (error) {
                    return toError(error);
                }
            }),
        );
    };
}

/** The result of converting a block of cells with the task pane. */
export interface ConvertedCells {
    values: (string | number)[][];
    numberFormat: string[][];
    converted: number;
    failed: number;
}

/**
 * Converts each cell of a block: `toBs` turns AD dates into BS text, `toAd` turns BS dates into
 * Excel dates. Blank cells stay blank, and cells that cannot be converted are left blank and counted.
 */
export function convertCells(values: CellValue[][], direction: 'toBs' | 'toAd'): ConvertedCells {
    let converted = 0;
    let failed = 0;
    const result = values.map((row) =>
        row.map((cell): string | number => {
            if (isBlank(cell)) {
                return '';
            }
            try {
                const value = direction === 'toBs' ? toBsText(cell) : toAdSerial(cell);
                converted++;
                return value;
            } catch {
                failed++;
                return '';
            }
        }),
    );
    // Text format keeps BS text like 2082-06-16 from being read as a date.
    const format = direction === 'toBs' ? '@' : 'yyyy-mm-dd';
    return { values: result, numberFormat: values.map((row) => row.map(() => format)), converted, failed };
}
