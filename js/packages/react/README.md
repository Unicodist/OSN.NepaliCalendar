# @opensourcenepal/nepali-calendar-react

A Nepali (Bikram Sambat) calendar and date picker for React. It shows a BS month with the AD date
under each day, and switches between Nepali (`असोज २०८२`) and Roman (`Ashwin 2082`) script.
A dropdown switches the grid to AD (Gregorian) or Nepal Sambat (lunar) months.

- BS, AD or Nepal Sambat month grids, picked from a dropdown or from your code
- Month and year dropdowns covering BS 1970 to 2090, plus previous and next buttons
- Today highlighted, a "Today" button, and arrow-key navigation between days
- Controlled or uncontrolled, for both the date and the script
- Themeable with CSS custom properties, with dark mode built in
- React 18 and 19, with TypeScript types

## Installation

```shell
npm install @opensourcenepal/nepali-calendar-react
```

This also installs [`@opensourcenepal/nepali-calendar`](https://www.npmjs.com/package/@opensourcenepal/nepali-calendar),
which handles conversion and formatting, so you don't need to install or upgrade it yourself. With pnpm or another strict package manager, install it
directly too if you import from it, as some examples below do.

## Getting started

Import the component and its stylesheet once:

```tsx
import { NepaliCalendar } from '@opensourcenepal/nepali-calendar-react';
import '@opensourcenepal/nepali-calendar-react/styles.css';

export function App() {
    return <NepaliCalendar onChange={(bs, ad) => console.log(bs, ad)} />;
}
```

This shows today's month in Nepali script. Clicking a day calls `onChange` with the BS date
(`{ year, month, day }`), its AD equivalent and its Nepal Sambat date.

## Examples

### Keep the selected date in state

```tsx
import { useState } from 'react';
import { type BsDate, NepaliCalendar } from '@opensourcenepal/nepali-calendar-react';
import { formatBs, toAd } from '@opensourcenepal/nepali-calendar';

export function BirthdayPicker() {
    const [date, setDate] = useState<BsDate | null>(null);

    return (
        <>
            <NepaliCalendar value={date} onChange={setDate} />
            {date && (
                <p>
                    {formatBs(date, 'D', 'nepali')} ({JSON.stringify(toAd(date))})
                </p>
            )}
        </>
    );
}
```

### Start in Roman script, on a given month

```tsx
<NepaliCalendar defaultScript="roman" initialMonth={{ year: 2082, month: 1 }} />
```

### Limit the dates that can be picked

`min` and `max` are inclusive, and either can be left out. Days outside them are disabled, the
arrows and arrow keys stop at them, and the year and month pickers only offer months in range.

```tsx
<NepaliCalendar min={{ year: 2082, month: 1, day: 1 }} max={{ year: 2082, month: 12, day: 30 }} />
```

To stop people picking a date in the future, pass today as `max`:

```tsx
import { todayBs } from '@opensourcenepal/nepali-calendar';

<NepaliCalendar max={todayBs()} />;
```

### Switch calendars: BS, AD and Nepal Sambat

The toolbar has a dropdown that switches the grid between calendars:

- `bs`: Bikram Sambat (विक्रम संवत्), the default, with the AD date under each day.
- `ad`: Gregorian (ईस्वी संवत्), with the BS date under each day.
- `ns`: Nepal Sambat (नेपाल संवत्), the lunar calendar. Each day shows its tithi, with the BS date under
  it and the full NS date, such as `ने.सं. ११४७ कछलाथ्व पारू`, in its tooltip. A dot marks the full
  moon (Punhi, filled) and the new moon (Amai, hollow), and each day gets an `osn-cal__day--thwa` or
  `osn-cal__day--ga` class for its paksha. A year with a leap month has 13 months in the month
  picker, with the leap month named after the month it repeats, such as `Anala (Tachhala)`. The year
  picker keeps the same month by name.

The header shows the other calendar's months that the grid spans. The value is always a `BsDate`,
because two days can share one Nepal Sambat date when a tithi repeats. `onChange` gets the date in
every calendar: `(bs, ad, ns)`, where `ns` is a `NepalSambatDate` you can show with `formatNepalSambat(ns)`.

```tsx
<NepaliCalendar defaultCalendar="ns" />
```

Pick which calendars the dropdown offers with `calendars`, control the calendar yourself with
`calendar` and `onCalendarChange`, or hide the dropdown with `showCalendarToggle={false}` to always
show one calendar. The dropdown also hides when `calendars` has only one:

```tsx
const [calendar, setCalendar] = useState<CalendarType>('bs');

<NepaliCalendar calendars={['bs', 'ns']} calendar={calendar} onCalendarChange={setCalendar} />;
```

### Pick only a month or a year

Set `pick` to `month` or `year` to let the user pick a whole month or year instead of a day. The
grid becomes the months of a year, or a page of twelve years, and `onChange` gets the first day of
the picked month or year (or `min`, when that comes later):

```tsx
<NepaliCalendar pick="month" onChange={(bs) => setMonth({ year: bs.year, month: bs.month })} />
<NepaliCalendar pick="year" onChange={(bs) => setYear(bs.year)} />
```

Months and years follow the shown calendar, so with `calendar="ad"` the user picks a Gregorian
month. `getCalendar(calendar).monthOf(date)` turns the BS date back into that calendar's
`{ year, month }`.

### Control the script yourself

```tsx
const [script, setScript] = useState<'nepali' | 'roman'>('nepali');

<NepaliCalendar script={script} onScriptChange={setScript} />;
```

### Show BS dates only

```tsx
<NepaliCalendar showAdDates={false} showScriptToggle={false} showCalendarToggle={false} showTodayButton={false} />
```

### Use in a form

The calendar is not an input element, so put its value in a hidden field when posting a plain
form:

```tsx
<form method="post">
    <NepaliCalendar value={date} onChange={setDate} />
    <input type="hidden" name="date" value={date ? formatBs(date) : ''} />
</form>
```

## Props

| Prop                 | Type                                                    | Default                             | Description                                                                   |
| -------------------- | ------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `value`              | `BsDate \| null`                                        |                                     | The selected date. Pass it with `onChange` to control the selection.          |
| `defaultValue`       | `BsDate \| null`                                        | `null`                              | The initial selection when it is not controlled.                              |
| `onChange`           | `(bs: BsDate, ad: AdDate, ns: NepalSambatDate) => void` |                                     | Called when the user picks a day, with its BS, AD and Nepal Sambat dates.     |
| `pick`               | `'day' \| 'month' \| 'year'`                            | `'day'`                             | Picks a day, or a whole month or year (the value is its first day).           |
| `script`             | `'nepali' \| 'roman'`                                   |                                     | The script for names and digits. Pass it with `onScriptChange` to control it. |
| `defaultScript`      | `'nepali' \| 'roman'`                                   | `'nepali'`                          | The initial script when it is not controlled.                                 |
| `onScriptChange`     | `(script) => void`                                      |                                     | Called when the user switches script.                                         |
| `showScriptToggle`   | `boolean`                                               | `true`                              | Shows the Nepali/Roman toggle button.                                         |
| `calendar`           | `'bs' \| 'ad' \| 'ns'`                                  |                                     | The calendar the grid follows. Pass it with `onCalendarChange` to control it. |
| `defaultCalendar`    | `'bs' \| 'ad' \| 'ns'`                                  | `'bs'`                              | The initial calendar when it is not controlled.                               |
| `onCalendarChange`   | `(calendar) => void`                                    |                                     | Called when the user picks another calendar.                                  |
| `calendars`          | `CalendarType[]`                                        | `['bs', 'ad', 'ns']`                | The calendars the dropdown offers, in order.                                  |
| `showCalendarToggle` | `boolean`                                               | `true`                              | Shows the calendar dropdown.                                                  |
| `showAdDates`        | `boolean`                                               | `true`                              | Shows the other calendar's day under each day, and its months in the header.  |
| `showTodayButton`    | `boolean`                                               | `true`                              | Shows the button that jumps back to today's month.                            |
| `initialMonth`       | `{ year, month }`                                       | the selection's month, else today's | The BS month shown first.                                                     |
| `min`                | `BsDate \| null`                                        |                                     | The earliest date that can be picked.                                         |
| `max`                | `BsDate \| null`                                        |                                     | The latest date that can be picked.                                           |
| `today`              | `BsDate`                                                | today, local time                   | Overrides today's date, for tests and server rendering.                       |
| `className`          | `string`                                                |                                     | Extra classes on the root element.                                            |

`BsDate` and `AdDate` are `{ year, month, day }` with months from 1 to 12.

## Keyboard

Days are buttons, so Tab, Enter and Space work as usual. The arrow keys move between days, and
across into the previous or next month, but not past `min` or `max`. In the month and year grids
the arrow keys move between months or years.

## Styling

Override the CSS custom properties on `.osn-cal`, or any of its `.osn-cal__*` classes:

```css
.osn-cal {
    --osn-cal-accent: #1f6feb; /* selection, today outline, Today button */
    --osn-cal-holiday: #1f6feb; /* Saturdays */
    --osn-cal-bg: #fff;
    --osn-cal-fg: #1f2328;
    --osn-cal-muted: #6e7781;
    --osn-cal-border: #d0d7de;
    --osn-cal-hover: #f3f4f6;
    --osn-cal-radius: 8px;
    width: 24rem; /* 22rem by default */
}
```

The calendar follows the system dark mode. Add the `osn-cal--light` class through `className`
to keep it light.

## Supported range

BS 1970-01-01 to BS 2090-12-30 (AD 1913-04-13 to AD 2034-04-13). Navigation stops at both ends.

## License

MIT
