## New features

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

## Upgrading

- The BS/AD button (`button.osn-cal__system`) is now a `select.osn-cal__calendar`. Update any
  CSS that targets the old class.
- `CalendarType` and `onCalendarChange`/`calendarChange` can now be `'ns'`, and Nepal Sambat is
  in the dropdown by default. Pass `calendars={['bs', 'ad']}` to keep only BS and AD.
- `CalendarSystem` still works but is deprecated; use `CalendarType`.

React and Angular now depend on `@opensourcenepal/nepali-calendar` `^1.3.0`, which npm installs
for you.
