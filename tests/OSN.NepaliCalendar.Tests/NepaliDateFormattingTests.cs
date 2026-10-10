using System;
using System.Globalization;
using Xunit;

namespace OSN.NepaliCalendar.Tests;

public class NepaliDateFormattingTests
{
    // BS 2081-04-15 is AD 2024-07-30, a Tuesday (Mangalbar).
    private static readonly NepaliDate _date = new(2081, 4, 15);

    [Fact]
    public void ToString_DefaultsToIsoLikeFormatWithLatinDigits()
    {
        Assert.Equal("2081-04-15", _date.ToString());
        Assert.Equal("2081-04-15", _date.ToString(null, null));
    }

    [Fact]
    public void ToString_DoesNotDependOnCurrentCulture()
    {
        var original = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = new CultureInfo("ne-NP");
            Assert.Equal("2081-04-15", _date.ToString());
        }
        finally
        {
            CultureInfo.CurrentCulture = original;
        }
    }

    [Theory]
    [InlineData("d", "2081-04-15")]
    [InlineData("D", "15 Shrawan 2081")]
    [InlineData("F", "Mangalbar, 15 Shrawan 2081")]
    [InlineData("M", "15 Shrawan")]
    [InlineData("Y", "Shrawan 2081")]
    public void ToString_StandardFormats_Roman(string format, string expected)
    {
        Assert.Equal(expected, _date.ToString(format, NepaliDateFormatInfo.Roman));
    }

    [Theory]
    [InlineData("d", "२०८१-०४-१५")]
    [InlineData("D", "१५ साउन २०८१")]
    [InlineData("F", "मङ्गलबार, १५ साउन २०८१")]
    [InlineData("M", "१५ साउन")]
    [InlineData("Y", "साउन २०८१")]
    public void ToString_StandardFormats_Nepali(string format, string expected)
    {
        Assert.Equal(expected, _date.ToString(format, NepaliDateFormatInfo.Nepali));
    }

    [Theory]
    [InlineData("yyyy/MM/dd", "2081/04/15")]
    [InlineData("yy-M-d", "81-4-15")]
    [InlineData("dddd", "Mangalbar")]
    [InlineData("ddd d MMMM", "Mangal 15 Shrawan")]
    [InlineData("%d", "15")]
    [InlineData("'Year' yyyy", "Year 2081")]
    [InlineData("\"day\" d", "day 15")]
    [InlineData(@"\d\a\y d", "day 15")]
    public void ToString_CustomFormats_Roman(string format, string expected)
    {
        Assert.Equal(expected, _date.ToString(format, NepaliDateFormatInfo.Roman));
    }

    [Theory]
    [InlineData("yyyy/MM/dd", "२०८१/०४/१५")]
    [InlineData("dddd, d MMMM", "मङ्गलबार, १५ साउन")]
    [InlineData("ddd", "मङ्गल")]
    [InlineData("'साल' yyyy", "साल २०८१")]
    public void ToString_CustomFormats_Nepali(string format, string expected)
    {
        Assert.Equal(expected, _date.ToString(format, NepaliDateFormatInfo.Nepali));
    }

    [Fact]
    public void ToString_SingleDigitComponentsArePaddedOnlyWhenAsked()
    {
        var date = new NepaliDate(2082, 1, 5);

        Assert.Equal("2082-01-05", date.ToString("d", NepaliDateFormatInfo.Roman));
        Assert.Equal("5/1/2082", date.ToString("d/M/yyyy", NepaliDateFormatInfo.Roman));
        Assert.Equal("०५ बैशाख", date.ToString("dd MMMM", NepaliDateFormatInfo.Nepali));
    }

    [Theory]
    [InlineData("ne-NP", "१५ साउन २०८१")]
    [InlineData("ne", "१५ साउन २०८१")]
    [InlineData("en-US", "15 Shrawan 2081")]
    [InlineData("", "15 Shrawan 2081")]
    public void ToString_ChoosesScriptFromCulture(string cultureName, string expected)
    {
        Assert.Equal(expected, _date.ToString("D", new CultureInfo(cultureName)));
    }

    [Fact]
    public void ToString_WorksInInterpolatedStrings()
    {
        Assert.Equal("Date: 15 Shrawan 2081", string.Format(NepaliDateFormatInfo.Roman, "Date: {0:D}", _date));
        Assert.Equal("मिति: १५ साउन २०८१", string.Format(NepaliDateFormatInfo.Nepali, "मिति: {0:D}", _date));
    }

    [Theory]
    [InlineData("x")]
    [InlineData("T")]
    [InlineData("'unterminated")]
    [InlineData(@"yyyy\")]
    public void ToString_RejectsInvalidFormats(string format)
    {
        Assert.Throws<FormatException>(() => _date.ToString(format, NepaliDateFormatInfo.Roman));
    }

    [Fact]
    public void FormatInfo_HasAllMonthAndDayNames()
    {
        foreach (var info in new[] { NepaliDateFormatInfo.Roman, NepaliDateFormatInfo.Nepali })
        {
            for (var month = NepaliMonth.Baisakh; month <= NepaliMonth.Chaitra; month++)
            {
                Assert.False(string.IsNullOrWhiteSpace(info.GetMonthName(month)));
            }

            for (var day = DayOfWeek.Sunday; day <= DayOfWeek.Saturday; day++)
            {
                Assert.False(string.IsNullOrWhiteSpace(info.GetDayName(day)));
                Assert.False(string.IsNullOrWhiteSpace(info.GetAbbreviatedDayName(day)));
            }
        }

        Assert.Equal("Chaitra", NepaliDateFormatInfo.Roman.GetMonthName(NepaliMonth.Chaitra));
        Assert.Equal("चैत", NepaliDateFormatInfo.Nepali.GetMonthName(NepaliMonth.Chaitra));
        Assert.Throws<ArgumentOutOfRangeException>(() => NepaliDateFormatInfo.Roman.GetMonthName((NepaliMonth)13));
    }
}
