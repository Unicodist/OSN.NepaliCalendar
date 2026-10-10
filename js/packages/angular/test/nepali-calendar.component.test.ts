import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type BsDate, NepaliCalendarComponent, type Script } from '../src/public-api';

const today: BsDate = { year: 2081, month: 4, day: 15 };

@Component({
    imports: [NepaliCalendarComponent],
    template: `
        <osn-nepali-calendar
            [today]="today"
            [(value)]="value"
            [(script)]="script"
            [initialMonth]="initialMonth"
            [showAdDates]="showAdDates"
            [showScriptToggle]="showScriptToggle"
            [showTodayButton]="showTodayButton"
            (dateSelect)="picked = $event"
        />
    `,
})
class HostComponent {
    today = today;
    value: BsDate | null = null;
    script: Script = 'nepali';
    initialMonth: { year: number; month: number } | null = null;
    showAdDates = true;
    showScriptToggle = true;
    showTodayButton = true;
    picked: unknown = null;
}

@Component({
    imports: [NepaliCalendarComponent, ReactiveFormsModule],
    template: `<osn-nepali-calendar [today]="today" script="roman" [formControl]="control" />`,
})
class FormHostComponent {
    today = today;
    control = new FormControl<BsDate | null>({ year: 2082, month: 1, day: 1 });
}

beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [FormsModule] });
});

afterEach(() => {
    TestBed.resetTestingModule();
});

function shownMonth(root: ParentNode = document) {
    const pick = (cls: string) =>
        root.querySelector<HTMLSelectElement>(`.osn-cal__select--${cls}`)?.selectedOptions[0]?.text.trim();
    return `${pick('month')} ${pick('year')}`;
}

async function setup(configure: (host: HostComponent) => void = () => {}) {
    const fixture = TestBed.createComponent(HostComponent);
    configure(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const stable = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
    };
    const button = (name: string) => {
        const match = [...root.querySelectorAll('button')].find(
            (b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name,
        );
        if (!match) throw new Error(`No button named ${name}`);
        return match;
    };
    const click = async (name: string) => {
        button(name).click();
        await stable();
    };
    const title = () => shownMonth(root);
    return { fixture, host: fixture.componentInstance, root, button, click, title, stable };
}

describe('NepaliCalendarComponent', () => {
    it("shows today's month in Nepali with AD dates alongside", async () => {
        const { root, button, title } = await setup();

        expect(title()).toBe('साउन २०८१');
        expect(root.querySelector('.osn-cal__title-ad')?.textContent).toBe('जुलाई/अगस्ट २०२४');
        const todayButton = button('मङ्गलबार, १५ साउन २०८१');
        expect(todayButton.getAttribute('aria-current')).toBe('date');
        expect(todayButton.querySelector('.osn-cal__day-ad')?.textContent).toBe('३०');
        expect(root.querySelectorAll('.osn-cal__day')).toHaveLength(32);
    });

    it('switches to Roman script with the toggle', async () => {
        const { host, root, click, button, title } = await setup();

        await click('Show in Roman script');

        expect(title()).toBe('Shrawan 2081');
        expect(root.querySelector('.osn-cal__title-ad')?.textContent).toBe('Jul/Aug 2024');
        expect(button('Mangalbar, 15 Shrawan 2081')).toBeTruthy();
        expect(host.script).toBe('roman');
    });

    it('navigates between months and back to today', async () => {
        const { click, title, root } = await setup((h) => (h.script = 'roman'));

        await click('Next month');
        expect(title()).toBe('Bhadra 2081');

        for (let i = 0; i < 5; i++) {
            await click('Next month');
        }
        expect(title()).toBe('Magh 2081');

        await click('Previous month');
        expect(title()).toBe('Poush 2081');
        expect(root.querySelector('.osn-cal__title-ad')?.textContent).toBe('Dec 2024/Jan 2025');

        await click('Today');
        expect(title()).toBe('Shrawan 2081');
    });

    it('jumps straight to a year and month with the pickers', async () => {
        const { root, title, stable, button } = await setup((h) => (h.script = 'roman'));
        const select = (name: string) => root.querySelector<HTMLSelectElement>(`select[aria-label="${name}"]`)!;
        const choose = async (name: string, value: string) => {
            select(name).value = value;
            select(name).dispatchEvent(new Event('change'));
            await stable();
        };

        await choose('Year', '2045');
        expect(title()).toBe('Shrawan 2045');

        await choose('Month', '12');
        expect(title()).toBe('Chaitra 2045');
        expect(
            [...root.querySelectorAll('.osn-cal__day')].some((b) =>
                b.getAttribute('aria-label')?.endsWith(', 1 Chaitra 2045'),
            ),
        ).toBe(true);

        expect(select('Year').options).toHaveLength(121);
        expect(select('Year').options[0]?.value).toBe('1970');
        expect(select('Year').options[120]?.value).toBe('2090');

        // Month navigation keeps the pickers in step.
        await choose('Year', '2090');
        expect(button('Next month').disabled).toBe(true);
        button('Previous month').click();
        await stable();
        expect(title()).toBe('Falgun 2090');
    });

    it('binds the picked date two ways and reports its AD date', async () => {
        const { host, click, button } = await setup((h) => (h.script = 'roman'));

        await click('Budhabar, 2 Shrawan 2081');

        expect(host.value).toEqual({ year: 2081, month: 4, day: 2 });
        expect(host.picked).toEqual({ bs: { year: 2081, month: 4, day: 2 }, ad: { year: 2024, month: 7, day: 17 } });
        expect(button('Budhabar, 2 Shrawan 2081').getAttribute('aria-pressed')).toBe('true');
    });

    it('opens on the month of a bound value', async () => {
        const { title, button } = await setup((h) => {
            h.script = 'roman';
            h.value = { year: 2082, month: 1, day: 1 };
        });

        expect(title()).toBe('Baisakh 2082');
        expect(button('Sombar, 1 Baisakh 2082').getAttribute('aria-pressed')).toBe('true');
    });

    it('moves focus with the arrow keys, across months', async () => {
        const { root, button, title } = await setup((h) => {
            h.script = 'roman';
            h.today = { year: 2081, month: 4, day: 32 };
        });

        const start = button('Shukrabar, 32 Shrawan 2081');
        start.focus();
        start.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

        expect(title()).toBe('Bhadra 2081');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Shanibar, 1 Bhadra 2081');

        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
        expect(title()).toBe('Shrawan 2081');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Shanibar, 26 Shrawan 2081');
        expect(root.contains(document.activeElement)).toBe(true);
    });

    it('stops at the ends of the supported range', async () => {
        const { button } = await setup((h) => {
            h.script = 'roman';
            h.initialMonth = { year: 1970, month: 1 };
        });

        expect(button('Previous month').disabled).toBe(true);
    });

    it('can hide AD dates, the toggle and the today button', async () => {
        const { root } = await setup((h) => {
            h.showAdDates = false;
            h.showScriptToggle = false;
            h.showTodayButton = false;
        });

        expect(root.querySelector('.osn-cal__day-ad')).toBeNull();
        expect(root.querySelector('.osn-cal__title-ad')).toBeNull();
        expect(root.querySelector('.osn-cal__toolbar')).toBeNull();
    });

    it('works as a form control', async () => {
        const fixture = TestBed.createComponent(FormHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement;
        const find = (label: string) => root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

        expect(shownMonth(root)).toBe('Baisakh 2082');
        find('Shukrabar, 5 Baisakh 2082').click();
        expect(fixture.componentInstance.control.value).toEqual({ year: 2082, month: 1, day: 5 });

        fixture.componentInstance.control.disable();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(find('Shukrabar, 5 Baisakh 2082').disabled).toBe(true);
    });
});
