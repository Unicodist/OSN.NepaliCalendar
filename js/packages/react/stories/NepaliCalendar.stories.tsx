import type { Meta, StoryObj } from '@storybook/react-vite';
import { toNepalSambat } from '@opensourcenepal/nepali-calendar';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { type BsDate, NepaliCalendar, type NepalSambatDate, type Script, formatNepalSambat } from '../src/index.js';

const meta = {
    title: 'NepaliCalendar',
    component: NepaliCalendar,
    args: {
        onChange: fn(),
        onScriptChange: fn(),
        onCalendarChange: fn(),
    },
    argTypes: {
        script: { control: 'inline-radio', options: ['nepali', 'roman'] },
        defaultScript: { control: 'inline-radio', options: ['nepali', 'roman'] },
        calendar: { control: 'inline-radio', options: ['bs', 'ad', 'ns'] },
        defaultCalendar: { control: 'inline-radio', options: ['bs', 'ad', 'ns'] },
        calendars: { control: 'check', options: ['bs', 'ad', 'ns'] },
        pick: { control: 'inline-radio', options: ['day', 'month', 'year'] },
    },
} satisfies Meta<typeof NepaliCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Today's month in Nepali script, with AD dates under each day. */
export const Default: Story = {};

/** Picks a whole month: the value is the first day of the picked month. The arrows move a year. */
export const MonthPicker: Story = {
    args: { pick: 'month', defaultScript: 'roman' },
};

/** Picks a whole year from a page of twelve: the value is the first day of the picked year. */
export const YearPicker: Story = {
    args: { pick: 'year', defaultScript: 'roman' },
};

/** Months follow the shown calendar, so in AD the user picks a Gregorian month. */
export const AdMonthPicker: Story = {
    args: { pick: 'month', defaultCalendar: 'ad', defaultScript: 'roman' },
};

/** Roman (transliterated) month and day names with Latin digits. */
export const Roman: Story = {
    args: { defaultScript: 'roman' },
};

/** A Gregorian (AD) month with the BS date under each day. The calendar dropdown switches back. */
export const AdCalendar: Story = {
    args: { defaultCalendar: 'ad', defaultScript: 'roman' },
};

/**
 * A Nepal Sambat lunar month: each day shows its tithi, with the BS date under it and the full NS date in
 * its tooltip. `value` stays a BS date, since two days can share one NS date; `onChange` also gets the
 * NS date, mirrored below the calendar.
 */
export const NepalSambat: Story = {
    args: { defaultCalendar: 'ns', defaultScript: 'roman' },
    render: function Render(args) {
        const start: BsDate = { year: 2083, month: 7, day: 24 };
        const [value, setValue] = useState<BsDate | null>(start);
        const [ns, setNs] = useState<NepalSambatDate>(() => toNepalSambat(start));
        return (
            <div>
                <NepaliCalendar
                    {...args}
                    value={value}
                    onChange={(bs, ad, nsDate) => {
                        setValue(bs);
                        setNs(nsDate);
                        args.onChange?.(bs, ad, nsDate);
                    }}
                />
                <p style={{ fontFamily: 'monospace' }}>
                    value: {value ? `${value.year}-${value.month}-${value.day}` : 'none'} · NS: {formatNepalSambat(ns)}
                </p>
            </div>
        );
    },
};

/** Only BS and Nepal Sambat in the calendar dropdown. */
export const ChosenCalendars: Story = {
    args: { calendars: ['bs', 'ns'], defaultScript: 'roman' },
};

/** Opens on the month of an initially selected date. */
export const WithSelectedDate: Story = {
    args: { defaultValue: { year: 2082, month: 6, day: 16 }, defaultScript: 'roman' },
};

/** Opens on a chosen month; use the year and month pickers to jump anywhere from BS 1970 to 2090. */
export const InitialMonth: Story = {
    args: { initialMonth: { year: 2045, month: 12 }, defaultScript: 'roman' },
};

/** The first supported month: the previous-month button is disabled. */
export const StartOfRange: Story = {
    args: { initialMonth: { year: 1970, month: 1 }, defaultScript: 'roman' },
};

/**
 * Only 10 Ashwin to 20 Mangsir 2082 can be picked: other days are disabled, and the arrows and
 * pickers stop at the range.
 */
export const MinAndMax: Story = {
    args: {
        defaultScript: 'roman',
        min: { year: 2082, month: 6, day: 10 },
        max: { year: 2082, month: 8, day: 20 },
    },
};

/** BS dates only: no AD dates, script toggle or today button. */
export const Minimal: Story = {
    args: { showAdDates: false, showScriptToggle: false, showCalendarToggle: false, showTodayButton: false },
};

/** A controlled date and script, mirrored below the calendar. */
export const Controlled: Story = {
    render: function Render(args) {
        const [value, setValue] = useState<BsDate | null>({ year: 2083, month: 1, day: 1 });
        const [script, setScript] = useState<Script>('nepali');
        return (
            <div>
                <NepaliCalendar
                    {...args}
                    value={value}
                    script={script}
                    onChange={(bs, ad, ns) => {
                        setValue(bs);
                        args.onChange?.(bs, ad, ns);
                    }}
                    onScriptChange={(next) => {
                        setScript(next);
                        args.onScriptChange?.(next);
                    }}
                />
                <p style={{ fontFamily: 'monospace' }}>
                    value: {value ? `${value.year}-${value.month}-${value.day}` : 'none'} · script: {script}
                </p>
            </div>
        );
    },
};

/** Restyled through the CSS custom properties on .osn-cal. */
export const Themed: Story = {
    args: { className: 'story-themed', defaultScript: 'roman' },
    decorators: [
        (Story) => (
            <>
                <style>{`.story-themed { --osn-cal-accent: #1f6feb; --osn-cal-holiday: #1f6feb; --osn-cal-radius: 16px; }`}</style>
                <Story />
            </>
        ),
    ],
};
