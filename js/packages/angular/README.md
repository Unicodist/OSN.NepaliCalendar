# @opensourcenepal/nepali-calendar-angular

A Nepali (Bikram Sambat) calendar and date picker for Angular. It shows a BS month with the AD
date under each day, and switches between Nepali (`असोज २०८२`) and Roman (`Ashwin 2082`) script.
A button switches the grid to AD months, with the BS date under each day.

- BS or AD month grids, switchable by the user or with `[(calendar)]`
- Standalone component with `[(value)]` two-way binding, `ngModel` and reactive forms
- Month and year dropdowns covering BS 1970 to 2090, plus previous and next buttons
- Today highlighted, a "Today" button, and arrow-key navigation between days
- Works with zoneless and zone.js change detection
- Themeable with CSS custom properties, with dark mode built in
- Angular 22

## Installation

```shell
npm install @opensourcenepal/nepali-calendar-angular
```

This also installs [`@opensourcenepal/nepali-calendar`](https://www.npmjs.com/package/@opensourcenepal/nepali-calendar),
which handles conversion and formatting, so you don't need to install or upgrade it yourself. With pnpm or
another strict package manager, install it directly too if you import from it, as some examples below do.

Add the stylesheet to `angular.json` under `projects.<app>.architect.build.options.styles`:

```json
"styles": [
  "src/styles.css",
  "node_modules/@opensourcenepal/nepali-calendar-angular/styles.css"
]
```

or import it from your global stylesheet:

```css
@import '@opensourcenepal/nepali-calendar-angular/styles.css';
```

## Getting started

```ts
import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { type BsDate, NepaliCalendarComponent } from '@opensourcenepal/nepali-calendar-angular';

@Component({
    selector: 'app-root',
    imports: [NepaliCalendarComponent, JsonPipe],
    template: `
        <osn-nepali-calendar [(value)]="date" />
        <p>Selected: {{ date() | json }}</p>
    `,
})
export class App {
    readonly date = signal<BsDate | null>(null);
}
```

This shows today's month in Nepali script. Clicking a day sets `date` to the BS date
(`{ year, month, day }`).

## Examples

### Get the AD date too

```html
<osn-nepali-calendar (dateSelect)="onPick($event.bs, $event.ad)" />
```

```ts
import { formatBs } from '@opensourcenepal/nepali-calendar';

onPick(bs: BsDate, ad: AdDate) {
  console.log(formatBs(bs, 'D', 'nepali'), ad); // '१६ असोज २०८२' { year: 2025, month: 10, day: 2 }
}
```

### Reactive forms

```ts
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    imports: [NepaliCalendarComponent, ReactiveFormsModule],
    template: `<osn-nepali-calendar [formControl]="dateOfBirth" />`,
})
export class ProfileForm {
    readonly dateOfBirth = new FormControl<BsDate | null>({ year: 2050, month: 1, day: 1 });
}
```

`dateOfBirth.disable()` disables picking a day, the month navigation and the dropdowns.

### Limit the dates that can be picked

`min` and `max` are inclusive, and either can be left out. Days outside them are disabled, the
arrows and arrow keys stop at them, and the year and month pickers only offer months in range.

```html
<osn-nepali-calendar [min]="{ year: 2082, month: 1, day: 1 }" [max]="{ year: 2082, month: 12, day: 30 }" />
```

In a form, a value outside the range (set from code, or left over after `min` or `max` changed)
makes the control invalid with a `minDate` or `maxDate` error:

```ts
@Component({
    imports: [NepaliCalendarComponent, ReactiveFormsModule],
    template: `
        <osn-nepali-calendar [max]="today" [formControl]="dateOfBirth" />
        @if (dateOfBirth.hasError('maxDate')) {
            <p>The date of birth can't be in the future.</p>
        }
    `,
})
export class ProfileForm {
    readonly today = todayBs(); // from @opensourcenepal/nepali-calendar
    readonly dateOfBirth = new FormControl<BsDate | null>(null);
}
```

The error value is `{ min, actual }` or `{ max, actual }`.

### Template-driven forms

Import `FormsModule`, then:

```html
<osn-nepali-calendar [(ngModel)]="date" name="date" />
```

### Start in Roman script, on a given month

```html
<osn-nepali-calendar script="roman" [initialMonth]="{ year: 2082, month: 1 }" />
```

### Switch between BS and AD

The toolbar has a button that switches the grid between BS months and AD (Gregorian) months.
In AD, each day shows its AD date with the BS date under it, and the header shows the BS months
it spans. The value is still a `BsDate`, and `dateSelect` still emits both dates.

```html
<osn-nepali-calendar calendar="ad" />
```

Bind `[(calendar)]` to keep it in sync with your app, or hide the button with
`[showCalendarToggle]="false"` to always show one calendar.

### Keep the script in sync with your app

```html
<osn-nepali-calendar [(script)]="script" />
```

### Show Nepal Sambat

`showNepalSambat` adds the Nepal Sambat year to the header (`ने.सं. ११४६–११४७` when the month spans
the NS new year) and puts each day's full NS date, such as `ने.सं. ११४७ कछलाथ्व पारू`, in its
tooltip and accessible name.

```html
<osn-nepali-calendar showNepalSambat />
```

### Show BS dates only

```html
<osn-nepali-calendar
    [showAdDates]="false"
    [showScriptToggle]="false"
    [showCalendarToggle]="false"
    [showTodayButton]="false"
/>
```

## Inputs and outputs

| Name                 | Type                         | Default                             | Description                                                                  |
| -------------------- | ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `value`              | `BsDate \| null`             | `null`                              | The selected date. Supports `[(value)]`.                                     |
| `valueChange`        | `BsDate`                     |                                     | Emits the picked date.                                                       |
| `dateSelect`         | `{ bs: BsDate; ad: AdDate }` |                                     | Emits the picked date with its AD equivalent.                                |
| `script`             | `'nepali' \| 'roman'`        | `'nepali'`                          | The script for names and digits. Supports `[(script)]`.                      |
| `scriptChange`       | `'nepali' \| 'roman'`        |                                     | Emits when the user switches script.                                         |
| `showScriptToggle`   | `boolean`                    | `true`                              | Shows the Nepali/Roman toggle button.                                        |
| `calendar`           | `'bs' \| 'ad'`               | `'bs'`                              | The calendar the grid follows. Supports `[(calendar)]`.                      |
| `calendarChange`     | `'bs' \| 'ad'`               |                                     | Emits when the user switches between BS and AD.                              |
| `showCalendarToggle` | `boolean`                    | `true`                              | Shows the BS/AD toggle button.                                               |
| `showAdDates`        | `boolean`                    | `true`                              | Shows the other calendar's day under each day, and its months in the header. |
| `showTodayButton`    | `boolean`                    | `true`                              | Shows the button that jumps back to today's month.                           |
| `showNepalSambat`    | `boolean`                    | `false`                             | Shows the Nepal Sambat year in the header and each day's NS date.            |
| `initialMonth`       | `{ year, month } \| null`    | the selection's month, else today's | The BS month shown first.                                                    |
| `min`                | `BsDate \| null`             | `null`                              | The earliest date that can be picked.                                        |
| `max`                | `BsDate \| null`             | `null`                              | The latest date that can be picked.                                          |
| `today`              | `BsDate`                     | today, local time                   | Overrides today's date, for tests and server rendering.                      |

`BsDate` and `AdDate` are `{ year, month, day }` with months from 1 to 12. The boolean inputs
also accept attribute form, such as `showAdDates="false"`.

## Keyboard

Days are buttons, so Tab, Enter and Space work as usual. The arrow keys move between days, and
across into the previous or next month, but not past `min` or `max`.

## Styling

The component uses global `.osn-cal*` classes, so you can theme it from any global stylesheet.
Override the CSS custom properties on `.osn-cal`:

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

The calendar follows the system dark mode. Add `class="osn-cal--light"` to keep it light.

## Supported range

BS 1970-01-01 to BS 2090-12-30 (AD 1913-04-13 to AD 2034-04-13). Navigation stops at both ends.

## License

MIT
