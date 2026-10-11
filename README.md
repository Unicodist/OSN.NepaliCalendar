# OSN.NepaliCalendar

[![CI](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml/badge.svg)](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml)

Nepali (Bikram Sambat) calendar utilities for .NET.

- Represent Nepali (BS) dates with a lightweight `NepaliDate` value type.
- Format Nepali dates in Roman (`15 Shrawan 2081`) or Nepali (`१५ साउन २०८१`) script.
- Only dates that exist can be created: invalid dates are rejected, and `IsValid`/`TryCreate` check input without exceptions.
- Convert between AD (Gregorian) and BS, from BS 1970 to BS 2090 (AD 1913-04-13 to AD 2034-04-13).
- React and Angular calendar components, on a TypeScript core, in [`js/`](js/README.md).
- Newari (Nepal Sambat) year support *(future)*.

> **Status:** early scaffolding. The public API is not stable yet.

## Installation

```shell
dotnet add package OSN.NepaliCalendar
```

Targets `net8.0` and `netstandard2.0`.

## Usage

```csharp
using OSN.NepaliCalendar;

var date = new NepaliDate(2081, NepaliMonth.Shrawan, 15);
Console.WriteLine(date);             // 2081-04-15
Console.WriteLine(date.NepaliMonth); // Shrawan

// AD -> BS
NepaliDate newYear = NepaliDateConverter.ToNepali(new DateTime(2025, 4, 14));
Console.WriteLine(newYear);           // 2082-01-01

// BS -> AD
DateTime ad = NepaliDateConverter.ToGregorian(new NepaliDate(2082, 6, 16));
Console.WriteLine(ad.ToString("yyyy-MM-dd")); // 2025-10-02

// Convenience members on NepaliDate
var today = NepaliDate.FromDateTime(DateTime.Today);
Console.WriteLine(today.ToDateTime());
Console.WriteLine(NepaliDate.DaysInMonth(2081, 2)); // 32
```

### Formatting

`ToString()` returns `yyyy-MM-dd` with Latin digits, regardless of the current culture. Pass a
format and `NepaliDateFormatInfo.Roman` or `NepaliDateFormatInfo.Nepali` (or a `ne-NP` culture)
to choose the script:

```csharp
var date = new NepaliDate(2081, 4, 15);

date.ToString();                                  // 2081-04-15
date.ToString("D", NepaliDateFormatInfo.Roman);   // 15 Shrawan 2081
date.ToString("D", NepaliDateFormatInfo.Nepali);  // १५ साउन २०८१
date.ToString("F", NepaliDateFormatInfo.Nepali);  // मङ्गलबार, १५ साउन २०८१
date.ToString("d", new CultureInfo("ne-NP"));     // २०८१-०४-१५
date.ToString("dd/MM/yyyy", NepaliDateFormatInfo.Roman); // 15/04/2081
```

| Format | Roman | Nepali |
| --- | --- | --- |
| `d` (default) | `2081-04-15` | `२०८१-०४-१५` |
| `D` | `15 Shrawan 2081` | `१५ साउन २०८१` |
| `F` | `Mangalbar, 15 Shrawan 2081` | `मङ्गलबार, १५ साउन २०८१` |
| `M` | `15 Shrawan` | `१५ साउन` |
| `Y` | `Shrawan 2081` | `साउन २०८१` |

Custom formats use `yyyy`, `yy`, `MMMM` (month name), `MM`, `M`, `dddd` (weekday), `ddd`
(short weekday), `dd` and `d`; quote literal text (`'Year' yyyy`) or escape it with `\`.

### Validation

A `NepaliDate` always holds a real date. The constructors throw `ArgumentOutOfRangeException`
for a year outside BS 1970-2090, a month outside 1-12, or a day past the end of that month
(for example BS 2081-01-32), and `default(NepaliDate)` is `NepaliDate.MinValue` rather than an
empty date.

```csharp
NepaliDate.IsValid(2081, 2, 32);   // true: Jestha 2081 has 32 days
NepaliDate.IsValid(2081, 1, 32);   // false: Baisakh 2081 has 31 days

if (NepaliDate.TryCreate(year, month, day, out var parsed))
{
    // use parsed
}
```

Dates outside the supported range throw `ArgumentOutOfRangeException`; see
`NepaliDate.MinValue` and `NepaliDate.MaxValue`. On .NET 6+ the converter also accepts and
returns `DateOnly`.

BS month lengths come from the published Nepali calendar, not a formula, so they are stored in a
table. The table was cross-checked against six open-source BS calendar libraries and the majority
value kept where they disagreed. Years after 2083 are projections in every source and may change
once the official calendar for those years is published.

## Building

Requires the .NET 8 SDK or later.

```shell
dotnet build
dotnet test
dotnet pack src/OSN.NepaliCalendar -c Release -o artifacts
```

Release steps are in [RELEASING.md](RELEASING.md), and the history of each release is in
[CHANGELOG.md](CHANGELOG.md).

## Repository layout

```
src/OSN.NepaliCalendar/          The library (NuGet package)
tests/OSN.NepaliCalendar.Tests/  xUnit tests
Directory.Build.props            Shared build settings and package metadata
Directory.Packages.props         Central package versions
js/                              npm workspaces: TypeScript core, React and Angular components
```

## License

[MIT](LICENSE)
