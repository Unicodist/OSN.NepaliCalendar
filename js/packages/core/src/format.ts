import { type BsDate, dayOfWeek, isValidBsDate } from './calendar.js';
import { ABBREVIATED_DAY_NAMES, DAY_NAMES, MONTH_NAMES, type Script, toDigits } from './names.js';

const STANDARD_FORMATS: Readonly<Record<string, string>> = {
    d: 'yyyy-MM-dd',
    D: 'd MMMM yyyy',
    F: 'dddd, d MMMM yyyy',
    M: 'd MMMM',
    m: 'd MMMM',
    Y: 'MMMM yyyy',
    y: 'MMMM yyyy',
};

/**
 * Formats a BS date with the same format strings as the .NET `NepaliDate.ToString`.
 *
 * Standard formats: `d` (`2081-04-15`), `D` (`15 Shrawan 2081`), `F` (`Mangalbar, 15 Shrawan 2081`),
 * `M` (`15 Shrawan`) and `Y` (`Shrawan 2081`). Custom formats use `yyyy`, `yy`, `MMMM`, `MM`, `M`,
 * `dddd`, `ddd`, `dd` and `d`; quote literal text or escape it with `\`.
 *
 * @throws RangeError when the date does not exist; Error when the format is invalid.
 */
export function formatBs(date: BsDate, format = 'd', script: Script = 'roman'): string {
    if (!isValidBsDate(date.year, date.month, date.day)) {
        throw new RangeError(`${date.year}-${date.month}-${date.day} is not a valid BS date.`);
    }

    let pattern = format || 'd';
    if (pattern.length === 1) {
        const expanded = STANDARD_FORMATS[pattern];
        if (expanded === undefined) {
            throw new Error(`'${pattern}' is not a valid standard format. Use d, D, F, M or Y, or a custom format.`);
        }
        pattern = expanded;
    }

    let result = '';
    let i = pattern.length > 1 && pattern[0] === '%' ? 1 : 0;
    while (i < pattern.length) {
        const c = pattern[i]!;
        if (c === 'y' || c === 'M' || c === 'd') {
            let count = 1;
            while (pattern[i + count] === c) {
                count++;
            }
            if (c === 'y') {
                result += toDigits(count === 2 ? date.year % 100 : date.year, script, count);
            } else if (c === 'M') {
                result += count >= 3 ? MONTH_NAMES[script][date.month - 1] : toDigits(date.month, script, count);
            } else if (count >= 4) {
                result += DAY_NAMES[script][dayOfWeek(date)];
            } else if (count === 3) {
                result += ABBREVIATED_DAY_NAMES[script][dayOfWeek(date)];
            } else {
                result += toDigits(date.day, script, count);
            }
            i += count;
        } else if (c === "'" || c === '"') {
            const end = pattern.indexOf(c, i + 1);
            if (end < 0) {
                throw new Error(`Format string has an unterminated quoted string starting at position ${i}.`);
            }
            result += pattern.slice(i + 1, end);
            i = end + 1;
        } else if (c === '\\') {
            if (i + 1 >= pattern.length) {
                throw new Error('Format string ends with an escape character.');
            }
            result += pattern[i + 1];
            i += 2;
        } else {
            result += c;
            i++;
        }
    }
    return result;
}
