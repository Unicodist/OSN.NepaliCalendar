using System;
using Xunit;

namespace OSN.NepaliCalendar.Tests;

public class NepaliDateTests
{
    [Fact]
    public void Constructor_SetsComponents()
    {
        var date = new NepaliDate(2081, 4, 15);

        Assert.Equal(2081, date.Year);
        Assert.Equal(4, date.Month);
        Assert.Equal(15, date.Day);
        Assert.Equal(NepaliMonth.Shrawan, date.NepaliMonth);
    }

    [Fact]
    public void Constructor_AcceptsNepaliMonth()
    {
        Assert.Equal(new NepaliDate(2081, 12, 30), new NepaliDate(2081, NepaliMonth.Chaitra, 30));
    }

    [Theory]
    [InlineData(0, 1, 1, "year")]
    [InlineData(1969, 12, 30, "year")]
    [InlineData(2091, 1, 1, "year")]
    [InlineData(2081, 0, 1, "month")]
    [InlineData(2081, 13, 1, "month")]
    [InlineData(2081, 1, 0, "day")]
    [InlineData(2081, 1, 32, "day")]
    [InlineData(2081, 2, 33, "day")]
    public void Constructor_RejectsOutOfRangeComponents(int year, int month, int day, string paramName)
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(() => new NepaliDate(year, month, day));

        Assert.Equal(paramName, ex.ParamName);
    }

    [Theory]
    [InlineData(2081, 1, 31)]
    [InlineData(2081, 2, 32)]
    [InlineData(2081, 12, 31)]
    [InlineData(1970, 1, 1)]
    [InlineData(2090, 12, 30)]
    public void IsValid_AcceptsExistingDates(int year, int month, int day)
    {
        Assert.True(NepaliDate.IsValid(year, month, day));
        Assert.True(NepaliDate.TryCreate(year, month, day, out var date));
        Assert.Equal(new NepaliDate(year, month, day), date);
    }

    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(1969, 12, 30)]
    [InlineData(2091, 1, 1)]
    [InlineData(2081, 0, 1)]
    [InlineData(2081, 13, 1)]
    [InlineData(2081, 1, 0)]
    [InlineData(2081, 1, 32)]
    [InlineData(2081, 12, 32)]
    [InlineData(2081, 2, 33)]
    [InlineData(2081, 1, -1)]
    public void IsValid_RejectsDatesThatDoNotExist(int year, int month, int day)
    {
        Assert.False(NepaliDate.IsValid(year, month, day));
        Assert.False(NepaliDate.TryCreate(year, month, day, out var date));
        Assert.Equal(NepaliDate.MinValue, date);
    }

    [Fact]
    public void IsValid_AgreesWithMonthLengthsForEverySupportedMonth()
    {
        for (var year = NepaliDate.MinValue.Year; year <= NepaliDate.MaxValue.Year; year++)
        {
            for (var month = 1; month <= 12; month++)
            {
                var length = NepaliDate.DaysInMonth(year, month);
                Assert.True(NepaliDate.IsValid(year, month, length));
                Assert.False(NepaliDate.IsValid(year, month, length + 1));
                Assert.Throws<ArgumentOutOfRangeException>(() => new NepaliDate(year, month, length + 1));
            }
        }
    }

    [Fact]
    public void Default_IsMinValueRatherThanAnInvalidDate()
    {
        NepaliDate date = default;

        Assert.Equal(NepaliDate.MinValue, date);
        Assert.Equal(1970, date.Year);
        Assert.Equal(1, date.Month);
        Assert.Equal(1, date.Day);
        Assert.Equal(new DateTime(1913, 4, 13), date.ToDateTime());
    }

    [Fact]
    public void Equality_ComparesAllComponents()
    {
        var a = new NepaliDate(2081, 1, 1);

        Assert.True(a == new NepaliDate(2081, 1, 1));
        Assert.True(a != new NepaliDate(2081, 1, 2));
        Assert.Equal(a.GetHashCode(), new NepaliDate(2081, 1, 1).GetHashCode());
    }

    [Fact]
    public void Comparison_OrdersByYearThenMonthThenDay()
    {
        Assert.True(new NepaliDate(2080, 12, 30) < new NepaliDate(2081, 1, 1));
        Assert.True(new NepaliDate(2081, 2, 1) > new NepaliDate(2081, 1, 31));
        Assert.True(new NepaliDate(2081, 1, 2) >= new NepaliDate(2081, 1, 1));
    }

    [Fact]
    public void ToString_UsesPaddedIsoLikeFormat()
    {
        Assert.Equal("2081-01-05", new NepaliDate(2081, 1, 5).ToString());
    }
}
