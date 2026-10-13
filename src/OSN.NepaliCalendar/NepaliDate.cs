using System;

namespace OSN.NepaliCalendar;

/// <summary>
/// A date in the Nepali (Bikram Sambat) calendar.
/// </summary>
/// <remarks>
/// <para>
/// Supported dates run from <see cref="MinValue"/> (BS 1970-01-01) to <see cref="MaxValue"/>
/// (BS 2090-12-30), the range covered by the built-in calendar data. Every valid
/// <see cref="NepaliDate"/> can be converted to and from a Gregorian date.
/// </para>
/// <para>
/// A <see cref="NepaliDate"/> always holds a date that exists in the calendar: the constructors
/// reject impossible dates such as BS 2081-01-32, and <c>default(NepaliDate)</c> is
/// <see cref="MinValue"/> rather than an empty 0000-00-00. Use <see cref="TryCreate(int, int, int, out NepaliDate)"/>
/// or <see cref="IsValid(int, int, int)"/> to check user input without catching exceptions.
/// </para>
/// </remarks>
public readonly struct NepaliDate : IEquatable<NepaliDate>, IComparable<NepaliDate>, IComparable, IFormattable
{
    // Components are stored as offsets from MinValue so that default(NepaliDate) is a real date
    // (BS 1970-01-01) instead of the non-existent 0000-00-00.
    private readonly short _yearOffset;
    private readonly byte _monthOffset;
    private readonly byte _dayOffset;

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

        _yearOffset = (short)(year - BsCalendarData.MinYear);
        _monthOffset = (byte)(month - 1);
        _dayOffset = (byte)(day - 1);
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
    public int Year => BsCalendarData.MinYear + _yearOffset;

    /// <summary>Gets the month number, from 1 (Baisakh) to 12 (Chaitra).</summary>
    public int Month => _monthOffset + 1;

    /// <summary>Gets the day of the month.</summary>
    public int Day => _dayOffset + 1;

    /// <summary>Gets the month as a <see cref="NepaliMonth"/>.</summary>
    public NepaliMonth NepaliMonth => (NepaliMonth)Month;

    /// <summary>Gets the day of the week.</summary>
    public DayOfWeek DayOfWeek => ToDateTime().DayOfWeek;

    /// <summary>
    /// Gets the Nepal Sambat year of this day: <c>Year - 937</c> before the Nepal Sambat new year
    /// (Kachhala Thwa Paru, around Mha Puja in Kartik) and <c>Year - 936</c> from it.
    /// </summary>
    public int NepalSambatYear => NepalSambatCalendar.Year(BsCalendarData.ToDayNumber(Year, Month, Day));

    /// <summary>Returns the Nepal Sambat (lunar) date of this day.</summary>
    /// <returns>The <see cref="NepalSambatDate"/> on the same day.</returns>
    public NepalSambatDate ToNepalSambatDate() => NepalSambatDate.FromNepaliDate(this);

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
    /// Returns whether a year, month and day form a date that exists in the supported range.
    /// </summary>
    /// <param name="year">The BS year.</param>
    /// <param name="month">The month, from 1 (Baisakh) to 12 (Chaitra).</param>
    /// <param name="day">The day of the month.</param>
    /// <returns><see langword="true"/> if <c>new NepaliDate(year, month, day)</c> would succeed.</returns>
    public static bool IsValid(int year, int month, int day) =>
        BsCalendarData.IsSupportedYear(year)
        && month >= 1 && month <= 12
        && day >= 1 && day <= BsCalendarData.DaysInMonth(year, month);

    /// <summary>
    /// Creates a <see cref="NepaliDate"/> without throwing when the date does not exist.
    /// </summary>
    /// <param name="year">The BS year.</param>
    /// <param name="month">The month, from 1 (Baisakh) to 12 (Chaitra).</param>
    /// <param name="day">The day of the month.</param>
    /// <param name="result">The date when this method returns <see langword="true"/>; otherwise <see cref="MinValue"/>.</param>
    /// <returns><see langword="true"/> if the date exists; otherwise <see langword="false"/>.</returns>
    public static bool TryCreate(int year, int month, int day, out NepaliDate result)
    {
        if (!IsValid(year, month, day))
        {
            result = default;
            return false;
        }

        result = new NepaliDate(year, month, day);
        return true;
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
    /// Returns the date in ISO-like <c>yyyy-MM-dd</c> form with Latin digits, for example <c>2081-01-01</c>.
    /// </summary>
    /// <remarks>The result does not depend on the current culture.</remarks>
    public override string ToString() => ToString(null, null);

    /// <summary>
    /// Formats the date with Latin digits and Roman (transliterated) month and day names.
    /// </summary>
    /// <param name="format">A standard or custom format string; see <see cref="ToString(string?, IFormatProvider?)"/>.</param>
    /// <returns>The formatted date.</returns>
    /// <exception cref="FormatException"><paramref name="format"/> is not a valid format string.</exception>
    public string ToString(string? format) => ToString(format, null);

    /// <summary>
    /// Formats the date in Roman (transliterated) or Nepali (Devanagari) script.
    /// </summary>
    /// <param name="format">
    /// <para>A standard format, one of:</para>
    /// <list type="table">
    /// <item><term><c>d</c> (default)</term><description><c>yyyy-MM-dd</c>, e.g. <c>2081-04-15</c> or <c>२०८१-०४-१५</c>.</description></item>
    /// <item><term><c>D</c></term><description><c>d MMMM yyyy</c>, e.g. <c>15 Shrawan 2081</c> or <c>१५ साउन २०८१</c>.</description></item>
    /// <item><term><c>F</c></term><description><c>dddd, d MMMM yyyy</c>, e.g. <c>Budhabar, 15 Shrawan 2081</c> or <c>बुधबार, १५ साउन २०८१</c>.</description></item>
    /// <item><term><c>M</c></term><description><c>d MMMM</c>, e.g. <c>15 Shrawan</c>.</description></item>
    /// <item><term><c>Y</c></term><description><c>MMMM yyyy</c>, e.g. <c>Shrawan 2081</c>.</description></item>
    /// </list>
    /// <para>
    /// or a custom format built from <c>yyyy</c>/<c>yy</c>/<c>y</c> (year), <c>MMMM</c> (month name),
    /// <c>MM</c>/<c>M</c> (month number), <c>dddd</c>/<c>ddd</c> (full/short weekday name) and
    /// <c>dd</c>/<c>d</c> (day). Text in single or double quotes, and a character after <c>\</c>, is
    /// copied as is; prefix a one-letter custom format with <c>%</c>, as in <c>%d</c>.
    /// </para>
    /// </param>
    /// <param name="formatProvider">
    /// <see cref="NepaliDateFormatInfo.Nepali"/> or a Nepali culture (such as <c>ne-NP</c>) for Devanagari
    /// digits and names; <see cref="NepaliDateFormatInfo.Roman"/>, any other culture or
    /// <see langword="null"/> for Latin digits and Roman names.
    /// </param>
    /// <returns>The formatted date.</returns>
    /// <exception cref="FormatException"><paramref name="format"/> is not a valid format string.</exception>
    public string ToString(string? format, IFormatProvider? formatProvider) =>
        NepaliDateFormatter.Format(this, format, NepaliDateFormatInfo.GetInstance(formatProvider));

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
