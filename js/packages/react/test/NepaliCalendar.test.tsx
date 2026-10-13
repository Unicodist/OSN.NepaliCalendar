import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toNepalSambat } from '@opensourcenepal/nepali-calendar';
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

    it('shows a Nepal Sambat month with tithis and BS dates alongside', () => {
        render(<NepaliCalendar today={{ year: 2083, month: 7, day: 24 }} calendar="ns" />);

        // Kartik 24, 2083 (Mha Puja) is the Nepal Sambat new year.
        expect(title()).toBe('कछला ११४७');
        expect(screen.getByText('कात्तिक/मंसिर २०८३')).toBeTruthy();
        const newYear = screen.getByRole('button', { name: 'मङ्गलबार, ने.सं. ११४७ कछलाथ्व पारू' });
        expect(newYear.getAttribute('title')).toBe('मङ्गलबार, ने.सं. ११४७ कछलाथ्व पारू');
        expect(newYear.getAttribute('aria-current')).toBe('date');
        expect(newYear.querySelector('.osn-cal__day-bs')?.textContent).toBe('१');
        expect(newYear.querySelector('.osn-cal__day-ad')?.textContent).toBe('२४');
    });

    it('reports the Nepal Sambat date of a picked day', async () => {
        const onChange = vi.fn();
        render(
            <NepaliCalendar
                today={{ year: 2083, month: 7, day: 24 }}
                defaultScript="roman"
                calendar="ns"
                onChange={onChange}
            />,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Mangalbar, NS 1147 Kachhala Thwa Paru' }));
        expect(onChange).toHaveBeenCalledWith(
            { year: 2083, month: 7, day: 24 },
            { year: 2026, month: 11, day: 10 },
            expect.objectContaining({ year: 1147, month: 1, isLeapMonth: false, paksha: 'thwa', tithi: 1 }),
        );
    });

    it('lists a Nepal Sambat leap month in the month picker', async () => {
        render(<NepaliCalendar today={{ year: 2083, month: 2, day: 10 }} defaultScript="roman" calendar="ns" />);

        expect(title()).toBe('Anala (Tachhala) 1146');
        const months = screen.getByRole('combobox', { name: 'Month' }) as HTMLSelectElement;
        expect([...months.options].map((o) => o.text).slice(6, 9)).toEqual([
            'Bachhala',
            'Anala (Tachhala)',
            'Tachhala',
        ]);

        await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
        expect(title()).toBe('Tachhala 1146');

        // The year picker keeps the month by name, not by place.
        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '1147');
        expect(title()).toBe('Tachhala 1147');
        // Punhi spans two sunrises this month, so two days are marked.
        expect(document.querySelectorAll('.osn-cal__day--punhi')).toHaveLength(2);
        expect(document.querySelectorAll('.osn-cal__day--amai')).toHaveLength(1);
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

        expect(onChange).toHaveBeenCalledWith(
            { year: 2081, month: 4, day: 2 },
            { year: 2024, month: 7, day: 17 },
            toNepalSambat({ year: 2081, month: 4, day: 2 }),
        );
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

    it('can hide AD dates, the toggles and the today button', () => {
        render(
            <NepaliCalendar
                today={today}
                showAdDates={false}
                showScriptToggle={false}
                showCalendarToggle={false}
                showTodayButton={false}
            />,
        );

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
            expect(onChange).toHaveBeenCalledWith(min, { year: 2024, month: 7, day: 25 }, toNepalSambat(min));
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

    describe('calendars', () => {
        it('switches to an AD month with BS dates alongside, and back', async () => {
            const onCalendarChange = vi.fn();
            render(<NepaliCalendar today={today} defaultScript="roman" onCalendarChange={onCalendarChange} />);

            await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Calendar' }), 'ad');
            expect(onCalendarChange).toHaveBeenCalledWith('ad');
            // Shrawan 2081 is mostly in July 2024, but the middle of the month (15 Shrawan) is 30 July.
            expect(title()).toBe('July 2024');
            expect(screen.getByText('Ashadh/Shrawan 2081')).toBeTruthy();
            const day = screen.getByRole('button', { name: 'Mangalbar, 30 July 2024' });
            expect(day.querySelector('.osn-cal__day-bs')?.textContent).toBe('30');
            expect(day.querySelector('.osn-cal__day-ad')?.textContent).toBe('15');
            expect(day.getAttribute('aria-current')).toBe('date');
            expect(document.querySelectorAll('.osn-cal__day')).toHaveLength(31);

            await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
            expect(title()).toBe('August 2024');

            await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Calendar' }), 'bs');
            expect(title()).toBe('Shrawan 2081');
        });

        it('picks days and keeps the selection in view when switching', async () => {
            const onChange = vi.fn();
            render(
                <NepaliCalendar
                    today={today}
                    defaultScript="roman"
                    defaultCalendar="ad"
                    defaultValue={{ year: 2081, month: 5, day: 1 }}
                    onChange={onChange}
                />,
            );
            // BS 2081-05-01 is 17 August 2024.
            expect(title()).toBe('August 2024');

            await userEvent.click(screen.getByRole('button', { name: /, 20 August 2024$/ }));
            expect(onChange).toHaveBeenCalledWith(
                { year: 2081, month: 5, day: 4 },
                { year: 2024, month: 8, day: 20 },
                toNepalSambat({ year: 2081, month: 5, day: 4 }),
            );

            await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Calendar' }), 'bs');
            expect(title()).toBe('Bhadra 2081');
        });

        it('limits the AD pickers and keyboard to min and max', async () => {
            render(
                <NepaliCalendar
                    today={today}
                    defaultScript="roman"
                    calendar="ad"
                    min={{ year: 2081, month: 4, day: 10 }}
                    max={{ year: 2081, month: 9, day: 1 }}
                />,
            );
            const years = screen.getByRole('combobox', { name: 'Year' }) as HTMLSelectElement;
            expect([...years.options].map((o) => o.value)).toEqual(['2024']);
            const months = screen.getByRole('combobox', { name: 'Month' }) as HTMLSelectElement;
            expect([...months.options].filter((o) => !o.disabled).map((o) => o.text)).toEqual([
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ]);
            // BS 2081-04-10 is 25 July 2024.
            const first = screen.getByRole('button', { name: /, 25 July 2024$/ });
            expect((screen.getByRole('button', { name: /, 24 July 2024$/ }) as HTMLButtonElement).disabled).toBe(true);
            first.focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(document.activeElement?.getAttribute('data-date')).toBe('2081-04-10');
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(document.activeElement?.getAttribute('aria-label')).toBe('Bihibar, 8 August 2024');
            expect(title()).toBe('August 2024');
        });

        it('offers every calendar in the dropdown, named in the shown script', () => {
            render(<NepaliCalendar today={today} />);
            const picker = screen.getByRole('combobox', { name: 'पात्रो' }) as HTMLSelectElement;
            expect([...picker.options].map((o) => [o.value, o.text])).toEqual([
                ['bs', 'विक्रम संवत्'],
                ['ad', 'ईस्वी संवत्'],
                ['ns', 'नेपाल संवत्'],
            ]);
            expect(picker.value).toBe('bs');
        });

        it('offers only the calendars it is given', async () => {
            const { unmount } = render(<NepaliCalendar today={today} defaultScript="roman" calendars={['bs', 'ns']} />);
            const picker = screen.getByRole('combobox', { name: 'Calendar' }) as HTMLSelectElement;
            expect([...picker.options].map((o) => o.value)).toEqual(['bs', 'ns']);

            await userEvent.selectOptions(picker, 'ns');
            // The middle of Shrawan 2081 (15 Shrawan) is in Dilla 1144.
            expect(title()).toBe('Dilla 1144');
            unmount();

            render(<NepaliCalendar today={today} calendars={['bs']} />);
            expect(screen.queryByRole('combobox', { name: 'पात्रो' })).toBeNull();
        });
    });
});
