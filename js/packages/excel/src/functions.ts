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
import { type MonthNames, type Ymd, findMonth, latinDigits, parseDateText } from './parse.js';

/** A cell value as Excel passes it to a custom function: a number (dates are numbers), text or a boolean. */
export type CellValue = number | string | boolean | null | undefined;

/** Bad input from the worksheet. The add-in reports it as `#VALUE!` with this message. */
export class InputError extends Error {
    override name = 'InputError';
}

const MS_PER_DAY = 86_400_000;
// Excel's serial 0 is 1899-12-30 for every date after 1900-02-28 (the 1900 date system).
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
// 9999-12-31, the last date Excel can show.
const MAX_SERIAL = 2_958_465;

/** Converts an Excel date serial number (time of day ignored) to a Gregorian date. */
export function serialToAd(serial: number): AdDate {
    const utc = new Date(EXCEL_EPOCH + Math.floor(serial) * MS_PER_DAY);
    return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** Converts a Gregorian date to an Excel date serial number. */
export function adToSerial(date: AdDate): number {
    return Math.round((Date.UTC(date.year, date.month - 1, date.day) - EXCEL_EPOCH) / MS_PER_DAY);
}

/** Whether a cell is empty: Excel passes an empty cell as `""` or `null`, and an omitted argument as `null`. */
export function isBlank(value: CellValue): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/** Reads a number written as text, with Latin or Devanagari digits. Returns `null` for anything else. */
function numberFromText(text: string): number | null {
    const trimmed = latinDigits(text).trim();
    return /^[+-]?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : null;
}

/** Reads the year, month and day from a cell, in the way that suits its type. */
function readYmd(value: CellValue, names: MonthNames): Ymd {
    if (isBlank(value)) {
        throw new InputError('The date is empty.');
    }
    if (typeof value === 'boolean') {
        throw new InputError(`Expected a date, not ${value ? 'TRUE' : 'FALSE'}.`);
    }
    const number = typeof value === 'number' ? value : numberFromText(value as string);
    if (number !== null) {
        if (!Number.isFinite(number)) {
            throw new InputError('Expected a date.');
        }
        // 20250102 written as a number.
        if (Number.isInteger(number) && number >= 10_000_101 && number <= 99_991_231) {
            return { year: Math.floor(number / 10_000), month: Math.floor(number / 100) % 100, day: number % 100 };
        }
        if (number < 1 || number > MAX_SERIAL) {
            throw new InputError(`${number} is not an Excel date.`);
        }
        return serialToAd(number);
    }
    const parsed = parseDateText(value as string, names);
    if (!parsed.ok) {
        throw new InputError(parsed.reason);
    }
    return parsed.date;
}

/**
 * Reads an AD date from a cell: an Excel date (a number), `20251002`, or text such as `2025-10-02`,
 * `02/10/2025` when the day is clear, `2 Oct 2025`, `October 2, 2025` or `2025-10-02T10:30:00Z`.
 * The time of day is ignored.
 */
export function readAdDate(value: CellValue): AdDate {
    const { year, month, day } = readYmd(value, 'ad');
    const utc = new Date(Date.UTC(year, month - 1, day));
    if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
        throw new InputError(`${year}-${month}-${day} is not a date.`);
    }
    return { year, month, day };
}

/**
 * Reads a BS date from a cell: text such as `2082-06-16`, `16/06/2082`, `16 Ashwin 2082`,
 * `Bihibar, 16 Asoj 2082 BS` or `२०८२ असोज १६ गते`, or `20820616`. When Excel has already turned typed
 * BS text into a date (it reads `2082-06-16` as 16 June 2082), the date's year, month and day are read
 * back as the BS date that was typed.
 */
export function readBsDate(value: CellValue): BsDate {
    const { year, month, day } = readYmd(value, 'bs');
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
    if (['roman', 'english', 'en', 'latin'].includes(script)) {
        return 'roman';
    }
    if (['nepali', 'devanagari', 'ne', 'np', 'नेपाली'].includes(script)) {
        return 'nepali';
    }
    throw new InputError('Script must be "roman" or "nepali".');
}

function readInteger(value: CellValue, name: string): number {
    if (isBlank(value)) {
        throw new InputError(`The ${name} is empty.`);
    }
    const number = typeof value === 'string' ? numberFromText(value) : value;
    if (typeof number !== 'number' || !Number.isInteger(number)) {
        throw new InputError(`The ${name} must be a whole number.`);
    }
    return number;
}

/** Reads a BS month: a number from 1 to 12, or a name such as `Ashwin`, `Asoj` or `असोज`. */
function readBsMonth(value: CellValue): number {
    const named = typeof value === 'string' && numberFromText(value) === null ? findMonth(value, 'bs') : null;
    const month = named ?? readInteger(value, 'month');
    if (month < 1 || month > 12) {
        throw new InputError('The month must be 1 to 12, or a BS month name.');
    }
    return month;
}

function readPattern(value: CellValue, fallback: string): string {
    return isBlank(value) ? fallback : String(value).trim();
}

function format(date: BsDate, pattern: CellValue, script: CellValue): string {
    try {
        return formatBs(date, readPattern(pattern, 'yyyy-MM-dd'), readScript(script));
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
    const [y, m, d] = [readInteger(year, 'year'), readBsMonth(month), readInteger(day, 'day')];
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

/** `NEPALI.FORMAT(bs_date, [format], [script])`: reformats a BS date. */
export function formatBsText(bsDate: CellValue, pattern?: CellValue, script?: CellValue): string {
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
    const [y, m] = [readInteger(year, 'year'), readBsMonth(month)];
    if (!isSupportedYear(y)) {
        throw new InputError('The year must be 1970 to 2090.');
    }
    return bsDaysInMonth(y, m);
}

/** `NEPALI.MONTHNAME(month, [script])`: the name of a BS month. */
export function monthName(month: CellValue, script?: CellValue): string {
    return bsMonthName(readBsMonth(month), readScript(script));
}

/** `NEPALI.TONS(date, [format], [script])`: the Nepal Sambat date of an AD date, as text. */
export function toNsText(date: CellValue, pattern?: CellValue, script?: CellValue): string {
    const ns = toNepalSambat(toBsChecked(readAdDate(date)));
    try {
        return formatNepalSambat(ns, readPattern(pattern, 'G'), readScript(script));
    } catch (error) {
        throw error instanceof InputError ? error : new InputError((error as Error).message);
    }
}

/** `NEPALI.NSYEAR(date)`: the Nepal Sambat year of an AD date. */
export function nsYear(date: CellValue): number {
    return toNepalSambat(toBsChecked(readAdDate(date))).year;
}

type WorksheetFunction = (...args: CellValue[]) => string | number;

/**
 * Every worksheet function, by the id it has in functions.json, with the arguments that hold the
 * values to convert: when any of them is blank, the result is blank instead of an error, so a
 * formula over a column with gaps leaves the gaps empty.
 */
export const FUNCTIONS: Readonly<Record<string, { fn: WorksheetFunction; values: readonly number[] }>> = {
    TOBS: { fn: toBsText, values: [0] },
    TOAD: { fn: toAdSerial, values: [0] },
    DATE: { fn: bsDateSerial, values: [0, 1, 2] },
    YEAR: { fn: bsYear, values: [0] },
    MONTH: { fn: bsMonth, values: [0] },
    DAY: { fn: bsDay, values: [0] },
    FORMAT: { fn: formatBsText, values: [0] },
    TODAY: { fn: (pattern, script) => todayText(pattern, script), values: [] },
    DAYSINMONTH: { fn: daysInMonth, values: [0, 1] },
    MONTHNAME: { fn: monthName, values: [0] },
    TONS: { fn: toNsText, values: [0] },
    NSYEAR: { fn: nsYear, values: [0] },
};

/** An argument as Excel passes it to a parameter declared as a matrix: rows of cells, or `null` when omitted. */
export type Argument = CellValue | CellValue[][];

/**
 * Runs a function over its arguments the way Excel's own functions do. Every argument can be a single
 * value or a range. Ranges are matched cell by cell, and a single value or a one-row or one-column range
 * is repeated to fill the others, so `=NEPALI.TOBS(A2:A100, B1)` and `=NEPALI.DATE(A2:A9, B2:B9, 1)` work.
 * The result spills from the formula's cell. A cell whose inputs are blank stays blank, like a
 * single blank cell does; a cell that fails
 * gets the error from `toError`; ranges that cannot be matched give that error in the cells they do not
 * cover. Blank rows at the end are left off, so a whole-column reference like `A:A` does not spill a
 * million empty cells. A single cell behaves like a plain value, so its error is thrown.
 */
export function broadcast(
    fn: WorksheetFunction,
    values: readonly number[],
    toError: (error: unknown) => unknown,
): (...args: Argument[]) => unknown[][] {
    return (...args) => {
        const grids = args.map((arg) => (Array.isArray(arg) ? arg : [[arg]]));
        const rows = Math.max(1, ...grids.map((g) => g.length));
        const columns = Math.max(1, ...grids.map((g) => g[0]?.length ?? 1));
        const single = rows === 1 && columns === 1;

        const cell = (r: number, c: number): unknown => {
            const inputs: CellValue[] = [];
            for (const grid of grids) {
                const height = grid.length;
                const width = grid[0]?.length ?? 1;
                if ((height !== 1 && r >= height) || (width !== 1 && c >= width)) {
                    return toError(new InputError('The ranges are different sizes.'));
                }
                inputs.push(grid[height === 1 ? 0 : r]?.[width === 1 ? 0 : c]);
            }
            if (values.some((i) => isBlank(inputs[i]))) {
                return '';
            }
            if (single) {
                return fn(...inputs);
            }
            try {
                return fn(...inputs);
            } catch (error) {
                return toError(error);
            }
        };

        const result: unknown[][] = [];
        for (let r = 0; r < rows; r++) {
            const row: unknown[] = [];
            for (let c = 0; c < columns; c++) {
                row.push(cell(r, c));
            }
            result.push(row);
        }
        while (result.length > 1 && result[result.length - 1]!.every((v) => v === '')) {
            result.pop();
        }
        return result;
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
