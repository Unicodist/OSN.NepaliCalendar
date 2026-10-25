# Changelog

Every release of the NuGet package (`OSN.NepaliCalendar`) and of the npm packages
(`@opensourcenepal/nepali-calendar`, `-react` and `-angular`) is listed here, newest first. The
same notes are on the [GitHub Releases](https://github.com/Unicodist/OSN.NepaliCalendar/releases)
page.

The release workflow adds each entry when a version tag is pushed, so there is no need to edit this
file by hand. See [RELEASING.md](RELEASING.md) for how to cut a release.

<!-- New releases are added below this line by .github/workflows/release.yml. -->

## npm 1.3.0 (2026-10-25)

### New features

- **Nepal Sambat.** The calendars can show Nepal Sambat as a third calendar, with a full lunar
  month grid (lunar month, leap month, paksha and tithi for every day). The selected value is
  still a BS date; React `onChange` and Angular `dateSelect` now also carry the NS date.
- **Calendar dropdown.** The calendars take `calendar="bs" | "ad" | "ns"` and offer the
  calendars in a dropdown instead of the BS/AD toggle button. Limit the choices with `calendars`.
  The Angular component also answers to `<osn-calendar>`.
- **Pick a month or a year.** `pick="month"` or `pick="year"` lets the user choose only a month
  or a year. The value is the first day of the picked period (or `min`, if that is later).
- **Core:** every BS date has a Nepal Sambat date, each calendar is an object with the same
  shape (`CalendarDefinition`, `getCalendar`, `CALENDARS`, `CalendarType`), and
  `buildMonthPicker`, `buildYearPicker` and `pickedDate` lay out the month and year pickers.

### Upgrading

- The BS/AD button (`button.osn-cal__system`) is now a `select.osn-cal__calendar`. Update any
  CSS that targets the old class.
- `CalendarType` and `onCalendarChange`/`calendarChange` can now be `'ns'`, and Nepal Sambat is
  in the dropdown by default. Pass `calendars={['bs', 'ad']}` to keep only BS and AD.
- `CalendarSystem` still works but is deprecated; use `CalendarType`.

React and Angular now depend on `@opensourcenepal/nepali-calendar` `^1.3.0`, which npm installs
for you.

## npm 1.2.0 (2026-10-11)

### New features

- **BS/AD switch.** A toolbar button switches the calendar grid between Bikram Sambat and Gregorian
  months. In AD, each day shows the BS date under it. The value is still a `BsDate`.
  - React: `calendar`, `defaultCalendar`, `onCalendarChange` and `showCalendarToggle` props.
  - Angular: `calendar` input with `[(calendar)]`, `calendarChange` output and
    `showCalendarToggle` input.
  - Both export the `CalendarSystem` type.
- **Core:** `buildAdMonthView`, `shiftAdMonth`, `clampAdMonth`, `isAdMonthInRange`,
  `supportedAdYears`, `convertMonth` and `FULL_AD_MONTH_NAMES`, plus `buildCalendarView`,
  `clampCalendarMonth`, `isCalendarMonthInRange`, `calendarYears`, `calendarMonthNames` and
  `dayLabel`, which work with either calendar. `styles.css` styles the new button.

React and Angular now depend on core `^1.2.0`.

## npm 1.1.0 (2026-10-10)

### New features

- **Min and max dates.** React and Angular take inclusive `min` and `max` BS dates. Days outside
  them are disabled, and the month arrows, arrow keys and year and month pickers stop at them.
- **Angular forms:** a value outside the range makes the control invalid with a `minDate` or
  `maxDate` error.
- **Core:** month-view days have `isDisabled`, and there are new range helpers: `isInRange`,
  `clampBs`, `clampMonth`, `isMonthInRange`, and a range argument for `shiftMonth` and
  `supportedYears`.

## npm 1.0.2 (2026-10-10)

First stable release of `@opensourcenepal/nepali-calendar` (TypeScript core) and its React and
Angular date pickers, with BS/AD conversion, Nepali and Roman script, and year and month pickers.
The Angular package ships `styles.css`.
