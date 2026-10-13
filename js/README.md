# OSN Nepali Calendar for JavaScript

npm workspaces with the JavaScript side of OSN.NepaliCalendar:

| Package                                                        | What it is                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@opensourcenepal/nepali-calendar`](packages/core)            | Framework-free TypeScript core: AD/BS conversion, validation, Roman and Devanagari names and formatting, and the month grid the components draw. |
| [`@opensourcenepal/nepali-calendar-react`](packages/react)     | `<NepaliCalendar>` for React 18+.                                                                                                                |
| [`@opensourcenepal/nepali-calendar-angular`](packages/angular) | `<osn-calendar>` for Angular 22, usable with `[(value)]` or as a form control.                                                                   |

Both components show a BS month with each AD day under its BS day and the AD months in the
header (or, switched with the calendar dropdown, an AD or Nepal Sambat month with each BS day under it), switch between Nepali and Roman script, jump to any month and year from the header
dropdowns, step between months (and with the arrow keys between days), jump back to today, and let the user pick a day. They cover the same range as the
.NET library, BS 1970 to BS 2090, from the same month-length table: a test fails if
`packages/core/src/month-lengths.ts` and `src/OSN.NepaliCalendar/BsCalendarData.cs` drift apart.

## Core

```ts
import { toBs, toAd, formatBs, daysInMonth, isValidBsDate } from '@opensourcenepal/nepali-calendar';

const bs = toBs(new Date(2025, 9, 2)); // { year: 2082, month: 6, day: 16 }, read in local time
toAd({ year: 2082, month: 1, day: 1 }); // { year: 2025, month: 4, day: 14 }
formatBs(bs, 'D'); // 16 Ashwin 2082
formatBs(bs, 'F', 'nepali'); // बिहीबार, १६ असोज २०८२
daysInMonth(2081, 2); // 32
isValidBsDate(2081, 1, 32); // false
```

`formatBs` takes the same standard (`d`, `D`, `F`, `M`, `Y`) and custom (`yyyy`, `MMMM`, `dddd`,
...) formats as `NepaliDate.ToString` in .NET.

## React

```tsx
import { NepaliCalendar, type BsDate } from '@opensourcenepal/nepali-calendar-react';
import '@opensourcenepal/nepali-calendar-react/styles.css';

function Example() {
    const [date, setDate] = useState<BsDate | null>(null);
    return <NepaliCalendar value={date} onChange={(bs, ad) => setDate(bs)} defaultScript="nepali" />;
}
```

Props: `value`/`defaultValue`/`onChange(bs, ad, ns)`, `script`/`defaultScript`/`onScriptChange`,
`calendar`/`defaultCalendar`/`onCalendarChange`, `showScriptToggle`, `showCalendarToggle`, `showAdDates`,
`showTodayButton`, `initialMonth`, `min`, `max`, `today`, `className`.

## Angular

```ts
import { NepaliCalendarComponent, type BsDate } from '@opensourcenepal/nepali-calendar-angular';

@Component({
    imports: [NepaliCalendarComponent],
    template: `<osn-nepali-calendar [(value)]="date" script="roman" (dateSelect)="log($event.ad)" />`,
})
export class Example {
    date: BsDate | null = null;
}
```

Add the stylesheet to `angular.json` (`"styles": ["@opensourcenepal/nepali-calendar-angular/styles.css"]`). The
component also works with `ngModel` and `formControl`. Inputs and outputs: `[(value)]`,
`[(script)]`, `[(calendar)]`, `(dateSelect)` with `{ bs, ad, ns }`, `showScriptToggle`, `showCalendarToggle`, `showAdDates`,
`showTodayButton`, `initialMonth`, `min`, `max` (with `minDate`/`maxDate` form errors), `today`.

## Theming

The look comes from `.osn-cal*` classes and CSS custom properties on `.osn-cal`
(`--osn-cal-accent`, `--osn-cal-bg`, `--osn-cal-radius`, ...); set `width` on `.osn-cal` to resize it. It follows the system dark mode;
add `osn-cal--light` to keep it light.

## Storybook

Each component has a Storybook with stories for both scripts, a selected date, the year and
month pickers, the ends of the range, a minimal layout, theming, and two-way binding (plus
reactive forms for Angular):

```shell
cd js
npm run storybook -w packages/react     # http://localhost:6006
npm run storybook -w packages/angular   # http://localhost:6007
npm run build-storybook                 # static builds in packages/*/storybook-static
```

CI builds both and uploads them as the `storybooks` artifact.

## Developing

Requires Node 22.22.3+ or 24.15+ and npm 11.

```shell
cd js
npm install
npm test           # Vitest for all three packages
npm run build      # core and React with tsc, Angular with ng-packagr (into packages/angular/dist)
npm run typecheck
npm run lint       # Prettier
```

## Publishing to npm

`scripts/publish.mjs` lints, typechecks, tests and builds everything, then publishes the core
package first and React and Angular after it, since both depend on core. Versions already on
npm are skipped, so it is safe to re-run after a partial failure.

```shell
cd js
npm login                     # once
npm run release:dry-run       # builds and shows what would be published
npm run release               # publishes core, React and Angular
npm run release -- --only core,react --otp 123456 --tag next
```

Options: `--dry-run`, `--only <core,react,angular>`, `--tag <dist-tag>`, `--otp <code>` for
two-factor auth, and `--skip-checks` to skip lint, typecheck and tests. Before publishing, bump
`version` in the package.json files and keep the React and Angular dependency on core at
`^<core version>`; the script stops if they disagree.
