/** The script used to show names and digits: Roman (transliterated, Latin digits) or Nepali (Devanagari). */
export type Script = 'roman' | 'nepali';

/** BS month names, Baisakh first. */
export const MONTH_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: [
        'Baisakh',
        'Jestha',
        'Ashadh',
        'Shrawan',
        'Bhadra',
        'Ashwin',
        'Kartik',
        'Mangsir',
        'Poush',
        'Magh',
        'Falgun',
        'Chaitra',
    ],
    nepali: ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'],
};

/** Day names, Sunday (आइतबार) first. */
export const DAY_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: ['Aaitabar', 'Sombar', 'Mangalbar', 'Budhabar', 'Bihibar', 'Shukrabar', 'Shanibar'],
    nepali: ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'],
};

/** Short day names, Sunday first. */
export const ABBREVIATED_DAY_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: ['Aaita', 'Som', 'Mangal', 'Budha', 'Bihi', 'Shukra', 'Shani'],
    nepali: ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'],
};

/** Gregorian month names, January first, as used alongside BS dates. */
export const AD_MONTH_NAMES: Readonly<Record<Script, readonly string[]>> = {
    roman: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    nepali: [
        'जनवरी',
        'फेब्रुअरी',
        'मार्च',
        'अप्रिल',
        'मे',
        'जुन',
        'जुलाई',
        'अगस्ट',
        'सेप्टेम्बर',
        'अक्टोबर',
        'नोभेम्बर',
        'डिसेम्बर',
    ],
};

const NEPALI_ZERO = 0x0966;

/** Returns the name of a BS month (1-12). */
export function monthName(month: number, script: Script = 'roman'): string {
    const name = MONTH_NAMES[script][month - 1];
    if (name === undefined) {
        throw new RangeError('Month must be between 1 and 12.');
    }
    return name;
}

/** Writes a number's digits in the given script, optionally zero-padded to `minDigits`. */
export function toDigits(value: number, script: Script = 'roman', minDigits = 1): string {
    const digits = String(value).padStart(minDigits, '0');
    return script === 'nepali'
        ? digits.replace(/[0-9]/g, (digit) => String.fromCharCode(NEPALI_ZERO + Number(digit)))
        : digits;
}
