# @opensourcenepal/nepali-calendar

Nepali (Bikram Sambat, BS) dates for JavaScript and TypeScript: convert between AD and BS,
validate dates, and format them in Roman (`16 Ashwin 2082`) or Nepali (`१६ असोज २०८२`) script.

- No dependencies, works in browsers and Node.js, ships ES modules with TypeScript types.
- Covers BS 1970-01-01 to BS 2090-12-30 (AD 1913-04-13 to AD 2034-04-13).
- Uses the same month-length table as the [OSN.NepaliCalendar](https://github.com/Unicodist/OSN.NepaliCalendar) .NET library.
- Powers [`@opensourcenepal/nepali-calendar-react`](https://www.npmjs.com/package/@opensourcenepal/nepali-calendar-react)
  and [`@opensourcenepal/nepali-calendar-angular`](https://www.npmjs.com/package/@opensourcenepal/nepali-calendar-angular).

## Installation

```shell
npm install @opensourcenepal/nepali-calendar
```

## Getting started

Dates are plain objects. Months run from 1 (Baisakh) to 12 (Chaitra).

```ts
import { formatBs, toAd, toBs } from '@opensourcenepal/nepali-calendar';

// AD -> BS. A Date is read in local time; its time of day is ignored.
const dashain = toBs(new Date(2025, 9, 2)); // { year: 2082, month: 6, day: 16 }
toBs({ year: 2025, month: 4, day: 14 }); // { year: 2082, month: 1, day: 1 }

// BS -> AD
toAd({ year: 2082, month: 6, day: 16 }); // { year: 2025, month: 10, day: 2 }

// Format
formatBs(dashain, 'D'); // '16 Ashwin 2082'
formatBs(dashain, 'F', 'nepali'); // 'बिहीबार, १६ असोज २०८२'
```

## Converting

| Function       | Does                                                             |
| -------------- | ---------------------------------------------------------------- |
| `toBs(date)`   | AD to BS. Takes a `Date` (local time) or `{ year, month, day }`. |
| `toAd(date)`   | BS to AD as `{ year, month, day }`.                              |
| `toJsDate(ad)` | An AD `{ year, month, day }` as a local-midnight `Date`.         |
| `todayBs()`    | Today's BS date in local time.                                   |

```ts
import { toAd, toJsDate, todayBs } from '@opensourcenepal/nepali-calendar';

toJsDate(toAd({ year: 2082, month: 6, day: 16 })); // Thu Oct 02 2025 00:00 (local)
todayBs(); // e.g. { year: 2083, month: 6, day: 24 }
```

Dates outside the supported range, and dates that do not exist, throw a `RangeError`.

## Validating and creating dates

```ts
import { bsDate, daysInMonth, isValidBsDate, parseBs } from '@opensourcenepal/nepali-calendar';

daysInMonth(2081, 2); // 32: Jestha 2081 has 32 days
isValidBsDate(2081, 1, 32); // false: Baisakh 2081 has 31 days
bsDate(2081, 1, 32); // throws RangeError
parseBs('2082-06-16'); // { year: 2082, month: 6, day: 16 } (also accepts 2082/6/16)
parseBs('2081-01-32'); // null
```

## Formatting

`formatBs(date, format = 'd', script = 'roman')` takes the same format strings as
`NepaliDate.ToString` in the .NET library.

| Format        | `'roman'`                 | `'nepali'`              |
| ------------- | ------------------------- | ----------------------- |
| `d` (default) | `2082-06-16`              | `२०८२-०६-१६`            |
| `D`           | `16 Ashwin 2082`          | `१६ असोज २०८२`          |
| `F`           | `Bihibar, 16 Ashwin 2082` | `बिहीबार, १६ असोज २०८२` |
| `M`           | `16 Ashwin`               | `१६ असोज`               |
| `Y`           | `Ashwin 2082`             | `असोज २०८२`             |

Custom formats use `yyyy`, `yy`, `MMMM` (month name), `MM`, `M`, `dddd` (weekday), `ddd`
(short weekday), `dd` and `d`. Quote literal text or escape it with `\`:

```ts
formatBs(date, 'dddd, d MMMM yyyy'); // 'Bihibar, 16 Ashwin 2082'
formatBs(date, "'Year' yyyy, MMMM", 'nepali'); // 'Year २०८२, असोज'
```

Names and digits are also available on their own:

```ts
import { DAY_NAMES, MONTH_NAMES, monthName, toDigits } from '@opensourcenepal/nepali-calendar';

monthName(6, 'nepali'); // 'असोज'
toDigits(2082, 'nepali'); // '२०८२'
MONTH_NAMES.roman; // ['Baisakh', 'Jestha', ..., 'Chaitra']
DAY_NAMES.nepali; // ['आइतबार', ..., 'शनिबार'], Sunday first
```

## Date arithmetic

```ts
import { addDays, addMonths, compareBs, dayOfWeek, isSameBs } from '@opensourcenepal/nepali-calendar';

addDays({ year: 2081, month: 12, day: 31 }, 1); // { year: 2082, month: 1, day: 1 }
addMonths(2081, 12, 1); // { year: 2082, month: 1 }
dayOfWeek({ year: 2082, month: 6, day: 16 }); // 4 (Thursday; 0 is Sunday)
compareBs(a, b); // negative, 0 or positive
isSameBs(a, b); // true when both are the same day
```

## Nepal Sambat

Every BS date also has a Nepal Sambat (नेपाल संवत्) lunar date: a year, a month, a half (`thwa`,
bright, or `ga`, dark) and a tithi. The year starts on Kachhala Thwa Paru, the day of Mha Puja.

```ts
import {
    findNepalSambatDays,
    formatNepalSambat,
    nepalSambatYear,
    toNepalSambat,
} from '@opensourcenepal/nepali-calendar';

const mhaPuja = { year: 2083, month: 7, day: 24 }; // AD 2026-11-10
nepalSambatYear(mhaPuja); // 1147
const ns = toNepalSambat(mhaPuja);
// { year: 1147, month: 1, isLeapMonth: false, paksha: 'thwa', tithi: 1, lunarDay: 1, isRepeatedTithi: false }
formatNepalSambat(ns); // 'NS 1147 Kachhala Thwa Paru'
formatNepalSambat(ns, 'G', 'nepali'); // 'ने.सं. ११४७ कछलाथ्व पारू'
formatNepalSambat(ns, 'Y'); // 'NS 1147'

// A tithi can be skipped (no day) or repeated (two days).
findNepalSambatDays(1146, 12, 'thwa', 8); // [2083-07-01, 2083-07-02]
```

`nepalSambatMonths(year)` lists the lunar months of a year with their first and last BS days, and
`formatNepalSambatYears(first, last)` gives a header label such as `NS 1146–1147`, and
`NEPAL_SAMBAT_MONTH_NAMES`, `TITHI_NAMES` and `tithiName()` give the names. The days follow
Nepal's official panchang; see Accuracy below.

## Building your own calendar UI

`buildMonthView` lays out one BS month as weeks of seven cells, starting on Sunday, with the AD
date of each day. The React and Angular components are built on it.

```ts
import { buildMonthView } from '@opensourcenepal/nepali-calendar';

const view = buildMonthView(2082, 6, { selected: { year: 2082, month: 6, day: 16 } });
view.adLabel; // 'Sep/Oct 2025'
view.weeks; // 5 rows of 7; null pads the days outside the month
view.weeks[0][3]; // the 1st: bs 2082-06-01, ad 2025-09-17, dayOfWeek 3, plus isToday, isSelected, isDisabled and key
```

Pass `min` and/or `max` to mark the days outside them as `isDisabled` and to have `hasPrevious` and
`hasNext` stop at their months. The same `{ min, max }` range works with the helpers for pickers:

```ts
import { clampBs, isInRange, shiftMonth, supportedYears } from '@opensourcenepal/nepali-calendar';

const range = { min: { year: 2082, month: 1, day: 1 }, max: { year: 2082, month: 12, day: 30 } };
isInRange({ year: 2081, month: 12, day: 30 }, range); // false
clampBs({ year: 2081, month: 12, day: 30 }, range); // { year: 2082, month: 1, day: 1 }
shiftMonth(2082, 12, 1, range); // { year: 2082, month: 12 }
supportedYears(range); // [2082]
```

`clampMonth()`, `isMonthInRange()`, `MIN_DATE`, `MAX_DATE`, `MIN_YEAR` and `MAX_YEAR` are there
too. Without a range, the helpers use the supported range.

### AD month grids

`buildAdMonthView` lays out a Gregorian month the same way, with the BS date of each day and the
BS months it spans. Days outside the supported BS range are left empty.

```ts
import { buildAdMonthView, convertMonth } from '@opensourcenepal/nepali-calendar';

const july = buildAdMonthView(2024, 7);
july.bsLabel; // 'Ashadh/Shrawan 2081'
july.weeks[0][1]; // 1 July: ad 2024-07-01, bs 2081-03-17, dayOfWeek 1

convertMonth(2081, 4, 'bs', 'ad'); // { year: 2024, month: 7 }, the AD month to show after switching
```

`shiftAdMonth`, `clampAdMonth`, `isAdMonthInRange` and `supportedAdYears` take the same `{ min, max }`
BS range.

### Any calendar: BS, AD or Nepal Sambat

Each calendar is an object with the same methods, so one code path can show any of them. Look one
up by its `CalendarType` (`'bs'`, `'ad'` or `'ns'`) with `getCalendar`, or use `BIKRAM_SAMBAT`,
`GREGORIAN` and `NEPAL_SAMBAT`. `CALENDAR_TYPES` lists every type, for a calendar picker. The
components are built on these, and new calendars will be added the same way.

```ts
import { CALENDAR_TYPES, CALENDARS, convertMonth, getCalendar } from '@opensourcenepal/nepali-calendar';

CALENDAR_TYPES.map((type) => CALENDARS[type].name.nepali); // ['विक्रम संवत्', 'ईस्वी संवत्', 'नेपाल संवत्']

const ns = getCalendar('ns');
const month = ns.monthOf({ year: 2083, month: 7, day: 24 }); // { year: 1147, month: 1 }
const view = ns.buildView(month.year, month.month, { script: 'roman' });
view.otherLabel; // 'Kartik/Mangsir 2083'
const first = view.weeks[0][2]!; // BS 2083-07-24, a Tuesday
ns.dayNumber(first); // 1, the tithi
ns.otherDayNumber(first); // 24, the BS day
ns.dayLabel(first); // 'Mangalbar, NS 1147 Kachhala Thwa Paru'

ns.monthNames('roman', 1146); // 13 months, with 'Anala (Tachhala)' (the leap month) before 'Tachhala'
ns.shiftMonth(1146, 13, 1); // { year: 1147, month: 1 }
ns.moveToYear(1147, 8, 1146); // { year: 1146, month: 9 }: Tachhala again, after 1146's Anala
ns.dayMarkers(first); // ['thwa']; a full moon gives ['thwa', 'punhi'], a new moon ['ga', 'amai']
convertMonth(1147, 1, 'ns', 'ad'); // { year: 2026, month: 11 }, the AD month to show after switching
```

A month is `{ year, month }`, where `month` counts from 1 at the start of the year. A Nepal Sambat
year with a leap month has 13, so there `month` is the month's place in its year, not its name.
Every calendar also has `years(range)`, `clampMonth`, `moveToYear`, `isMonthInRange`, `midMonth` and `dayMarkers`, and takes the
same `{ min, max }` BS range. `buildCalendarView(type, year, month, options)`, `clampCalendarMonth`,
`isCalendarMonthInRange`, `calendarYears`, `calendarMonthNames`, `dayLabel` and `monthOf` do the
same from a type.

### Month and year pickers

`buildMonthPicker(type, year, options)` lays out the months of a year and
`buildYearPicker(type, year, options)` a page of twelve years, each with its name, the other
calendar's span, and `isCurrent`, `isSelected` and `isDisabled` flags. `pickedDate(type, 'month', year, month, range)`
(or `firstDayOfMonth` and `firstDayOfYear`) gives the BS date to select: the first day of that
month or year inside the range. The components use these for `pick="month"` and `pick="year"`.

```ts
import { buildMonthPicker, buildYearPicker, pickedDate } from '@opensourcenepal/nepali-calendar';

const months = buildMonthPicker('bs', 2081, { script: 'roman' });
months.months[3]; // { name: 'Shrawan', label: 'Shrawan 2081', otherLabel: 'Jul/Aug', ... }
months.otherLabel; // '2024/2025'
buildYearPicker('bs', 2081).first; // 2076, the page is 2076 to 2087
pickedDate('ad', 'month', 2024, 7); // { year: 2081, month: 3, day: 17 }, 1 July 2024
```

## Stylesheet

`@opensourcenepal/nepali-calendar/styles.css` styles the React and Angular calendar components. Both
component packages also ship a copy, so their users don't need to install this package. See their
READMEs for how to include and theme it.

## Accuracy

BS month lengths follow the published Nepali calendar (panchang), not a formula, so they are kept
in a table that is checked against the .NET library. Years after BS 2083 are computed and may
change once the official calendar for those years is published.

Nepal Sambat dates take the tithi at sunrise in Kathmandu, calculated the way Nepal's panchang
committee does it, and were checked day by day against the panchang on Hamro Patro for BS
2067-2083. Hamro Patro's own "Nepal Sambat" line uses a modern calculation and differs on about one
day in ten.

## License

MIT
