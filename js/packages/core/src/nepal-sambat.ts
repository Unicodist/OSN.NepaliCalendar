import { addDays, type BsDate, MIN_DATE, toAd } from './calendar.js';
import { type Script, toDigits } from './names.js';
import { NS_DAY_COUNT, NS_FIRST_TITHI, NS_FIRST_YEAR, NS_MONTHS, NS_STEPS } from './nepal-sambat-data.js';

/** The half of a lunar month: `thwa` (bright, shukla) or `ga` (dark, krishna). */
export type Paksha = 'thwa' | 'ga';

/**
 * A day in the Nepal Sambat (नेपाल संवत्) lunar calendar, for example NS 1147 Kachhala Thwa Paru.
 *
 * Each day takes the tithi current at sunrise in Kathmandu, following Nepal's official panchang.
 * A tithi is sometimes skipped (no day has it) or repeated (two days in a row have it).
 */
export interface NepalSambatDate {
    /** The Nepal Sambat year, for example 1147. */
    readonly year: number;
    /** The lunar month, 1 (Kachhala) to 12 (Kaula). In a leap month this is the month being repeated. */
    readonly month: number;
    /** Whether the day is in a leap month (Anala, अनला), the first of two months with the same name. */
    readonly isLeapMonth: boolean;
    /** The half of the month. */
    readonly paksha: Paksha;
    /** The tithi within the half, 1 (Paru) to 15: the full moon (Punhi) in `thwa`, the new moon (Amai) in `ga`. */
    readonly tithi: number;
    /** The tithi counted through the whole month, 1 (Thwa Paru) to 30 (Ga Amai). */
    readonly lunarDay: number;
    /** Whether the previous day had the same tithi, so this is the second day of a repeated tithi. */
    readonly isRepeatedTithi: boolean;
}

/** Nepal Sambat month names, Kachhala first. */
export const NEPAL_SAMBAT_MONTH_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: [
        'Kachhala',
        'Thinla',
        'Pohela',
        'Silla',
        'Chilla',
        'Chaula',
        'Bachhala',
        'Tachhala',
        'Dilla',
        'Gunla',
        'Yanla',
        'Kaula',
    ],
    nepali: ['कछला', 'थिंला', 'पोहेला', 'सिल्ला', 'चिल्ला', 'चौला', 'बछला', 'तछला', 'दिल्ला', 'गुंला', 'ञंला', 'कौला'],
};

/** The name of a leap month. */
export const NEPAL_SAMBAT_LEAP_MONTH_NAME: Readonly<Record<Script, string>> = { roman: 'Anala', nepali: 'अनला' };

/** Tithi names within a half, Paru first; the 15th is Punhi (full moon) in `thwa`. */
export const TITHI_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: [
        'Paru',
        'Dwitiya',
        'Tritiya',
        'Chaturthi',
        'Panchami',
        'Shashthi',
        'Saptami',
        'Ashtami',
        'Navami',
        'Dashami',
        'Ekadashi',
        'Dwadashi',
        'Trayodashi',
        'Chaturdashi',
        'Punhi',
    ],
    nepali: [
        'पारू',
        'द्वितीया',
        'तृतीया',
        'चतुर्थी',
        'पञ्चमी',
        'षष्ठी',
        'सप्तमी',
        'अष्टमी',
        'नवमी',
        'दशमी',
        'एकादशी',
        'द्वादशी',
        'त्रयोदशी',
        'चतुर्दशी',
        'पुन्हि',
    ],
};

/** The name of the new moon, the 15th tithi of `ga`. */
export const NEW_MOON_NAME: Readonly<Record<Script, string>> = { roman: 'Amai', nepali: 'आमै' };

const STEP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZa';
const ANCHOR = Date.UTC(1913, 3, 13);
const MS_PER_DAY = 86_400_000;

interface Tables {
    readonly lunarDays: Uint8Array;
    readonly monthIndexes: Uint16Array;
    readonly monthStarts: Int32Array;
    readonly years: Int16Array;
}

let tables: Tables | undefined;

function monthNumber(index: number): number {
    return NS_MONTHS.toLowerCase().charCodeAt(index) - 96;
}

function isLeap(index: number): boolean {
    const c = NS_MONTHS[index]!;
    return c !== c.toLowerCase();
}

/** Decodes the tables on first use, so that importing the package costs nothing. */
function getTables(): Tables {
    if (tables) {
        return tables;
    }

    const lunarDays = new Uint8Array(NS_DAY_COUNT);
    const monthIndexes = new Uint16Array(NS_DAY_COUNT);
    const monthStarts = new Int32Array(NS_MONTHS.length);
    const years = new Int16Array(NS_MONTHS.length);

    let lunarDay = NS_FIRST_TITHI;
    let monthIndex = 0;
    let year = NS_FIRST_YEAR;
    let lastMonth = isLeap(0) ? 0 : monthNumber(0);
    years[0] = year;

    for (let day = 0; day < NS_DAY_COUNT; day++) {
        if (day > 0) {
            const i = day - 1;
            const value = STEP_ALPHABET.indexOf(NS_STEPS[Math.floor(i / 3)]!);
            const step = i % 3 === 0 ? Math.floor(value / 9) : i % 3 === 1 ? Math.floor(value / 3) % 3 : value % 3;
            const next = ((lunarDay - 1 + step) % 30) + 1;
            if (next < lunarDay) {
                // A new lunar month. The year turns over at the first ordinary month whose number is
                // lower than the previous ordinary month's, which is Kachhala unless it is skipped.
                monthIndex++;
                monthStarts[monthIndex] = day;
                if (!isLeap(monthIndex)) {
                    const month = monthNumber(monthIndex);
                    if (lastMonth !== 0 && month < lastMonth) {
                        year++;
                    }
                    lastMonth = month;
                }
                years[monthIndex] = year;
            }
            lunarDay = next;
        }
        lunarDays[day] = lunarDay;
        monthIndexes[day] = monthIndex;
    }

    tables = { lunarDays, monthIndexes, monthStarts, years };
    return tables;
}

function dayNumberOf(date: BsDate): number {
    const ad = toAd(date);
    return Math.round((Date.UTC(ad.year, ad.month - 1, ad.day) - ANCHOR) / MS_PER_DAY);
}

/**
 * Returns the Nepal Sambat date of a BS date.
 * @throws RangeError when the BS date does not exist or is out of range.
 */
export function toNepalSambat(date: BsDate): NepalSambatDate {
    const day = dayNumberOf(date);
    const t = getTables();
    const lunarDay = t.lunarDays[day]!;
    const monthIndex = t.monthIndexes[day]!;
    return {
        year: t.years[monthIndex]!,
        month: monthNumber(monthIndex),
        isLeapMonth: isLeap(monthIndex),
        paksha: lunarDay > 15 ? 'ga' : 'thwa',
        tithi: ((lunarDay - 1) % 15) + 1,
        lunarDay,
        isRepeatedTithi: day > 0 && t.lunarDays[day - 1] === lunarDay,
    };
}

/**
 * Returns the Nepal Sambat year of a BS date: `year - 937` before the Nepal Sambat new year
 * (Kachhala Thwa Paru, around Mha Puja in Kartik) and `year - 936` from it.
 * @throws RangeError when the BS date does not exist or is out of range.
 */
export function nepalSambatYear(date: BsDate): number {
    const t = getTables();
    return t.years[t.monthIndexes[dayNumberOf(date)]!]!;
}

/**
 * Finds the BS dates that have a Nepal Sambat date: usually one, two when the tithi is repeated,
 * and none when it is skipped, when that year has no such leap month, or when it is out of range.
 * @throws RangeError when `month`, `paksha` or `tithi` is out of range.
 */
export function findNepalSambatDays(
    year: number,
    month: number,
    paksha: Paksha,
    tithi: number,
    isLeapMonth = false,
): BsDate[] {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new RangeError('Month must be between 1 and 12.');
    }
    if (paksha !== 'thwa' && paksha !== 'ga') {
        throw new RangeError("Paksha must be 'thwa' or 'ga'.");
    }
    if (!Number.isInteger(tithi) || tithi < 1 || tithi > 15) {
        throw new RangeError('Tithi must be between 1 and 15.');
    }

    const t = getTables();
    const lunarDay = paksha === 'ga' ? tithi + 15 : tithi;
    const result: BsDate[] = [];
    for (let i = 0; i < t.monthStarts.length; i++) {
        if (t.years[i] !== year || monthNumber(i) !== month || isLeap(i) !== isLeapMonth) {
            continue;
        }
        const end = i + 1 < t.monthStarts.length ? t.monthStarts[i + 1]! : NS_DAY_COUNT;
        for (let day = t.monthStarts[i]!; day < end; day++) {
            if (t.lunarDays[day] === lunarDay) {
                result.push(addDays(MIN_DATE, day));
            }
        }
    }
    return result;
}

/** One lunar month of a Nepal Sambat year, with the BS dates of its first and last days. */
export interface NepalSambatMonthSpan {
    readonly year: number;
    /** The lunar month, 1 (Kachhala) to 12 (Kaula). In a leap month this is the month being repeated. */
    readonly month: number;
    readonly isLeapMonth: boolean;
    readonly first: BsDate;
    readonly last: BsDate;
}

const monthsByYear = new Map<number, readonly NepalSambatMonthSpan[]>();

/**
 * Returns the lunar months of a Nepal Sambat year in order: usually 12, 13 with a leap month (Anala),
 * fewer in a year with a skipped month or at the ends of the supported range, and none outside it.
 */
export function nepalSambatMonths(year: number): readonly NepalSambatMonthSpan[] {
    const cached = monthsByYear.get(year);
    if (cached) {
        return cached;
    }
    const t = getTables();
    const months: NepalSambatMonthSpan[] = [];
    for (let i = 0; i < t.monthStarts.length; i++) {
        if (t.years[i] !== year) {
            continue;
        }
        const end = i + 1 < t.monthStarts.length ? t.monthStarts[i + 1]! : NS_DAY_COUNT;
        months.push({
            year,
            month: monthNumber(i),
            isLeapMonth: isLeap(i),
            first: addDays(MIN_DATE, t.monthStarts[i]!),
            last: addDays(MIN_DATE, end - 1),
        });
    }
    const frozen = Object.freeze(months);
    monthsByYear.set(year, frozen);
    return frozen;
}

/** Returns the name of a Nepal Sambat month, such as Kachhala, or Anala for a leap month. */
export function nepalSambatMonthName(month: number, isLeapMonth = false, script: Script = 'roman'): string {
    if (isLeapMonth) {
        return NEPAL_SAMBAT_LEAP_MONTH_NAME[script];
    }
    const name = NEPAL_SAMBAT_MONTH_NAMES[script][month - 1];
    if (name === undefined) {
        throw new RangeError('Month must be between 1 and 12.');
    }
    return name;
}

/** Returns the name of a tithi, such as Paru, Punhi or Amai. */
export function tithiName(paksha: Paksha, tithi: number, script: Script = 'roman'): string {
    if (tithi === 15 && paksha === 'ga') {
        return NEW_MOON_NAME[script];
    }
    const name = TITHI_NAMES[script][tithi - 1];
    if (name === undefined) {
        throw new RangeError('Tithi must be between 1 and 15.');
    }
    return name;
}

/**
 * Formats a Nepal Sambat date, with the same formats as the .NET `NepalSambatDate.ToString`:
 * `G` (`NS 1147 Kachhala Thwa Paru`, `ने.सं. ११४७ कछलाथ्व पारू`), `M` (`Kachhala Thwa Paru`) or
 * `Y` (`NS 1147`). A leap month is written Anala (अनला).
 * @throws Error when the format is not G, M or Y.
 */
export function formatNepalSambat(date: NepalSambatDate, format = 'G', script: Script = 'roman'): string {
    const nepali = script === 'nepali';
    const year = `${nepali ? 'ने.सं.' : 'NS'} ${toDigits(date.year, script)}`;
    const month = nepalSambatMonthName(date.month, date.isLeapMonth, script);
    // Devanagari joins the half to the month, as in कछलाथ्व; Roman keeps them apart.
    const half = nepali ? (date.paksha === 'thwa' ? 'थ्व' : 'गा') : date.paksha === 'thwa' ? ' Thwa' : ' Ga';
    const day = `${month}${half} ${tithiName(date.paksha, date.tithi, script)}`;
    switch (format || 'G') {
        case 'G':
        case 'g':
            return `${year} ${day}`;
        case 'M':
        case 'm':
            return day;
        case 'Y':
        case 'y':
            return year;
        default:
            throw new Error(`'${format}' is not a valid Nepal Sambat format. Use G, M or Y.`);
    }
}

/**
 * Returns the Nepal Sambat year or years that a span of days falls in, for a calendar header:
 * `NS 1146`, or `NS 1146–1147` when the span crosses the Nepal Sambat new year.
 * @throws RangeError when a date does not exist or is out of range.
 */
export function formatNepalSambatYears(first: BsDate, last: BsDate, script: Script = 'roman'): string {
    const from = nepalSambatYear(first);
    const to = nepalSambatYear(last);
    const prefix = script === 'nepali' ? 'ने.सं.' : 'NS';
    return from === to
        ? `${prefix} ${toDigits(from, script)}`
        : `${prefix} ${toDigits(from, script)}–${toDigits(to, script)}`;
}
