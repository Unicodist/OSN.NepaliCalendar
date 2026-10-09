using System;
using Xunit;

namespace OSN.NepaliCalendar.Tests;

public class NepaliDateConverterTests
{
    // Dates with a well-documented BS/AD correspondence.
    public static TheoryData<int, int, int, string> ReferenceDates => new()
    {
        { 1970, 1, 1, "1913-04-13" },  // Start of the supported range
        { 1990, 10, 2, "1934-01-15" }, // Nepal-Bihar earthquake
        { 2000, 1, 1, "1943-04-14" },  // New year 2000
        { 2007, 11, 7, "1951-02-18" }, // Democracy Day
        { 2063, 1, 11, "2006-04-24" }, // Loktantra Diwas
        { 2065, 2, 15, "2008-05-28" }, // Republic Day
        { 2072, 1, 12, "2015-04-25" }, // Gorkha earthquake
        { 2072, 6, 3, "2015-09-20" },  // Constitution Day
        { 2079, 1, 1, "2022-04-14" },  // New year 2079
        { 2080, 1, 1, "2023-04-14" },  // New year 2080
        { 2081, 1, 1, "2024-04-13" },  // New year 2081
        { 2081, 12, 31, "2025-04-13" }, // Last day of 2081
        { 2082, 1, 1, "2025-04-14" },  // New year 2082
        { 2082, 6, 16, "2025-10-02" }, // Vijaya Dashami 2082
        { 2083, 1, 1, "2026-04-14" },  // New year 2083
        { 2090, 12, 30, "2034-04-13" }, // End of the supported range
    };

    [Theory]
    [MemberData(nameof(ReferenceDates))]
    public void ToGregorian_MatchesReferenceDates(int year, int month, int day, string expected)
    {
        Assert.Equal(Parse(expected), NepaliDateConverter.ToGregorian(new NepaliDate(year, month, day)));
    }

    [Theory]
    [MemberData(nameof(ReferenceDates))]
    public void ToNepali_MatchesReferenceDates(int year, int month, int day, string gregorian)
    {
        Assert.Equal(new NepaliDate(year, month, day), NepaliDateConverter.ToNepali(Parse(gregorian)));
    }

    [Fact]
    public void ToNepali_IgnoresTimeOfDayAndKind()
    {
        var date = new DateTime(2024, 4, 13, 23, 59, 59, DateTimeKind.Utc);

        Assert.Equal(new NepaliDate(2081, 1, 1), NepaliDateConverter.ToNepali(date));
    }

    [Fact]
    public void Conversion_RoundTripsEveryDayInRange()
    {
        var gregorian = NepaliDate.MinValue.ToDateTime();
        var expected = NepaliDate.MinValue;
        var days = 0;

        while (true)
        {
            var nepali = NepaliDateConverter.ToNepali(gregorian);
            Assert.Equal(expected, nepali);
            Assert.Equal(gregorian, NepaliDateConverter.ToGregorian(nepali));

            if (nepali == NepaliDate.MaxValue)
            {
                break;
            }

            expected = Next(expected);
            gregorian = gregorian.AddDays(1);
            days++;
        }

        Assert.Equal((NepaliDate.MaxValue.ToDateTime() - NepaliDate.MinValue.ToDateTime()).Days, days);
    }

    [Fact]
    public void Range_MatchesDocumentedBounds()
    {
        Assert.Equal(new NepaliDate(1970, 1, 1), NepaliDate.MinValue);
        Assert.Equal(new NepaliDate(2090, 12, 30), NepaliDate.MaxValue);
        Assert.Equal(new DateTime(1913, 4, 13), NepaliDate.MinValue.ToDateTime());
        Assert.Equal(new DateTime(2034, 4, 13), NepaliDate.MaxValue.ToDateTime());
    }

    [Theory]
    [InlineData("1913-04-12")]
    [InlineData("2034-04-14")]
    [InlineData("0001-01-01")]
    [InlineData("9999-12-31")]
    public void ToNepali_RejectsDatesOutsideRange(string gregorian)
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(() => NepaliDateConverter.ToNepali(Parse(gregorian)));

        Assert.Equal("date", ex.ParamName);
    }

    [Fact]
    public void ToGregorian_RejectsDefaultValue()
    {
        Assert.Throws<ArgumentException>(() => NepaliDateConverter.ToGregorian(default));
    }

    [Fact]
    public void YearLengths_AreRealistic()
    {
        for (var year = NepaliDate.MinValue.Year; year <= NepaliDate.MaxValue.Year; year++)
        {
            var total = 0;
            for (var month = 1; month <= 12; month++)
            {
                var days = NepaliDate.DaysInMonth(year, month);
                Assert.InRange(days, 29, 32);
                total += days;
            }

            Assert.InRange(total, 365, 366);
        }
    }

    [Theory]
    [InlineData(2081, 1, 31)]
    [InlineData(2081, 2, 32)]
    [InlineData(2081, 9, 29)]
    [InlineData(2081, 12, 31)]
    public void DaysInMonth_ReturnsMonthLength(int year, int month, int expected)
    {
        Assert.Equal(expected, NepaliDate.DaysInMonth(year, month));
    }

    [Theory]
    [InlineData(1969, 1, "year")]
    [InlineData(2091, 1, "year")]
    [InlineData(2081, 0, "month")]
    [InlineData(2081, 13, "month")]
    public void DaysInMonth_RejectsOutOfRange(int year, int month, string paramName)
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(() => NepaliDate.DaysInMonth(year, month));

        Assert.Equal(paramName, ex.ParamName);
    }

    [Fact]
    public void NepaliDate_ConvenienceMethodsMatchConverter()
    {
        var gregorian = new DateTime(2025, 10, 2);
        var nepali = NepaliDate.FromDateTime(gregorian);

        Assert.Equal(new NepaliDate(2082, 6, 16), nepali);
        Assert.Equal(gregorian, nepali.ToDateTime());
        Assert.Equal(DayOfWeek.Thursday, nepali.DayOfWeek);
    }

#if NET6_0_OR_GREATER
    [Fact]
    public void DateOnlyOverloads_Convert()
    {
        var nepali = NepaliDateConverter.ToNepali(new DateOnly(2024, 4, 13));

        Assert.Equal(new NepaliDate(2081, 1, 1), nepali);
        Assert.Equal(new DateOnly(2024, 4, 13), NepaliDateConverter.ToGregorianDateOnly(nepali));
    }
#endif

    private static DateTime Parse(string value) =>
        DateTime.ParseExact(value, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);

    private static NepaliDate Next(NepaliDate date)
    {
        if (date.Day < NepaliDate.DaysInMonth(date.Year, date.Month))
        {
            return new NepaliDate(date.Year, date.Month, date.Day + 1);
        }

        return date.Month < 12 ? new NepaliDate(date.Year, date.Month + 1, 1) : new NepaliDate(date.Year + 1, 1, 1);
    }
}
