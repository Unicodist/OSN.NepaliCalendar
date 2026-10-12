# @opensourcenepal/nepali-calendar-react

A Nepali (Bikram Sambat) calendar and date picker for React. It shows a BS month with the AD date
under each day, and switches between Nepali (`असोज २०८२`) and Roman (`Ashwin 2082`) script.
A button switches the grid to AD months, with the BS date under each day.

- BS or AD month grids, switchable by the user or from your code
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
(`{ year, month, day }`) and its AD equivalent.

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

### Switch between BS and AD

The toolbar has a button that switches the grid between BS months and AD (Gregorian) months.
In AD, each day shows its AD date with the BS date under it, and the header shows the BS months
it spans. The value is still a `BsDate`, and `onChange` still gets both dates.

```tsx
<NepaliCalendar defaultCalendar="ad" />
```

Control it yourself with `calendar` and `onCalendarChange`, or hide the button with
`showCalendarToggle={false}` to always show one calendar:

```tsx
const [calendar, setCalendar] = useState<CalendarSystem>('bs');

<NepaliCalendar calendar={calendar} onCalendarChange={setCalendar} />;
```

### Control the script yourself

```tsx
const [script, setScript] = useState<'nepali' | 'roman'>('nepali');

<NepaliCalendar script={script} onScriptChange={setScript} />;
```

### Show Nepal Sambat

`showNepalSambat` adds the Nepal Sambat year to the header (`ने.सं. ११४६–११४७` when the month spans
the NS new year) and puts each day's full NS date, such as `ने.सं. ११४७ कछलाथ्व पारू`, in its
tooltip and accessible name.

```tsx
<NepaliCalendar showNepalSambat />
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

| Prop                 | Type                               | Default                             | Description                                                                   |
| -------------------- | ---------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `value`              | `BsDate \| null`                   |                                     | The selected date. Pass it with `onChange` to control the selection.          |
| `defaultValue`       | `BsDate \| null`                   | `null`                              | The initial selection when it is not controlled.                              |
| `onChange`           | `(bs: BsDate, ad: AdDate) => void` |                                     | Called when the user picks a day.                                             |
| `script`             | `'nepali' \| 'roman'`              |                                     | The script for names and digits. Pass it with `onScriptChange` to control it. |
| `defaultScript`      | `'nepali' \| 'roman'`              | `'nepali'`                          | The initial script when it is not controlled.                                 |
| `onScriptChange`     | `(script) => void`                 |                                     | Called when the user switches script.                                         |
| `showScriptToggle`   | `boolean`                          | `true`                              | Shows the Nepali/Roman toggle button.                                         |
| `calendar`           | `'bs' \| 'ad'`                     |                                     | The calendar the grid follows. Pass it with `onCalendarChange` to control it. |
| `defaultCalendar`    | `'bs' \| 'ad'`                     | `'bs'`                              | The initial calendar when it is not controlled.                               |
| `onCalendarChange`   | `(calendar) => void`               |                                     | Called when the user switches between BS and AD.                              |
| `showCalendarToggle` | `boolean`                          | `true`                              | Shows the BS/AD toggle button.                                                |
| `showAdDates`        | `boolean`                          | `true`                              | Shows the other calendar's day under each day, and its months in the header.  |
| `showTodayButton`    | `boolean`                          | `true`                              | Shows the button that jumps back to today's month.                            |
| `showNepalSambat`    | `boolean`                          | `false`                             | Shows the Nepal Sambat year in the header and each day's NS date.             |
| `initialMonth`       | `{ year, month }`                  | the selection's month, else today's | The BS month shown first.                                                     |
| `min`                | `BsDate \| null`                   |                                     | The earliest date that can be picked.                                         |
| `max`                | `BsDate \| null`                   |                                     | The latest date that can be picked.                                           |
| `today`              | `BsDate`                           | today, local time                   | Overrides today's date, for tests and server rendering.                       |
| `className`          | `string`                           |                                     | Extra classes on the root element.                                            |

`BsDate` and `AdDate` are `{ year, month, day }` with months from 1 to 12.

## Keyboard

Days are buttons, so Tab, Enter and Space work as usual. The arrow keys move between days, and
across into the previous or next month, but not past `min` or `max`.

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
