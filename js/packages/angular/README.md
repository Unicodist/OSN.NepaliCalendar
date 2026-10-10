# @opensourcenepal/nepali-calendar-angular

A Nepali (Bikram Sambat) calendar and date picker for Angular. It shows a BS month with the AD
date under each day, and switches between Nepali (`असोज २०८२`) and Roman (`Ashwin 2082`) script.

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

### Template-driven forms

Import `FormsModule`, then:

```html
<osn-nepali-calendar [(ngModel)]="date" name="date" />
```

### Start in Roman script, on a given month

```html
<osn-nepali-calendar script="roman" [initialMonth]="{ year: 2082, month: 1 }" />
```

### Keep the script in sync with your app

```html
<osn-nepali-calendar [(script)]="script" />
```

### Show BS dates only

```html
<osn-nepali-calendar [showAdDates]="false" [showScriptToggle]="false" [showTodayButton]="false" />
```

## Inputs and outputs

| Name               | Type                         | Default                             | Description                                                         |
| ------------------ | ---------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `value`            | `BsDate \| null`             | `null`                              | The selected date. Supports `[(value)]`.                            |
| `valueChange`      | `BsDate`                     |                                     | Emits the picked date.                                              |
| `dateSelect`       | `{ bs: BsDate; ad: AdDate }` |                                     | Emits the picked date with its AD equivalent.                       |
| `script`           | `'nepali' \| 'roman'`        | `'nepali'`                          | The script for names and digits. Supports `[(script)]`.             |
| `scriptChange`     | `'nepali' \| 'roman'`        |                                     | Emits when the user switches script.                                |
| `showScriptToggle` | `boolean`                    | `true`                              | Shows the Nepali/Roman toggle button.                               |
| `showAdDates`      | `boolean`                    | `true`                              | Shows the AD day under each BS day and the AD months in the header. |
| `showTodayButton`  | `boolean`                    | `true`                              | Shows the button that jumps back to today's month.                  |
| `initialMonth`     | `{ year, month } \| null`    | the selection's month, else today's | The month shown first.                                              |
| `today`            | `BsDate`                     | today, local time                   | Overrides today's date, for tests and server rendering.             |

`BsDate` and `AdDate` are `{ year, month, day }` with months from 1 to 12. The boolean inputs
also accept attribute form, such as `showAdDates="false"`.

## Keyboard

Days are buttons, so Tab, Enter and Space work as usual. The arrow keys move between days, and
across into the previous or next month.

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
