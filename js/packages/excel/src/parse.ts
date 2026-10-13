// Reads dates written as text, in the many ways people write them in spreadsheets.
import {
    ABBREVIATED_DAY_NAMES,
    AD_MONTH_NAMES,
    DAY_NAMES,
    FULL_AD_MONTH_NAMES,
    MONTH_NAMES,
} from '@opensourcenepal/nepali-calendar';

/** A year, month and day read from text, not yet checked against a calendar. */
export interface Ymd {
    year: number;
    month: number;
    day: number;
}

/** Which calendar's month names to recognize. */
export type MonthNames = 'bs' | 'ad';

const DEVANAGARI_DIGITS = /[०-९]/g;

/** Replaces Devanagari digits with Latin ones. */
export function latinDigits(text: string): string {
    return text.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
}

// Common spellings of each BS month, Baisakh first, besides the names in the core package.
const BS_MONTH_ALIASES: readonly (readonly string[])[] = [
    ['baishakh', 'vaisakh', 'vaishakh', 'baisakha', 'baishak', 'besakh', 'वैशाख', 'बैसाख'],
    ['jeth', 'jeshtha', 'jyeshtha', 'jesth', 'jestha', 'जेष्ठ', 'ज्येष्ठ'],
    ['asar', 'asadh', 'ashad', 'ashar', 'asadha', 'aasar', 'asaar', 'आषाढ', 'असाढ'],
    ['saun', 'sawan', 'shravan', 'srawan', 'shrawn', 'saawan', 'श्रावण', 'सावन'],
    ['bhadau', 'bhado', 'bhadrapad', 'bhadra', 'भाद्र', 'भाद्रपद'],
    ['asoj', 'ashoj', 'aswin', 'ashvin', 'asoja', 'असोज', 'आश्विन', 'आसोज'],
    ['kattik', 'kartika', 'kartic', 'कार्तिक', 'कातिक'],
    ['mansir', 'marga', 'margashirsha', 'mangshir', 'mangsheer', 'मङ्सिर', 'मार्ग', 'मार्गशीर्ष'],
    ['push', 'paush', 'pus', 'pousha', 'पौष', 'पूस'],
    ['magha', 'माघ'],
    ['phalgun', 'fagun', 'phagun', 'फाल्गुन', 'फागुण'],
    ['chait', 'chaitr', 'chaita', 'चैत्र', 'चैत'],
];

const AD_MONTH_ALIASES: readonly (readonly string[])[] = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    ['sept'],
    [],
    [],
    ['डिसेम्बर', 'डिसेंबर'],
];

const ENGLISH_DAY_NAMES = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sun',
    'mon',
    'tue',
    'tues',
    'wed',
    'thu',
    'thur',
    'thurs',
    'fri',
    'sat',
];

// Words that can sit around a date without changing it: weekdays, era names and Nepali date words.
const IGNORED = new Set(
    [
        ...ENGLISH_DAY_NAMES,
        ...DAY_NAMES.roman,
        ...DAY_NAMES.nepali,
        ...ABBREVIATED_DAY_NAMES.roman,
        ...ABBREVIATED_DAY_NAMES.nepali,
        'bs',
        'vs',
        'ad',
        'ce',
        'of',
        'the',
        'वि',
        'बि',
        'सं',
        'ई',
        'गते',
        'गत',
        'साल',
        'मिति',
        'महिना',
    ].map(key),
);

/** Lowercases and drops everything but letters and Devanagari, so `Ashwin`, `ASHWIN` and `ashwin.` match. */
function key(word: string): string {
    return word.toLowerCase().replace(/[^a-zऀ-ॿ]/g, '');
}

function monthTable(names: MonthNames): Map<string, number> {
    const table = new Map<string, number>();
    const add = (month: number, word: string) => table.set(key(word), month);
    if (names === 'bs') {
        MONTH_NAMES.roman.forEach((name, i) => add(i + 1, name));
        MONTH_NAMES.nepali.forEach((name, i) => add(i + 1, name));
        BS_MONTH_ALIASES.forEach((aliases, i) => aliases.forEach((name) => add(i + 1, name)));
    } else {
        FULL_AD_MONTH_NAMES.roman.forEach((name, i) => add(i + 1, name));
        AD_MONTH_NAMES.roman.forEach((name, i) => add(i + 1, name));
        AD_MONTH_NAMES.nepali.forEach((name, i) => add(i + 1, name));
        AD_MONTH_ALIASES.forEach((aliases, i) => aliases.forEach((name) => add(i + 1, name)));
    }
    return table;
}

const MONTH_TABLES: Record<MonthNames, Map<string, number>> = { bs: monthTable('bs'), ad: monthTable('ad') };

/**
 * Finds the month a word names: an exact name or spelling, or the start of only one month's names
 * (at least three letters, so `Shra` is Shrawan but `Ash` could be Ashadh or Ashwin).
 */
export function findMonth(word: string, names: MonthNames): number | null {
    const k = key(word);
    const table = MONTH_TABLES[names];
    const exact = table.get(k);
    if (exact !== undefined) {
        return exact;
    }
    if (k.length < 3) {
        return null;
    }
    const matches = new Set<number>();
    for (const [name, month] of table) {
        if (name.startsWith(k)) {
            matches.add(month);
        }
    }
    return matches.size === 1 ? [...matches][0]! : null;
}

// A time of day after the date: `T10:30`, ` 14:30:00`, ` 2:30 PM`, with an optional time zone.
const TIME = /(?:t|\s+)\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:am|pm)?\s*(?:z|[+-]\d{2}:?\d{2})?\s*$/i;

/** The result of reading date text: the parts, or why they could not be read. */
export type ParseResult = { ok: true; date: Ymd } | { ok: false; reason: string };

function fail(reason: string): ParseResult {
    return { ok: false, reason };
}

/**
 * Reads a year, month and day from text. Understands:
 * - numbers with any separator, year first (`2082-06-16`, `2082/6/16`, `2082.06.16`, `2082 06 16`) or
 *   last (`16/06/2082`, `06-16-2082`) when it is clear which part is the day;
 * - `20820616`;
 * - month names in either order (`16 Ashwin 2082`, `Ashwin 16, 2082`, `2082 Asoj 16`, `१६ असोज २०८२`,
 *   `Oct 2, 2025`, `2-Oct-2025`), with common spellings and unambiguous abbreviations;
 * - Devanagari digits, ordinals (`2nd`), weekdays, `BS`/`AD`/`वि.सं.`, `गते` and `साल`, and a time of day,
 *   all of which are ignored.
 */
export function parseDateText(text: string, names: MonthNames): ParseResult {
    const normalized = latinDigits(text)
        .replace(/[   ]/g, ' ')
        .trim()
        .replace(TIME, '')
        .replace(/(\d)(st|nd|rd|th)\b/gi, '$1')
        // B.S., A.D. and friends, so the dots do not split them into letters.
        .replace(/\b([bvac])\.\s?([sde])\.?(?=\s|,|$)/gi, '$1$2')
        .trim();
    const tokens = normalized.split(/[\s,./\-–—_\\]+/).filter((t) => t !== '');

    if (!/\d/.test(normalized)) {
        return fail(`Could not read "${text.trim()}" as a date.`);
    }

    const numbers: string[] = [];
    let month: number | null = null;
    for (const token of tokens) {
        if (/^\d+$/.test(token)) {
            numbers.push(token);
        } else if (IGNORED.has(key(token)) || key(token) === '') {
            continue;
        } else {
            const found = findMonth(token, names);
            if (found === null) {
                return fail(`"${token}" is not ${names === 'bs' ? 'a BS' : 'an AD'} month name.`);
            }
            if (month !== null) {
                return fail('The text names more than one month.');
            }
            month = found;
        }
    }

    if (month !== null) {
        if (numbers.length !== 2) {
            return fail('Expected a day and a year with the month name.');
        }
        const [a, b] = numbers as [string, string];
        const yearFirst = a.length >= 3 || (b.length < 3 && Number(a) > 31);
        const yearLast = b.length >= 3 || (a.length < 3 && Number(b) > 31);
        if (yearFirst === yearLast) {
            return fail('Could not tell the year from the day. Write the year with four digits.');
        }
        // `2082 Ashwin 16`, `16 Ashwin 2082` and `Ashwin 16, 2082` all work: the year is the long number.
        return yearFirst
            ? { ok: true, date: { year: Number(a), month, day: Number(b) } }
            : { ok: true, date: { year: Number(b), month, day: Number(a) } };
    }

    if (numbers.length === 1 && numbers[0]!.length === 8) {
        const n = numbers[0]!;
        return {
            ok: true,
            date: { year: Number(n.slice(0, 4)), month: Number(n.slice(4, 6)), day: Number(n.slice(6)) },
        };
    }
    if (numbers.length !== 3) {
        return fail('Expected a year, month and day.');
    }
    const [a, b, c] = numbers as [string, string, string];
    if (a.length >= 3) {
        return { ok: true, date: { year: Number(a), month: Number(b), day: Number(c) } };
    }
    if (c.length >= 3) {
        const [x, y] = [Number(a), Number(b)];
        if (x > 12 && y <= 12) {
            return { ok: true, date: { year: Number(c), month: y, day: x } };
        }
        if (y > 12 && x <= 12) {
            return { ok: true, date: { year: Number(c), month: x, day: y } };
        }
        if (x === y) {
            return { ok: true, date: { year: Number(c), month: x, day: x } };
        }
        return fail(`${a}/${b}/${c} could be day/month or month/day. Write it year first, like ${c}-${b}-${a}.`);
    }
    return fail('Write the year with four digits.');
}
