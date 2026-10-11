## New features

### Switch the calendar between BS and AD months

The calendar toolbar has a new button that switches the grid from Bikram Sambat months to Gregorian
(AD) months and back. In AD, each day shows its AD date with the BS date under it, and the header
names the BS months the AD month spans. The selected value is still a `BsDate`, so existing code
keeps working.

**React** (`@opensourcenepal/nepali-calendar-react`)

- `defaultCalendar` sets the calendar shown first (`'bs'` by default).
- `calendar` and `onCalendarChange` let your code control it.
- `showCalendarToggle={false}` hides the button.

```tsx
<NepaliCalendar defaultCalendar="ad" />
```

**Angular** (`@opensourcenepal/nepali-calendar-angular`)

- `calendar` sets the calendar and supports `[(calendar)]`; `calendarChange` emits when the user
  switches.
- `[showCalendarToggle]="false"` hides the button.

```html
<osn-nepali-calendar calendar="ad" />
```

Both packages also export the `CalendarSystem` type (`'bs' | 'ad'`).

**Core** (`@opensourcenepal/nepali-calendar`)

- `buildAdMonthView(year, month, options)` lays out a Gregorian month with the BS date of each day.
- `shiftAdMonth`, `clampAdMonth`, `isAdMonthInRange` and `supportedAdYears` work on AD months and
  take the same `{ min, max }` BS range as their BS versions.
- `convertMonth(year, month, from, to)` returns the month to show after switching calendars.
- `buildCalendarView`, `clampCalendarMonth`, `isCalendarMonthInRange`, `calendarYears`,
  `calendarMonthNames` and `dayLabel` take a `'bs' | 'ad'` system, so one code path handles both.
- `FULL_AD_MONTH_NAMES` holds the full Gregorian month names.
- `styles.css` styles the new toggle button.

## Upgrading

No changes are needed. The BS/AD button appears in the toolbar by default; set
`showCalendarToggle` to `false` to keep the previous toolbar. React and Angular now depend on
`@opensourcenepal/nepali-calendar` `^1.1.1`, which npm installs for you.

**Full changelog**: https://github.com/Unicodist/OSN.NepaliCalendar/compare/ab9d58d...npm-v1.1.1
