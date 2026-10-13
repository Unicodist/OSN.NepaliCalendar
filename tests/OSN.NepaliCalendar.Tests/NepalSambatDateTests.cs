using System;
using System.Linq;
using Xunit;

namespace OSN.NepaliCalendar.Tests;

public class NepalSambatDateTests
{
    // Each row is a day's tithi in Nepal's official panchang, as Hamro Patro showed it in October 2026.
    [Theory]
    [InlineData(2083, 6, 10, 1146, NepalSambatMonth.Yanla, Paksha.Thwa, 15, "NS 1146 Yanla Thwa Punhi")]
    [InlineData(2083, 6, 11, 1146, NepalSambatMonth.Yanla, Paksha.Ga, 1, "NS 1146 Yanla Ga Paru")]
    [InlineData(2083, 6, 18, 1146, NepalSambatMonth.Yanla, Paksha.Ga, 8, "NS 1146 Yanla Ga Ashtami")]
    [InlineData(2083, 6, 19, 1146, NepalSambatMonth.Yanla, Paksha.Ga, 10, "NS 1146 Yanla Ga Dashami")]
    [InlineData(2083, 6, 24, 1146, NepalSambatMonth.Yanla, Paksha.Ga, 15, "NS 1146 Yanla Ga Amai")]
    [InlineData(2083, 6, 25, 1146, NepalSambatMonth.Kaula, Paksha.Thwa, 1, "NS 1146 Kaula Thwa Paru")]
    [InlineData(2083, 7, 1, 1146, NepalSambatMonth.Kaula, Paksha.Thwa, 8, "NS 1146 Kaula Thwa Ashtami")]
    [InlineData(2083, 7, 2, 1146, NepalSambatMonth.Kaula, Paksha.Thwa, 8, "NS 1146 Kaula Thwa Ashtami")]
    [InlineData(2083, 7, 12, 1146, NepalSambatMonth.Kaula, Paksha.Ga, 4, "NS 1146 Kaula Ga Chaturthi")]
    [InlineData(2083, 7, 23, 1146, NepalSambatMonth.Kaula, Paksha.Ga, 15, "NS 1146 Kaula Ga Amai")]
    [InlineData(2083, 7, 24, 1147, NepalSambatMonth.Kachhala, Paksha.Thwa, 1, "NS 1147 Kachhala Thwa Paru")]
    [InlineData(2083, 8, 4, 1147, NepalSambatMonth.Kachhala, Paksha.Thwa, 11, "NS 1147 Kachhala Thwa Ekadashi")]
    [InlineData(2083, 4, 4, 1146, NepalSambatMonth.Dilla, Paksha.Thwa, 6, "NS 1146 Dilla Thwa Shashthi")]
    [InlineData(2083, 10, 14, 1147, NepalSambatMonth.Pohela, Paksha.Ga, 6, "NS 1147 Pohela Ga Shashthi")]
    [InlineData(2079, 6, 30, 1142, NepalSambatMonth.Kaula, Paksha.Ga, 6, "NS 1142 Kaula Ga Shashthi")]
    public void FromNepaliDate_MatchesThePanchang(int year, int month, int day, int nsYear, NepalSambatMonth nsMonth, Paksha paksha, int tithi, string text)
    {
        var date = new NepaliDate(year, month, day).ToNepalSambatDate();

        Assert.Equal(nsYear, date.Year);
        Assert.Equal(nsMonth, date.Month);
        Assert.False(date.IsLeapMonth);
        Assert.Equal(paksha, date.Paksha);
        Assert.Equal(tithi, date.Tithi);
        Assert.Equal(text, date.ToString());
    }

    [Fact]
    public void RepeatedAndSkippedTithis()
    {
        // Ashtami fell on both Kartik 1 and 2, 2083; Navami was skipped on Ashwin 19.
        Assert.False(new NepaliDate(2083, 7, 1).ToNepalSambatDate().IsRepeatedTithi);
        Assert.True(new NepaliDate(2083, 7, 2).ToNepalSambatDate().IsRepeatedTithi);

        Assert.Equal(
            [new NepaliDate(2083, 7, 1), new NepaliDate(2083, 7, 2)],
            NepalSambatDate.FindDays(1146, NepalSambatMonth.Kaula, Paksha.Thwa, 8));
        Assert.Empty(NepalSambatDate.FindDays(1146, NepalSambatMonth.Yanla, Paksha.Ga, 9));
        Assert.Equal([new NepaliDate(2083, 7, 24)], NepalSambatDate.FindDays(1147, NepalSambatMonth.Kachhala, Paksha.Thwa, 1));
    }

    // Leap months (adhik mas) the panchang marked: 2072 Asar 2-31, 2080 Shrawan 2-31, 2083 Jestha 3 to Asar 1.
    [Theory]
    [InlineData(2072, 3, 2, 2072, 3, 31, NepalSambatMonth.Dilla)]
    [InlineData(2080, 4, 2, 2080, 4, 31, NepalSambatMonth.Gunla)]
    [InlineData(2083, 2, 3, 2083, 3, 1, NepalSambatMonth.Tachhala)]
    public void LeapMonths(int firstYear, int firstMonth, int firstDay, int lastYear, int lastMonth, int lastDay, NepalSambatMonth month)
    {
        var first = new NepaliDate(firstYear, firstMonth, firstDay);
        var last = new NepaliDate(lastYear, lastMonth, lastDay);

        Assert.False(first.AddDaysForTest(-1).ToNepalSambatDate().IsLeapMonth);
        Assert.False(last.AddDaysForTest(1).ToNepalSambatDate().IsLeapMonth);
        for (var date = first; date <= last; date = date.AddDaysForTest(1))
        {
            var ns = date.ToNepalSambatDate();
            Assert.True(ns.IsLeapMonth);
            Assert.Equal(month, ns.Month);
        }

        // The ordinary month of the same name follows the leap month.
        Assert.Equal(month, last.AddDaysForTest(1).ToNepalSambatDate().Month);
    }

    [Fact]
    public void LeapMonth_IsWrittenAnala()
    {
        var date = new NepaliDate(2083, 2, 10).ToNepalSambatDate();

        Assert.Equal("NS 1146 Anala Thwa Ashtami", date.ToString());
        Assert.Equal("ने.सं. ११४६ अनलाथ्व अष्टमी", date.ToString(null, NepaliDateFormatInfo.Nepali));
        Assert.Equal([new NepaliDate(2083, 2, 10)], NepalSambatDate.FindDays(1146, NepalSambatMonth.Tachhala, Paksha.Thwa, 8, isLeapMonth: true));
    }

    [Theory]
    [InlineData("G", "ने.सं. ११४७ कछलाथ्व पारू")]
    [InlineData("M", "कछलाथ्व पारू")]
    [InlineData("Y", "ने.सं. ११४७")]
    public void ToString_Nepali(string format, string expected) =>
        Assert.Equal(expected, new NepaliDate(2083, 7, 24).ToNepalSambatDate().ToString(format, NepaliDateFormatInfo.Nepali));

    [Theory]
    [InlineData("G", "NS 1146 Yanla Ga Amai")]
    [InlineData("M", "Yanla Ga Amai")]
    [InlineData("Y", "NS 1146")]
    public void ToString_Roman(string format, string expected) =>
        Assert.Equal(expected, new NepaliDate(2083, 6, 24).ToNepalSambatDate().ToString(format, null));

    [Fact]
    public void ToString_RejectsUnknownFormats() =>
        Assert.Throws<FormatException>(() => new NepaliDate(2083, 6, 24).ToNepalSambatDate().ToString("d", null));

    // The new year (Kachhala Thwa Paru) on Mha Puja, from published Tihar dates.
    [Theory]
    [InlineData(2068, 7, 10, 1132)] // 2011-10-27
    [InlineData(2081, 7, 17, 1145)] // 2024-11-02
    [InlineData(2082, 7, 5, 1146)] // 2025-10-22
    [InlineData(2083, 7, 24, 1147)] // 2026-11-10
    public void NewYear(int year, int month, int day, int nsYear)
    {
        var newYear = new NepaliDate(year, month, day);

        Assert.Equal(nsYear, newYear.NepalSambatYear);
        Assert.Equal(nsYear - 1, newYear.AddDaysForTest(-1).NepalSambatYear);
        Assert.Equal(NepalSambatMonth.Kachhala, newYear.ToNepalSambatDate().Month);
        Assert.Equal(1, newYear.ToNepalSambatDate().LunarDay);
    }

    [Fact]
    public void NepalSambatYear_IsBsYearMinus937BeforeTheNewYearAnd936After()
    {
        for (var date = NepaliDate.MinValue; ; date = date.AddDaysForTest(1))
        {
            var ns = date.ToNepalSambatDate();
            var afterNewYear = date.Month > 8 || (date.Month >= 7 && ns.Month is >= NepalSambatMonth.Kachhala and <= NepalSambatMonth.Chilla && !(ns.Month == NepalSambatMonth.Kachhala && ns.IsLeapMonth));
            Assert.Equal(date.Year - (afterNewYear ? 936 : 937), date.NepalSambatYear);
            if (date == NepaliDate.MaxValue)
            {
                break;
            }
        }
    }

    [Fact]
    public void EveryDay_FollowsTheLunarSequence()
    {
        var previous = NepalSambatDate.MinValue;
        var date = NepaliDate.MinValue.AddDaysForTest(1);
        while (true)
        {
            var current = date.ToNepalSambatDate();
            var step = (current.LunarDay - previous.LunarDay + 30) % 30;
            Assert.InRange(step, 0, 2);
            Assert.Equal(step == 0, current.IsRepeatedTithi);
            if (current.LunarDay < previous.LunarDay)
            {
                Assert.InRange(current.LunarDay, 1, 2);
            }
            else
            {
                Assert.Equal(previous.Month, current.Month);
                Assert.Equal(previous.Year, current.Year);
            }

            Assert.Equal(current, NepalSambatDate.FromDateTime(date.ToDateTime()));
            Assert.Equal(date, current.ToNepaliDate());
            Assert.Contains(date, NepalSambatDate.FindDays(current.Year, current.Month, current.Paksha, current.Tithi, current.IsLeapMonth));

            previous = current;
            if (date == NepaliDate.MaxValue)
            {
                break;
            }

            date = date.AddDaysForTest(1);
        }

        Assert.Equal(NepalSambatDate.MaxValue, previous);
    }

    [Fact]
    public void RangeEnds()
    {
        Assert.Equal(new DateTime(1913, 4, 13), NepalSambatDate.MinValue.ToDateTime());
        Assert.Equal(NepaliDate.MaxValue, NepalSambatDate.MaxValue.ToNepaliDate());
        Assert.Equal(NepalSambatDate.MinValue, default);
        Assert.Equal(1033, NepaliDate.MinValue.NepalSambatYear);
    }

    [Fact]
    public void FindDays_ValidatesArguments()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => NepalSambatDate.FindDays(1147, 0, Paksha.Thwa, 1));
        Assert.Throws<ArgumentOutOfRangeException>(() => NepalSambatDate.FindDays(1147, NepalSambatMonth.Kachhala, (Paksha)2, 1));
        Assert.Throws<ArgumentOutOfRangeException>(() => NepalSambatDate.FindDays(1147, NepalSambatMonth.Kachhala, Paksha.Thwa, 16));
        Assert.Empty(NepalSambatDate.FindDays(900, NepalSambatMonth.Kachhala, Paksha.Thwa, 1));
    }

    [Fact]
    public void Comparison()
    {
        var a = new NepaliDate(2083, 7, 1).ToNepalSambatDate();
        var b = new NepaliDate(2083, 7, 2).ToNepalSambatDate();

        Assert.True(a < b);
        Assert.NotEqual(a, b);
        Assert.Equal(-1, a.CompareTo(b));
        Assert.Equal(1, a.CompareTo(null));
        Assert.Equal(new[] { a, b }, new[] { b, a }.OrderBy(d => d));
    }
}

internal static class NepaliDateTestExtensions
{
    public static NepaliDate AddDaysForTest(this NepaliDate date, int days) => NepaliDate.FromDateTime(date.ToDateTime().AddDays(days));
}
