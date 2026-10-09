# OSN.NepaliCalendar

[![CI](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml/badge.svg)](https://github.com/Unicodist/OSN.NepaliCalendar/actions/workflows/ci.yml)

Nepali (Bikram Sambat) calendar utilities for .NET.

- Represent Nepali (BS) dates with a lightweight `NepaliDate` value type.
- Format Nepali dates in various styles *(planned)*.
- Convert between AD (Gregorian) and BS *(planned)*.
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
```

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
