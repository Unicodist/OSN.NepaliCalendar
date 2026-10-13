// Entry point of taskpane.js: the converter on the Nepali Date task pane.
import { formatBs, toAd, toBs } from '@opensourcenepal/nepali-calendar';
import { adToSerial, readAdDate, readBsDate } from './functions.js';

interface ExcelRange {
    values: unknown[][];
    numberFormat: unknown[][];
    getCell(row: number, column: number): ExcelRange;
}

declare const Office: { onReady(callback?: () => void): Promise<unknown> };
declare const Excel: {
    run(
        batch: (context: { workbook: { getSelectedRange(): ExcelRange }; sync(): Promise<void> }) => Promise<void>,
    ): Promise<void>;
};

function element<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}

async function insert(value: string | number, numberFormat: string): Promise<void> {
    await Excel.run(async (context) => {
        const cell = context.workbook.getSelectedRange().getCell(0, 0);
        // Set the format first, so Excel keeps BS text like 2082-06-16 as text instead of reading it as a date.
        cell.numberFormat = [[numberFormat]];
        cell.values = [[value]];
        await context.sync();
    });
}

function bindConverter(
    prefix: 'ad' | 'bs',
    convert: (text: string) => { text: string; insert: () => Promise<void> },
): void {
    const input = element<HTMLInputElement>(`${prefix}-input`);
    const output = element<HTMLOutputElement>(`${prefix}-result`);
    const button = element<HTMLButtonElement>(`${prefix}-insert`);
    let pending: (() => Promise<void>) | null = null;

    const update = () => {
        pending = null;
        output.classList.remove('error');
        output.textContent = '';
        if (input.value.trim() !== '') {
            try {
                const result = convert(input.value);
                output.textContent = result.text;
                pending = result.insert;
            } catch (error) {
                output.textContent = (error as Error).message;
                output.classList.add('error');
            }
        }
        button.disabled = pending === null;
    };

    input.addEventListener('input', update);
    button.addEventListener('click', () => {
        pending?.().catch((error: Error) => {
            output.textContent = error.message;
            output.classList.add('error');
        });
    });
    update();
}

void Office.onReady(() => {
    bindConverter('ad', (text) => {
        const bs = toBs(readAdDate(text));
        const iso = formatBs(bs, 'yyyy-MM-dd');
        return {
            text: `${formatBs(bs, 'F')}\n${formatBs(bs, 'F', 'nepali')}`,
            insert: () => insert(iso, '@'),
        };
    });
    bindConverter('bs', (text) => {
        const bs = readBsDate(text);
        const ad = toAd(bs);
        const date = new Date(Date.UTC(ad.year, ad.month - 1, ad.day));
        return {
            text: `${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}\n${formatBs(bs, 'F')}`,
            insert: () => insert(adToSerial(ad), 'yyyy-mm-dd'),
        };
    });
});
