// Entry point of taskpane.js: the converter on the Nepali Date task pane.
import { formatBs, formatNepalSambat, toAd, toBs, toNepalSambat } from '@opensourcenepal/nepali-calendar';
import { adToSerial, convertCells, readAdDate, readBsDate } from './functions.js';

interface ExcelRange {
    values: unknown[][];
    numberFormat: unknown[][];
    address: string;
    rowCount: number;
    columnCount: number;
    isNullObject: boolean;
    getCell(row: number, column: number): ExcelRange;
    getOffsetRange(rowOffset: number, columnOffset: number): ExcelRange;
    getIntersectionOrNullObject(other: ExcelRange): ExcelRange;
    load(properties: string): void;
}

interface ExcelWorksheet {
    getUsedRangeOrNullObject(valuesOnly?: boolean): ExcelRange;
}

declare const Office: { onReady(callback?: () => void): Promise<unknown> };
declare const Excel: {
    run(
        batch: (context: {
            workbook: { getSelectedRange(): ExcelRange; worksheets: { getActiveWorksheet(): ExcelWorksheet } };
            sync(): Promise<void>;
        }) => Promise<void>,
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

/**
 * Converts the selected cells and writes the results into the columns just right of the selection,
 * so the original dates stay. Stops without writing when those cells are not empty.
 */
async function convertSelection(direction: 'toBs' | 'toAd'): Promise<string> {
    let message = '';
    await Excel.run(async (context) => {
        // A whole selected column is a million rows; only convert the part that has data.
        const used = context.workbook.worksheets.getActiveWorksheet().getUsedRangeOrNullObject(true);
        used.load('isNullObject');
        await context.sync();
        const source = used.isNullObject ? null : context.workbook.getSelectedRange().getIntersectionOrNullObject(used);
        source?.load('values,rowCount,columnCount,address,isNullObject');
        await context.sync();
        if (!source || source.isNullObject) {
            message = 'Select the cells with dates first.';
            return;
        }
        const target = source.getOffsetRange(0, source.columnCount);
        target.load('values,address');
        await context.sync();
        if (target.values.some((row) => row.some((cell) => cell !== '' && cell !== null))) {
            message = `${target.address} is not empty. Clear it or select other cells, so nothing is overwritten.`;
            return;
        }
        const result = convertCells(source.values as (string | number | boolean | null)[][], direction);
        target.numberFormat = result.numberFormat;
        target.values = result.values;
        await context.sync();
        const failed = result.failed ? ` ${result.failed} could not be read and were left blank.` : '';
        message = `Converted ${result.converted} ${result.converted === 1 ? 'date' : 'dates'} into ${target.address}.${failed}`;
    });
    return message;
}

function bindSelectionButton(id: string, direction: 'toBs' | 'toAd'): void {
    const output = element<HTMLOutputElement>('selection-result');
    element<HTMLButtonElement>(id).addEventListener('click', () => {
        output.classList.remove('error');
        output.textContent = 'Converting…';
        convertSelection(direction).then(
            (message) => {
                output.textContent = message;
            },
            (error: Error) => {
                output.textContent = error.message;
                output.classList.add('error');
            },
        );
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
    bindSelectionButton('selection-to-bs', 'toBs');
    bindSelectionButton('selection-to-ad', 'toAd');
    bindConverter('ad', (text) => {
        const bs = toBs(readAdDate(text));
        const iso = formatBs(bs, 'yyyy-MM-dd');
        return {
            text: `${formatBs(bs, 'F')}\n${formatBs(bs, 'F', 'nepali')}\n${formatNepalSambat(toNepalSambat(bs))}`,
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
