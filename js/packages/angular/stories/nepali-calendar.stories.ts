import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@analogjs/storybook-angular';
import { argsToTemplate } from '@analogjs/storybook-angular';
import { toNepalSambat } from '@opensourcenepal/nepali-calendar';
import { fn } from 'storybook/test';
import { type BsDate, NepaliCalendarComponent, type NepalSambatDate, formatNepalSambat } from '../src/public-api';

const meta: Meta<NepaliCalendarComponent> = {
    title: 'NepaliCalendar',
    component: NepaliCalendarComponent,
    args: {
        script: 'nepali',
        calendar: 'bs',
        pick: 'day',
        showCalendarToggle: true,
        showAdDates: true,
        showScriptToggle: true,
        showTodayButton: true,
        valueChange: fn(),
        scriptChange: fn(),
        calendarChange: fn(),
        dateSelect: fn(),
    },
    argTypes: {
        script: { control: 'inline-radio', options: ['nepali', 'roman'] },
        calendar: { control: 'inline-radio', options: ['bs', 'ad', 'ns'] },
        calendars: { control: 'check', options: ['bs', 'ad', 'ns'] },
        pick: { control: 'inline-radio', options: ['day', 'month', 'year'] },
    },
};

export default meta;
type Story = StoryObj<NepaliCalendarComponent>;

/** Today's month in Nepali script, with AD dates under each day. */
export const Default: Story = {};

/** `pick="month"`: the value is the first day of the picked month. The arrows move a year. */
export const MonthPicker: Story = {
    args: { script: 'roman', pick: 'month' },
};

/** `pick="year"`: picks a year from a page of twelve; the value is the first day of that year. */
export const YearPicker: Story = {
    args: { script: 'roman', pick: 'year' },
};

/** Months follow the shown calendar, so in Nepal Sambat the user picks a lunar month. */
export const NepalSambatMonthPicker: Story = {
    args: { script: 'roman', pick: 'month', calendar: 'ns' },
};

/** Roman (transliterated) month and day names with Latin digits. */
export const Roman: Story = {
    args: { script: 'roman' },
};

/** A Gregorian (AD) month with the BS date under each day. The calendar dropdown switches back. */
export const AdCalendar: Story = {
    args: { script: 'roman', calendar: 'ad' },
};

/** Only BS and Nepal Sambat in the calendar dropdown. */
export const ChosenCalendars: Story = {
    args: { script: 'roman', calendars: ['bs', 'ns'] },
};

/** Opens on the month of a bound date. */
export const WithSelectedDate: Story = {
    args: { script: 'roman', value: { year: 2082, month: 6, day: 16 } },
};

/** Opens on a chosen month; use the year and month pickers to jump anywhere from BS 1970 to 2090. */
export const InitialMonth: Story = {
    args: { script: 'roman', initialMonth: { year: 2045, month: 12 } },
};

/** The first supported month: the previous-month button is disabled. */
export const StartOfRange: Story = {
    args: { script: 'roman', initialMonth: { year: 1970, month: 1 } },
};

/**
 * Only 10 Ashwin to 20 Mangsir 2082 can be picked: other days are disabled, and the arrows and
 * pickers stop at the range.
 */
export const MinAndMax: Story = {
    args: {
        script: 'roman',
        min: { year: 2082, month: 6, day: 10 },
        max: { year: 2082, month: 8, day: 20 },
    },
};

/** BS dates only: no AD dates, script toggle or today button. */
export const Minimal: Story = {
    args: { showAdDates: false, showScriptToggle: false, showCalendarToggle: false, showTodayButton: false },
};

@Component({
    selector: 'story-two-way',
    imports: [NepaliCalendarComponent],
    template: `
        <osn-calendar [(value)]="value" [(script)]="script" />
        <p style="font-family: monospace">
            value: {{ value() ? value()!.year + '-' + value()!.month + '-' + value()!.day : 'none' }} · script:
            {{ script() }}
        </p>
    `,
})
class TwoWayBindingComponent {
    readonly value = signal<BsDate | null>({ year: 2083, month: 1, day: 1 });
    readonly script = signal<'nepali' | 'roman'>('nepali');
}

/** `[(value)]` and `[(script)]` bound to signals, mirrored below the calendar. */
export const TwoWayBinding: Story = {
    parameters: { controls: { disable: true } },
    render: () => ({
        moduleMetadata: { imports: [TwoWayBindingComponent] },
        template: '<story-two-way />',
    }),
};

@Component({
    selector: 'story-form-control',
    imports: [NepaliCalendarComponent, ReactiveFormsModule],
    template: `
        <osn-calendar script="roman" [formControl]="control" />
        <p style="font-family: monospace">
            control.value:
            {{ control.value ? control.value.year + '-' + control.value.month + '-' + control.value.day : 'none' }}
            <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
                {{ control.disabled ? 'Enable' : 'Disable' }}
            </button>
        </p>
    `,
})
class FormControlComponent {
    readonly control = new FormControl<BsDate | null>({ year: 2082, month: 1, day: 1 });
}

/** Used as a reactive form control, which can be disabled. */
export const FormControlBinding: Story = {
    parameters: { controls: { disable: true } },
    render: () => ({
        moduleMetadata: { imports: [FormControlComponent] },
        template: '<story-form-control />',
    }),
};

@Component({
    selector: 'story-nepal-sambat',
    imports: [NepaliCalendarComponent],
    template: `
        <osn-calendar calendar="ns" script="roman" [(value)]="value" (dateSelect)="ns.set($event.ns)" />
        <p style="font-family: monospace">
            value: {{ value() ? value()!.year + '-' + value()!.month + '-' + value()!.day : 'none' }} · NS:
            {{ format(ns()) }}
        </p>
    `,
})
class NepalSambatComponent {
    readonly value = signal<BsDate | null>({ year: 2083, month: 7, day: 24 });
    readonly ns = signal<NepalSambatDate>(toNepalSambat({ year: 2083, month: 7, day: 24 }));
    protected readonly format = (date: NepalSambatDate) => formatNepalSambat(date);
}

/**
 * A Nepal Sambat lunar month: each day shows its tithi, with the BS date under it and the full NS date in
 * its tooltip. `value` stays a BS date, since two days can share one NS date; `dateSelect` also emits the
 * NS date, mirrored below the calendar.
 */
export const NepalSambat: Story = {
    parameters: { controls: { disable: true } },
    render: () => ({
        moduleMetadata: { imports: [NepalSambatComponent] },
        template: '<story-nepal-sambat />',
    }),
};

/** Restyled through the CSS custom properties on .osn-cal. */
export const Themed: Story = {
    args: { script: 'roman' },
    render: (args) => ({
        props: args,
        styles: [
            ':host ::ng-deep .osn-cal { --osn-cal-accent: #1f6feb; --osn-cal-holiday: #1f6feb; --osn-cal-radius: 16px; }',
        ],
        template: `<osn-calendar ${argsToTemplate(args)} />`,
    }),
};
