using System;
using System.Globalization;

namespace OSN.NepaliCalendar;

/// <summary>
/// A date in the Nepali (Bikram Sambat) calendar.
/// </summary>
/// <remarks>
/// Supported dates run from <see cref="MinValue"/> (BS 1970-01-01) to <see cref="MaxValue"/>
/// (BS 2090-12-30), the range covered by the built-in calendar data. Every valid
/// <see cref="NepaliDate"/> can be converted to and from a Gregorian date.
/// </remarks>
public readonly struct NepaliDate : IEquatable<NepaliDate>, IComparable<NepaliDate>, IComparable
{
    /// <summary>The earliest supported date, BS 1970-01-01 (AD 1913-04-13).</summary>
    public static readonly NepaliDate MinValue = new(BsCalendarData.MinYear, 1, 1);

    /// <summary>The latest supported date, BS 2090-12-30 (AD 2034-04-13).</summary>
    public static readonly NepaliDate MaxValue = new(BsCalendarData.MaxYear, 12, DaysInMonth(BsCalendarData.MaxYear, 12));

    /// <summary>
    /// Initializes a new <see cref="NepaliDate"/>.
    /// </summary>
    /// <param name="year">The BS year, from 1970 to 2090.</param>
    /// <param name="month">The month, from 1 (Baisakh) to 12 (Chaitra).</param>
    /// <param name="day">The day of the month, from 1 to the month's length in that year.</param>
    /// <exception cref="ArgumentOutOfRangeException">A component is outside its valid range.</exception>
    public NepaliDate(int year, int month, int day)
    {
        ValidateYearAndMonth(year, month);

        var daysInMonth = BsCalendarData.DaysInMonth(year, month);
        if (day < 1 || day > daysInMonth)
        {
            throw new ArgumentOutOfRangeException(nameof(day), day, $"Day must be between 1 and {daysInMonth} for {year}-{month:D2}.");
        }

        Year = year;
        Month = month;
        Day = day;
    }

    /// <summary>
    /// Initializes a new <see cref="NepaliDate"/> from a <see cref="NepaliMonth"/>.
    /// </summary>
    /// <param name="year">The BS year.</param>
    /// <param name="month">The month.</param>
    /// <param name="day">The day of the month.</param>
    /// <exception cref="ArgumentOutOfRangeException">A component is outside its valid range.</exception>
    public NepaliDate(int year, NepaliMonth month, int day)
        : this(year, (int)month, day)
    {
    }

    /// <summary>Gets the BS year.</summary>
    public int Year { get; }

    /// <summary>Gets the month number, from 1 (Baisakh) to 12 (Chaitra).</summary>
    public int Month { get; }

    /// <summary>Gets the day of the month.</summary>
    public int Day { get; }

    /// <summary>Gets the month as a <see cref="NepaliMonth"/>.</summary>
    public NepaliMonth NepaliMonth => (NepaliMonth)Month;

    /// <summary>Gets the day of the week.</summary>
    public DayOfWeek DayOfWeek => ToDateTime().DayOfWeek;

    /// <summary>
    /// Returns the number of days in a month of a BS year.
    /// </summary>
    /// <param name="year">The BS year, from 1970 to 2090.</param>
    /// <param name="month">The month, from 1 (Baisakh) to 12 (Chaitra).</param>
    /// <returns>The number of days, from 29 to 32.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The year or month is outside its valid range.</exception>
    public static int DaysInMonth(int year, int month)
    {
        ValidateYearAndMonth(year, month);
        return BsCalendarData.DaysInMonth(year, month);
    }

    /// <summary>
    /// Converts a Gregorian (AD) date to its Nepali (BS) equivalent.
    /// </summary>
    /// <param name="date">The Gregorian date. The time of day is ignored.</param>
    /// <returns>The equivalent <see cref="NepaliDate"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The date is outside the supported range.</exception>
    public static NepaliDate FromDateTime(DateTime date) => NepaliDateConverter.ToNepali(date);

    /// <summary>
    /// Converts this date to its Gregorian (AD) equivalent.
    /// </summary>
    /// <returns>The equivalent Gregorian date at midnight, with <see cref="DateTimeKind.Unspecified"/> kind.</returns>
    public DateTime ToDateTime() => NepaliDateConverter.ToGregorian(this);

    /// <inheritdoc />
    public bool Equals(NepaliDate other) => Year == other.Year && Month == other.Month && Day == other.Day;

    /// <inheritdoc />
    public override bool Equals(object? obj) => obj is NepaliDate other && Equals(other);

    /// <inheritdoc />
    public override int GetHashCode() => (Year * 100 + Month) * 100 + Day;

    /// <inheritdoc />
    public int CompareTo(NepaliDate other)
    {
        var result = Year.CompareTo(other.Year);
        if (result != 0)
        {
            return result;
        }

        result = Month.CompareTo(other.Month);
        return result != 0 ? result : Day.CompareTo(other.Day);
    }

    /// <inheritdoc />
    public int CompareTo(object? obj) => obj switch
    {
        null => 1,
        NepaliDate other => CompareTo(other),
        _ => throw new ArgumentException($"Object must be of type {nameof(NepaliDate)}.", nameof(obj)),
    };

    /// <summary>
    /// Returns the date in ISO-like <c>yyyy-MM-dd</c> form, for example <c>2081-01-01</c>.
    /// </summary>
    public override string ToString() =>
        string.Format(CultureInfo.InvariantCulture, "{0:D4}-{1:D2}-{2:D2}", Year, Month, Day);

    private static void ValidateYearAndMonth(int year, int month)
    {
        if (!BsCalendarData.IsSupportedYear(year))
        {
            throw new ArgumentOutOfRangeException(nameof(year), year, $"Year must be between {BsCalendarData.MinYear} and {BsCalendarData.MaxYear}.");
        }

        if (month < 1 || month > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), month, "Month must be between 1 and 12.");
        }
    }

#pragma warning disable CS1591 // Operators are self-describing.
    public static bool operator ==(NepaliDate left, NepaliDate right) => left.Equals(right);

    public static bool operator !=(NepaliDate left, NepaliDate right) => !left.Equals(right);

    public static bool operator <(NepaliDate left, NepaliDate right) => left.CompareTo(right) < 0;

    public static bool operator <=(NepaliDate left, NepaliDate right) => left.CompareTo(right) <= 0;

    public static bool operator >(NepaliDate left, NepaliDate right) => left.CompareTo(right) > 0;

    public static bool operator >=(NepaliDate left, NepaliDate right) => left.CompareTo(right) >= 0;
#pragma warning restore CS1591
}
