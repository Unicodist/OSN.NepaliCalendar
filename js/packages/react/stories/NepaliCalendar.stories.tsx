import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { type BsDate, NepaliCalendar, type Script } from '../src/index.js';

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
        calendar: { control: 'inline-radio', options: ['bs', 'ad'] },
        defaultCalendar: { control: 'inline-radio', options: ['bs', 'ad'] },
    },
} satisfies Meta<typeof NepaliCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Today's month in Nepali script, with AD dates under each day. */
export const Default: Story = {};

/** Roman (transliterated) month and day names with Latin digits. */
export const Roman: Story = {
    args: { defaultScript: 'roman' },
};

/** A Gregorian (AD) month with the BS date under each day. The BS/AD button switches back. */
export const AdCalendar: Story = {
    args: { defaultCalendar: 'ad', defaultScript: 'roman' },
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
                    onChange={(bs, ad) => {
                        setValue(bs);
                        args.onChange?.(bs, ad);
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
