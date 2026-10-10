import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@analogjs/storybook-angular';
import { argsToTemplate } from '@analogjs/storybook-angular';
import { fn } from 'storybook/test';
import { type BsDate, NepaliCalendarComponent } from '../src/public-api';

const meta: Meta<NepaliCalendarComponent> = {
    title: 'NepaliCalendar',
    component: NepaliCalendarComponent,
    args: {
        script: 'nepali',
        showAdDates: true,
        showScriptToggle: true,
        showTodayButton: true,
        valueChange: fn(),
        scriptChange: fn(),
        dateSelect: fn(),
    },
    argTypes: {
        script: { control: 'inline-radio', options: ['nepali', 'roman'] },
    },
};

export default meta;
type Story = StoryObj<NepaliCalendarComponent>;

/** Today's month in Nepali script, with AD dates under each day. */
export const Default: Story = {};

/** Roman (transliterated) month and day names with Latin digits. */
export const Roman: Story = {
    args: { script: 'roman' },
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
    args: { showAdDates: false, showScriptToggle: false, showTodayButton: false },
};

@Component({
    selector: 'story-two-way',
    imports: [NepaliCalendarComponent],
    template: `
        <osn-nepali-calendar [(value)]="value" [(script)]="script" />
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
        <osn-nepali-calendar script="roman" [formControl]="control" />
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

/** Restyled through the CSS custom properties on .osn-cal. */
export const Themed: Story = {
    args: { script: 'roman' },
    render: (args) => ({
        props: args,
        styles: [
            ':host ::ng-deep .osn-cal { --osn-cal-accent: #1f6feb; --osn-cal-holiday: #1f6feb; --osn-cal-radius: 16px; }',
        ],
        template: `<osn-nepali-calendar ${argsToTemplate(args)} />`,
    }),
};
