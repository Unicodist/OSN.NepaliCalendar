using System;
using System.Globalization;

namespace OSN.NepaliCalendar;

/// <summary>
/// A date in the Nepali (Bikram Sambat) calendar.
/// </summary>
/// <remarks>
/// Validation currently checks only general ranges. Per-month day counts depend on the
/// BS calendar data table, which arrives together with AD/BS conversion.
/// </remarks>
public readonly struct NepaliDate : IEquatable<NepaliDate>, IComparable<NepaliDate>, IComparable
{
    internal const int MaxDaysInMonth = 32;

    /// <summary>
    /// Initializes a new <see cref="NepaliDate"/>.
    /// </summary>
    /// <param name="year">The BS year.</param>
    /// <param name="month">The month, from 1 (Baisakh) to 12 (Chaitra).</param>
    /// <param name="day">The day of the month.</param>
    /// <exception cref="ArgumentOutOfRangeException">A component is outside its valid range.</exception>
    public NepaliDate(int year, int month, int day)
    {
        if (year < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(year), year, "Year must be positive.");
        }

        if (month < 1 || month > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), month, "Month must be between 1 and 12.");
        }

        if (day < 1 || day > MaxDaysInMonth)
        {
            throw new ArgumentOutOfRangeException(nameof(day), day, $"Day must be between 1 and {MaxDaysInMonth}.");
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

#pragma warning disable CS1591 // Operators are self-describing.
    public static bool operator ==(NepaliDate left, NepaliDate right) => left.Equals(right);

    public static bool operator !=(NepaliDate left, NepaliDate right) => !left.Equals(right);

    public static bool operator <(NepaliDate left, NepaliDate right) => left.CompareTo(right) < 0;

    public static bool operator <=(NepaliDate left, NepaliDate right) => left.CompareTo(right) <= 0;

    public static bool operator >(NepaliDate left, NepaliDate right) => left.CompareTo(right) > 0;

    public static bool operator >=(NepaliDate left, NepaliDate right) => left.CompareTo(right) >= 0;
#pragma warning restore CS1591
}
