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
    [InlineData(2081, 0, 1, "month")]
    [InlineData(2081, 13, 1, "month")]
    [InlineData(2081, 1, 0, "day")]
    [InlineData(2081, 1, 33, "day")]
    public void Constructor_RejectsOutOfRangeComponents(int year, int month, int day, string paramName)
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(() => new NepaliDate(year, month, day));

        Assert.Equal(paramName, ex.ParamName);
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
        Assert.True(new NepaliDate(2081, 2, 1) > new NepaliDate(2081, 1, 32));
        Assert.True(new NepaliDate(2081, 1, 2) >= new NepaliDate(2081, 1, 1));
    }

    [Fact]
    public void ToString_UsesPaddedIsoLikeFormat()
    {
        Assert.Equal("2081-01-05", new NepaliDate(2081, 1, 5).ToString());
    }
}
