import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type BsDate, NepaliCalendar } from '../src/index.js';

const today: BsDate = { year: 2081, month: 4, day: 15 };

afterEach(cleanup);

function shownMonth(root: ParentNode = document) {
    const pick = (cls: string) =>
        root.querySelector<HTMLSelectElement>(`.osn-cal__select--${cls}`)?.selectedOptions[0]?.text.trim();
    return `${pick('month')} ${pick('year')}`;
}

function title() {
    return shownMonth();
}

describe('NepaliCalendar', () => {
    it("shows today's month in Nepali with AD dates alongside", () => {
        render(<NepaliCalendar today={today} />);

        expect(title()).toBe('साउन २०८१');
        expect(screen.getByText('जुलाई/अगस्ट २०२४')).toBeTruthy();
        const todayButton = screen.getByRole('button', { name: 'मङ्गलबार, १५ साउन २०८१' });
        expect(todayButton.getAttribute('aria-current')).toBe('date');
        // BS 2081-04-15 is AD 2024-07-30.
        expect(todayButton.querySelector('.osn-cal__day-ad')?.textContent).toBe('३०');
        expect(document.querySelectorAll('.osn-cal__day')).toHaveLength(32);
    });

    it('switches to Roman script with the toggle', async () => {
        const onScriptChange = vi.fn();
        render(<NepaliCalendar today={today} onScriptChange={onScriptChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Show in Roman script' }));

        expect(title()).toBe('Shrawan 2081');
        expect(screen.getByText('Jul/Aug 2024')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Mangalbar, 15 Shrawan 2081' })).toBeTruthy();
        expect(onScriptChange).toHaveBeenCalledWith('roman');
    });

    it('navigates between months and back to today', async () => {
        render(<NepaliCalendar today={today} defaultScript="roman" />);

        await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
        expect(title()).toBe('Bhadra 2081');

        for (let i = 0; i < 5; i++) {
            await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
        }
        expect(title()).toBe('Magh 2081');

        await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
        expect(title()).toBe('Poush 2081');
        expect(screen.getByText('Dec 2024/Jan 2025')).toBeTruthy();

        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        expect(title()).toBe('Shrawan 2081');
    });

    it('jumps straight to a year and month with the pickers', async () => {
        render(<NepaliCalendar today={today} defaultScript="roman" />);

        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2045');
        expect(title()).toBe('Shrawan 2045');

        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'Chaitra');
        expect(title()).toBe('Chaitra 2045');
        expect(screen.getByRole('button', { name: /, 1 Chaitra 2045$/ })).toBeTruthy();

        const years = screen.getByRole('combobox', { name: 'Year' }) as HTMLSelectElement;
        expect(years.options).toHaveLength(121);
        expect(years.options[0]?.value).toBe('1970');
        expect(years.options[120]?.value).toBe('2090');
    });

    it('shows the pickers in Nepali script', () => {
        render(<NepaliCalendar today={today} />);

        expect(title()).toBe('साउन २०८१');
        expect(screen.getByRole('combobox', { name: 'साल' })).toBeTruthy();
    });

    it('reports the picked BS and AD dates', async () => {
        const onChange = vi.fn();
        render(<NepaliCalendar today={today} defaultScript="roman" onChange={onChange} />);

        const day = screen.getByRole('button', { name: 'Budhabar, 2 Shrawan 2081' });
        await userEvent.click(day);

        expect(onChange).toHaveBeenCalledWith({ year: 2081, month: 4, day: 2 }, { year: 2024, month: 7, day: 17 });
        expect(day.getAttribute('aria-pressed')).toBe('true');
    });

    it('follows a controlled value', async () => {
        function Controlled() {
            const [value, setValue] = useState<BsDate | null>({ year: 2082, month: 1, day: 1 });
            return (
                <>
                    <NepaliCalendar today={today} defaultScript="roman" value={value} onChange={setValue} />
                    <output>{value ? `${value.year}-${value.month}-${value.day}` : 'none'}</output>
                </>
            );
        }
        render(<Controlled />);

        expect(title()).toBe('Baisakh 2082');
        expect(screen.getByRole('button', { name: 'Sombar, 1 Baisakh 2082' }).getAttribute('aria-pressed')).toBe(
            'true',
        );

        await userEvent.click(screen.getByRole('button', { name: 'Shukrabar, 5 Baisakh 2082' }));
        expect(screen.getByRole('status').textContent).toBe('2082-1-5');
    });

    it('moves focus with the arrow keys, across months', async () => {
        render(<NepaliCalendar today={{ year: 2081, month: 4, day: 32 }} defaultScript="roman" />);

        screen.getByRole('button', { name: 'Shukrabar, 32 Shrawan 2081' }).focus();
        await userEvent.keyboard('{ArrowRight}');

        expect(title()).toBe('Bhadra 2081');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Shanibar, 1 Bhadra 2081');

        await userEvent.keyboard('{ArrowUp}');
        expect(title()).toBe('Shrawan 2081');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Shanibar, 26 Shrawan 2081');
    });

    it('stops at the ends of the supported range', () => {
        render(<NepaliCalendar today={today} initialMonth={{ year: 1970, month: 1 }} defaultScript="roman" />);

        expect((screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('can hide AD dates, the toggle and the today button', () => {
        render(<NepaliCalendar today={today} showAdDates={false} showScriptToggle={false} showTodayButton={false} />);

        expect(document.querySelector('.osn-cal__day-ad')).toBeNull();
        expect(document.querySelector('.osn-cal__title-ad')).toBeNull();
        expect(document.querySelector('.osn-cal__toolbar')).toBeNull();
    });

    describe('min and max', () => {
        const min: BsDate = { year: 2081, month: 4, day: 10 };
        const max: BsDate = { year: 2081, month: 6, day: 5 };

        it('disables days outside the range and does not pick them', async () => {
            const onChange = vi.fn();
            render(<NepaliCalendar today={today} defaultScript="roman" min={min} max={max} onChange={onChange} />);

            const before = screen.getByRole('button', { name: /, 9 Shrawan 2081$/ }) as HTMLButtonElement;
            expect(before.disabled).toBe(true);
            expect(before.classList.contains('osn-cal__day--disabled')).toBe(true);
            await userEvent.click(before);
            expect(onChange).not.toHaveBeenCalled();

            await userEvent.click(screen.getByRole('button', { name: /, 10 Shrawan 2081$/ }));
            expect(onChange).toHaveBeenCalledWith(min, { year: 2024, month: 7, day: 25 });
        });

        it('stops month navigation and limits the pickers to the range', async () => {
            render(<NepaliCalendar today={today} defaultScript="roman" min={min} max={max} />);

            const previous = screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement;
            expect(previous.disabled).toBe(true);
            await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
            await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
            expect(title()).toBe('Ashwin 2081');
            expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(true);

            const years = screen.getByRole('combobox', { name: 'Year' }) as HTMLSelectElement;
            expect([...years.options].map((o) => o.value)).toEqual(['2081']);
            const months = screen.getByRole('combobox', { name: 'Month' }) as HTMLSelectElement;
            expect([...months.options].filter((o) => !o.disabled).map((o) => o.text)).toEqual([
                'Shrawan',
                'Bhadra',
                'Ashwin',
            ]);
        });

        it('opens on the nearest month in range and keeps arrow keys inside it', async () => {
            render(<NepaliCalendar today={{ year: 2081, month: 1, day: 1 }} defaultScript="roman" min={min} />);
            expect(title()).toBe('Shrawan 2081');

            const first = screen.getByRole('button', { name: /, 10 Shrawan 2081$/ });
            expect(first.getAttribute('tabindex')).toBe('0');
            first.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement?.getAttribute('data-date')).toBe('2081-04-10');

            await userEvent.click(screen.getByRole('button', { name: 'Today' }));
            expect(title()).toBe('Shrawan 2081');
        });
    });
});
