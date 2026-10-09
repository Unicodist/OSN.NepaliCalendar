# OSN.NepaliCalendar

[![CI](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml/badge.svg)](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml)

Nepali (Bikram Sambat) calendar utilities for .NET.

- Represent Nepali (BS) dates with a lightweight `NepaliDate` value type.
- Format Nepali dates in various styles *(planned)*.
- Convert between AD (Gregorian) and BS, from BS 1970 to BS 2090 (AD 1913-04-13 to AD 2034-04-13).
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

## Repository layout

```
src/OSN.NepaliCalendar/          The library (NuGet package)
tests/OSN.NepaliCalendar.Tests/  xUnit tests
Directory.Build.props            Shared build settings and package metadata
Directory.Packages.props         Central package versions
```

## License

[MIT](LICENSE)
