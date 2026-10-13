using System;
using System.Collections.Generic;
using System.Text;

namespace OSN.NepaliCalendar;

/// <summary>
/// A day in the Nepal Sambat (नेपाल संवत्) lunar calendar, for example NS 1147 Kachhala Thwa Paru.
/// </summary>
/// <remarks>
/// <para>
/// A Nepal Sambat date is a year, a lunar month, a half (<see cref="Paksha.Thwa"/> or
/// <see cref="Paksha.Ga"/>) and a tithi (lunar day). Each civil day takes the
/// tithi current at sunrise in Kathmandu, following Nepal's official panchang. Because tithis are
/// not exactly a day long, a tithi is sometimes skipped (no day has it) or repeated (two days in a
/// row have it). Two consecutive days can therefore have the same <see cref="Year"/>,
/// <see cref="Month"/>, <see cref="Paksha"/> and <see cref="Tithi"/>; they are still different
/// <see cref="NepalSambatDate"/> values, and <see cref="IsRepeatedTithi"/> is <see langword="true"/> on the second.
/// </para>
/// <para>
/// The year starts on Kachhala Thwa Paru, the first day of Kachhala. That is usually the day of
/// Mha Puja; when the new moon ends after sunrise, Mha Puja is celebrated the evening before.
/// </para>
/// <para>
/// Every <see cref="NepaliDate"/> (BS 1970 to 2090) has a Nepal Sambat date. Use
/// <see cref="FromNepaliDate(NepaliDate)"/>, <see cref="NepaliDate.ToNepalSambatDate"/> or
/// <see cref="FromDateTime(DateTime)"/> to get one, and <see cref="FindDays"/> to go the other way.
/// </para>
/// </remarks>
public readonly struct NepalSambatDate : IEquatable<NepalSambatDate>, IComparable<NepalSambatDate>, IComparable, IFormattable
{
    private static readonly string[] _romanMonthNames =
        ["Kachhala", "Thinla", "Pohela", "Silla", "Chilla", "Chaula", "Bachhala", "Tachhala", "Dilla", "Gunla", "Yanla", "Kaula"];

    private static readonly string[] _nepaliMonthNames =
        ["कछला", "थिंला", "पोहेला", "सिल्ला", "चिल्ला", "चौला", "बछला", "तछला", "दिल्ला", "गुंला", "ञंला", "कौला"];

    // Indexed by tithi - 1 within a paksha. The 15th is the full moon (Punhi) in Thwa and the new moon (Amai) in Ga.
    private static readonly string[] _romanTithiNames =
    [
        "Paru",
        "Dwitiya",
        "Tritiya",
        "Chaturthi",
        "Panchami",
        "Shashthi",
        "Saptami",
        "Ashtami",
        "Navami",
        "Dashami",
        "Ekadashi",
        "Dwadashi",
        "Trayodashi",
        "Chaturdashi",
        "Punhi",
    ];

    private static readonly string[] _nepaliTithiNames =
    [
        "पारू",
        "द्वितीया",
        "तृतीया",
        "चतुर्थी",
        "पञ्चमी",
        "षष्ठी",
        "सप्तमी",
        "अष्टमी",
        "नवमी",
        "दशमी",
        "एकादशी",
        "द्वादशी",
        "त्रयोदशी",
        "चतुर्दशी",
        "पुन्हि",
    ];

    // Days after BS 1970-01-01, so that default(NepalSambatDate) is MinValue.
    private readonly ushort _dayNumber;

    private NepalSambatDate(int dayNumber) => _dayNumber = (ushort)dayNumber;

    /// <summary>The earliest supported date, on BS 1970-01-01 (AD 1913-04-13).</summary>
    public static readonly NepalSambatDate MinValue = new(0);

    /// <summary>The latest supported date, on BS 2090-12-30 (AD 2034-04-13).</summary>
    public static readonly NepalSambatDate MaxValue = new(NepalSambatData.DayCount - 1);

    /// <summary>Gets the Nepal Sambat year, for example 1147.</summary>
    public int Year => NepalSambatCalendar.Year(_dayNumber);

    /// <summary>Gets the lunar month. In a leap month (Anala) this is the month being repeated.</summary>
    public NepalSambatMonth Month => NepalSambatCalendar.Month(_dayNumber);

    /// <summary>Gets whether the day is in a leap month (Anala, अनला), the first of two months with the same name.</summary>
    public bool IsLeapMonth => NepalSambatCalendar.IsLeapMonth(_dayNumber);

    /// <summary>Gets the half of the month: <see cref="Paksha.Thwa"/> (bright) or <see cref="Paksha.Ga"/> (dark).</summary>
    public Paksha Paksha => LunarDay > 15 ? Paksha.Ga : Paksha.Thwa;

    /// <summary>
    /// Gets the tithi within the half, from 1 (Paru) to 15: the full moon (Punhi) in <see cref="Paksha.Thwa"/>
    /// or the new moon (Amai) in <see cref="Paksha.Ga"/>.
    /// </summary>
    public int Tithi => (LunarDay - 1) % 15 + 1;

    /// <summary>Gets the tithi counted through the whole month, from 1 (Thwa Paru) to 30 (Ga Amai).</summary>
    public int LunarDay => NepalSambatCalendar.LunarDay(_dayNumber);

    /// <summary>Gets whether the previous day had the same tithi, so this is the second day of a repeated tithi.</summary>
    public bool IsRepeatedTithi => _dayNumber > 0 && NepalSambatCalendar.LunarDay(_dayNumber - 1) == LunarDay;

    /// <summary>Returns the Nepal Sambat date of a BS date.</summary>
    /// <param name="date">The BS date.</param>
    /// <returns>The Nepal Sambat date on the same day.</returns>
    public static NepalSambatDate FromNepaliDate(NepaliDate date) =>
        new(BsCalendarData.ToDayNumber(date.Year, date.Month, date.Day));

    /// <summary>Returns the Nepal Sambat date of a Gregorian (AD) date.</summary>
    /// <param name="date">The Gregorian date. The time of day is ignored.</param>
    /// <returns>The Nepal Sambat date on the same day.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The date is outside the supported range.</exception>
    public static NepalSambatDate FromDateTime(DateTime date) => FromNepaliDate(NepaliDate.FromDateTime(date));

    /// <summary>Returns the BS date of this day.</summary>
    /// <returns>The <see cref="NepaliDate"/> on the same day.</returns>
    public NepaliDate ToNepaliDate() => BsCalendarData.FromDayNumber(_dayNumber);

    /// <summary>Returns the Gregorian (AD) date of this day.</summary>
    /// <returns>The Gregorian date at midnight, with <see cref="DateTimeKind.Unspecified"/> kind.</returns>
    public DateTime ToDateTime() => BsCalendarData.Anchor.AddDays(_dayNumber);

    /// <summary>
    /// Finds the days that have a Nepal Sambat date.
    /// </summary>
    /// <param name="year">The Nepal Sambat year.</param>
    /// <param name="month">The lunar month.</param>
    /// <param name="paksha">The half of the month.</param>
    /// <param name="tithi">The tithi within the half, from 1 to 15.</param>
    /// <param name="isLeapMonth"><see langword="true"/> for the leap month (Anala) named <paramref name="month"/>.</param>
    /// <returns>
    /// The matching BS dates in order: usually one, two when the tithi is repeated, and none when it is
    /// skipped, when that year has no such leap month, or when the date is outside the supported range.
    /// </returns>
    /// <exception cref="ArgumentOutOfRangeException"><paramref name="month"/>, <paramref name="paksha"/> or <paramref name="tithi"/> is out of range.</exception>
    public static IReadOnlyList<NepaliDate> FindDays(int year, NepalSambatMonth month, Paksha paksha, int tithi, bool isLeapMonth = false)
    {
        if (month < NepalSambatMonth.Kachhala || month > NepalSambatMonth.Kaula)
        {
            throw new ArgumentOutOfRangeException(nameof(month), month, "Month must be between Kachhala and Kaula.");
        }

        if (paksha != Paksha.Thwa && paksha != Paksha.Ga)
        {
            throw new ArgumentOutOfRangeException(nameof(paksha), paksha, "Paksha must be Thwa or Ga.");
        }

        if (tithi < 1 || tithi > 15)
        {
            throw new ArgumentOutOfRangeException(nameof(tithi), tithi, "Tithi must be between 1 and 15.");
        }

        var days = new List<NepaliDate>(2);
        NepalSambatCalendar.FindDays(year, month, isLeapMonth, paksha == Paksha.Ga ? tithi + 15 : tithi, day => days.Add(BsCalendarData.FromDayNumber(day)));
        return days;
    }

    /// <inheritdoc />
    public bool Equals(NepalSambatDate other) => _dayNumber == other._dayNumber;

    /// <inheritdoc />
    public override bool Equals(object? obj) => obj is NepalSambatDate other && Equals(other);

    /// <inheritdoc />
    public override int GetHashCode() => _dayNumber;

    /// <inheritdoc />
    public int CompareTo(NepalSambatDate other) => _dayNumber.CompareTo(other._dayNumber);

    /// <inheritdoc />
    public int CompareTo(object? obj) => obj switch
    {
        null => 1,
        NepalSambatDate other => CompareTo(other),
        _ => throw new ArgumentException($"Object must be of type {nameof(NepalSambatDate)}.", nameof(obj)),
    };

    /// <summary>
    /// Returns the date in Roman script, for example <c>NS 1147 Kachhala Thwa Paru</c>.
    /// </summary>
    public override string ToString() => ToString(null, null);

    /// <summary>
    /// Formats the date in Roman (transliterated) or Nepali (Devanagari) script.
    /// </summary>
    /// <param name="format">
    /// <para>One of:</para>
    /// <list type="table">
    /// <item><term><c>G</c> (default)</term><description>e.g. <c>NS 1147 Kachhala Thwa Paru</c> or <c>ने.सं. ११४७ कछलाथ्व पारू</c>.</description></item>
    /// <item><term><c>M</c></term><description>month, half and tithi, e.g. <c>Kachhala Thwa Paru</c> or <c>कछलाथ्व पारू</c>.</description></item>
    /// <item><term><c>Y</c></term><description>the year, e.g. <c>NS 1147</c> or <c>ने.सं. ११४७</c>.</description></item>
    /// </list>
    /// <para>A leap month is written Anala (अनला), as in <c>NS 1146 Anala Thwa Navami</c>.</para>
    /// </param>
    /// <param name="formatProvider">
    /// <see cref="NepaliDateFormatInfo.Nepali"/> or a Nepali culture (such as <c>ne-NP</c>) for Devanagari;
    /// <see cref="NepaliDateFormatInfo.Roman"/>, any other culture or <see langword="null"/> for Roman script.
    /// </param>
    /// <returns>The formatted date.</returns>
    /// <exception cref="FormatException"><paramref name="format"/> is not G, M or Y.</exception>
    public string ToString(string? format, IFormatProvider? formatProvider)
    {
        var info = NepaliDateFormatInfo.GetInstance(formatProvider);
        var nepali = info.UsesNepaliScript;
        var result = new StringBuilder(32);
        switch (string.IsNullOrEmpty(format) ? "G" : format)
        {
            case "G":
            case "g":
                AppendYear(result, info);
                result.Append(' ');
                AppendMonthAndTithi(result, nepali);
                break;
            case "M":
            case "m":
                AppendMonthAndTithi(result, nepali);
                break;
            case "Y":
            case "y":
                AppendYear(result, info);
                break;
            default:
                throw new FormatException($"'{format}' is not a valid format for {nameof(NepalSambatDate)}. Use G, M or Y.");
        }

        return result.ToString();
    }

    private void AppendYear(StringBuilder result, NepaliDateFormatInfo info)
    {
        result.Append(info.UsesNepaliScript ? "ने.सं. " : "NS ");
        NepaliDateFormatter.AppendNumber(result, Year, 1, info);
    }

    private void AppendMonthAndTithi(StringBuilder result, bool nepali)
    {
        var tithi = Tithi;
        var tithiName = tithi == 15 && Paksha == Paksha.Ga
            ? (nepali ? "आमै" : "Amai")
            : (nepali ? _nepaliTithiNames : _romanTithiNames)[tithi - 1];
        var monthName = IsLeapMonth
            ? (nepali ? "अनला" : "Anala")
            : (nepali ? _nepaliMonthNames : _romanMonthNames)[(int)Month - 1];

        // Devanagari joins the half to the month, as in कछलाथ्व; Roman keeps them apart.
        result.Append(monthName)
            .Append(nepali ? (Paksha == Paksha.Thwa ? "थ्व" : "गा") : (Paksha == Paksha.Thwa ? " Thwa" : " Ga"))
            .Append(' ')
            .Append(tithiName);
    }

#pragma warning disable CS1591 // Operators are self-describing.
    public static bool operator ==(NepalSambatDate left, NepalSambatDate right) => left.Equals(right);

    public static bool operator !=(NepalSambatDate left, NepalSambatDate right) => !left.Equals(right);

    public static bool operator <(NepalSambatDate left, NepalSambatDate right) => left.CompareTo(right) < 0;

    public static bool operator <=(NepalSambatDate left, NepalSambatDate right) => left.CompareTo(right) <= 0;

    public static bool operator >(NepalSambatDate left, NepalSambatDate right) => left.CompareTo(right) > 0;

    public static bool operator >=(NepalSambatDate left, NepalSambatDate right) => left.CompareTo(right) >= 0;
#pragma warning restore CS1591
}
