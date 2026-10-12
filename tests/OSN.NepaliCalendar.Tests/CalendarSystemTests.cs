using System;
using System.Globalization;
using System.Linq;
using Xunit;

namespace OSN.NepaliCalendar.Tests;

public class CalendarSystemTests
{
    private static readonly NepaliDate _nepalSambatNewYear = new(2083, 7, 24);

    [Fact]
    public void All_HasOneCalendarPerType()
    {
        var types = Enum.GetValues(typeof(CalendarType)).Cast<CalendarType>().ToArray();

        Assert.Equal(types, CalendarSystem.All.Select(c => c.Type));
        foreach (var type in types)
        {
            Assert.Same(CalendarSystem.All[(int)type], CalendarSystem.Get(type));
        }

        Assert.Same(CalendarSystem.NepalSambat, CalendarSystem.Get(CalendarType.NepalSambat));
        Assert.Throws<ArgumentOutOfRangeException>(() => CalendarSystem.Get((CalendarType)99));
    }

    [Theory]
    [InlineData(CalendarType.BikramSambat, "Bikram Sambat", "विक्रम संवत्", "BS", "वि.सं.")]
    [InlineData(CalendarType.Gregorian, "Gregorian", "ईस्वी संवत्", "AD", "ई.सं.")]
    [InlineData(CalendarType.NepalSambat, "Nepal Sambat", "नेपाल संवत्", "NS", "ने.सं.")]
    public void Names_AreInBothScripts(CalendarType type, string roman, string nepali, string romanShort, string nepaliShort)
    {
        var calendar = CalendarSystem.Get(type);

        Assert.Equal(roman, calendar.GetName(NepaliDateFormatInfo.Roman));
        Assert.Equal(roman, calendar.ToString());
        Assert.Equal(nepali, calendar.GetName(NepaliDateFormatInfo.Nepali));
        Assert.Equal(nepali, calendar.GetName(new CultureInfo("ne-NP")));
        Assert.Equal(romanShort, calendar.GetAbbreviation(NepaliDateFormatInfo.Roman));
        Assert.Equal(nepaliShort, calendar.GetAbbreviation(NepaliDateFormatInfo.Nepali));
    }

    [Theory]
    [InlineData(CalendarType.BikramSambat, 2083, "2083-07-24", "२०८३-०७-२४")]
    [InlineData(CalendarType.Gregorian, 2026, "2026-11-10", "२०२६-११-१०")]
    [InlineData(CalendarType.NepalSambat, 1147, "NS 1147 Kachhala Thwa Paru", "ने.सं. ११४७ कछलाथ्व पारू")]
    public void GetYearAndFormat_UseTheCalendar(CalendarType type, int year, string roman, string nepali)
    {
        var calendar = CalendarSystem.Get(type);

        Assert.Equal(year, calendar.GetYear(_nepalSambatNewYear));
        Assert.Equal(roman, calendar.Format(_nepalSambatNewYear, null, NepaliDateFormatInfo.Roman));
        Assert.Equal(nepali, calendar.Format(_nepalSambatNewYear, null, NepaliDateFormatInfo.Nepali));
    }

    [Fact]
    public void Format_PassesTheFormatToTheCalendar()
    {
        Assert.Equal("24 Kartik 2083", CalendarSystem.BikramSambat.Format(_nepalSambatNewYear, "D", NepaliDateFormatInfo.Roman));
        Assert.Equal("10 November 2026", CalendarSystem.Gregorian.Format(_nepalSambatNewYear, "d MMMM yyyy", NepaliDateFormatInfo.Roman));
        Assert.Equal("10 novembre 2026", CalendarSystem.Gregorian.Format(_nepalSambatNewYear, "d MMMM yyyy", new CultureInfo("fr-FR")));
        Assert.Equal("NS 1147", CalendarSystem.NepalSambat.Format(_nepalSambatNewYear, "Y", NepaliDateFormatInfo.Roman));
        Assert.Throws<FormatException>(() => CalendarSystem.NepalSambat.Format(_nepalSambatNewYear, "D", NepaliDateFormatInfo.Roman));
    }
}
