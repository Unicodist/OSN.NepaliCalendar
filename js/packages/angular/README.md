# @opensourcenepal/nepali-calendar-angular

A Nepali (Bikram Sambat) calendar and date picker for Angular. It shows a BS month with the AD
date under each day, and switches between Nepali (`असोज २०८२`) and Roman (`Ashwin 2082`) script.
A dropdown switches the grid to AD (Gregorian) or Nepal Sambat (lunar) months.

- BS, AD or Nepal Sambat month grids, picked from a dropdown or with `[(calendar)]`
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
        <osn-calendar [(value)]="date" />
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
<osn-calendar (dateSelect)="onPick($event.bs, $event.ad)" />
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
    template: `<osn-calendar [formControl]="dateOfBirth" />`,
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
<osn-calendar [min]="{ year: 2082, month: 1, day: 1 }" [max]="{ year: 2082, month: 12, day: 30 }" />
```

In a form, a value outside the range (set from code, or left over after `min` or `max` changed)
makes the control invalid with a `minDate` or `maxDate` error:

```ts
@Component({
    imports: [NepaliCalendarComponent, ReactiveFormsModule],
    template: `
        <osn-calendar [max]="today" [formControl]="dateOfBirth" />
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
<osn-calendar [(ngModel)]="date" name="date" />
```

### Start in Roman script, on a given month

```html
<osn-calendar script="roman" [initialMonth]="{ year: 2082, month: 1 }" />
```

### Switch calendars: BS, AD and Nepal Sambat

The toolbar has a dropdown that switches the grid between calendars:

- `bs`: Bikram Sambat (विक्रम संवत्), the default, with the AD date under each day.
- `ad`: Gregorian (ईस्वी संवत्), with the BS date under each day.
- `ns`: Nepal Sambat (नेपाल संवत्), the lunar calendar. Each day shows its tithi, with the BS date under
  it and the full NS date, such as `ने.सं. ११४७ कछलाथ्व पारू`, in its tooltip. A year with a leap
  month (Anala) has 13 months in the month picker.

The header shows the other calendar's months that the grid spans. The value is always a `BsDate`,
and `dateSelect` still emits both the BS and AD dates.

```html
<osn-calendar calendar="ns" />
```

Pick which calendars the dropdown offers with `calendars`, bind `[(calendar)]` to keep it in sync
with your app, or hide the dropdown with `[showCalendarToggle]="false"` to always show one calendar.
The dropdown also hides when `calendars` has only one:

```html
<osn-calendar [calendars]="['bs', 'ns']" [(calendar)]="calendar" />
```

`<osn-nepali-calendar>` still works too: it is the same component under its old name.

### Keep the script in sync with your app

```html
<osn-calendar [(script)]="script" />
```

### Show BS dates only

```html
<osn-calendar [showAdDates]="false" [showScriptToggle]="false" [showCalendarToggle]="false" [showTodayButton]="false" />
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
| `calendar`           | `'bs' \| 'ad' \| 'ns'`       | `'bs'`                              | The calendar the grid follows. Supports `[(calendar)]`.                      |
| `calendarChange`     | `'bs' \| 'ad' \| 'ns'`       |                                     | Emits when the user picks another calendar.                                  |
| `calendars`          | `CalendarType[]`             | `['bs', 'ad', 'ns']`                | The calendars the dropdown offers, in order.                                 |
| `showCalendarToggle` | `boolean`                    | `true`                              | Shows the calendar dropdown.                                                 |
| `showAdDates`        | `boolean`                    | `true`                              | Shows the other calendar's day under each day, and its months in the header. |
| `showTodayButton`    | `boolean`                    | `true`                              | Shows the button that jumps back to today's month.                           |
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
