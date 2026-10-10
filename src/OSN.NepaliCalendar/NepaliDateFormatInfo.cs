using System;
using System.Globalization;

namespace OSN.NepaliCalendar;

/// <summary>
/// Supplies the script used to format a <see cref="NepaliDate"/>: Roman (transliterated) month and
/// day names with Latin digits, or Nepali (Devanagari) names and digits.
/// </summary>
/// <example>
/// <code>
/// var date = new NepaliDate(2081, 4, 15);
/// date.ToString("D", NepaliDateFormatInfo.Roman);  // 15 Shrawan 2081
/// date.ToString("D", NepaliDateFormatInfo.Nepali); // १५ साउन २०८१
/// </code>
/// </example>
public sealed class NepaliDateFormatInfo : IFormatProvider
{
    private static readonly string[] _romanMonthNames =
    [
        "Baisakh",
        "Jestha",
        "Ashadh",
        "Shrawan",
        "Bhadra",
        "Ashwin",
        "Kartik",
        "Mangsir",
        "Poush",
        "Magh",
        "Falgun",
        "Chaitra",
    ];

    private static readonly string[] _nepaliMonthNames =
    [
        "बैशाख",
        "जेठ",
        "असार",
        "साउन",
        "भदौ",
        "असोज",
        "कात्तिक",
        "मंसिर",
        "पुस",
        "माघ",
        "फागुन",
        "चैत",
    ];

    // Indexed by DayOfWeek, so Sunday (आइतबार) comes first.
    private static readonly string[] _romanDayNames =
        ["Aaitabar", "Sombar", "Mangalbar", "Budhabar", "Bihibar", "Shukrabar", "Shanibar"];

    private static readonly string[] _romanAbbreviatedDayNames =
        ["Aaita", "Som", "Mangal", "Budha", "Bihi", "Shukra", "Shani"];

    private static readonly string[] _nepaliDayNames =
        ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];

    private static readonly string[] _nepaliAbbreviatedDayNames =
        ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

    private readonly string[] _monthNames;
    private readonly string[] _dayNames;
    private readonly string[] _abbreviatedDayNames;

    private NepaliDateFormatInfo(bool usesNepaliScript, string[] monthNames, string[] dayNames, string[] abbreviatedDayNames)
    {
        UsesNepaliScript = usesNepaliScript;
        _monthNames = monthNames;
        _dayNames = dayNames;
        _abbreviatedDayNames = abbreviatedDayNames;
    }

    /// <summary>Gets the Roman format: <c>15 Shrawan 2081</c>. This is the default.</summary>
    public static NepaliDateFormatInfo Roman { get; } =
        new(false, _romanMonthNames, _romanDayNames, _romanAbbreviatedDayNames);

    /// <summary>Gets the Nepali (Devanagari) format: <c>१५ साउन २०८१</c>.</summary>
    public static NepaliDateFormatInfo Nepali { get; } =
        new(true, _nepaliMonthNames, _nepaliDayNames, _nepaliAbbreviatedDayNames);

    /// <summary>Gets whether this format writes Devanagari digits and names.</summary>
    public bool UsesNepaliScript { get; }

    /// <summary>
    /// Returns the format to use for a format provider.
    /// </summary>
    /// <param name="provider">
    /// A <see cref="NepaliDateFormatInfo"/>, a provider that supplies one, or a culture. Nepali cultures
    /// (language <c>ne</c>, such as <c>ne-NP</c>) map to <see cref="Nepali"/>; anything else, including
    /// <see langword="null"/>, maps to <see cref="Roman"/>.
    /// </param>
    /// <returns>The format to use.</returns>
    public static NepaliDateFormatInfo GetInstance(IFormatProvider? provider)
    {
        if (provider is NepaliDateFormatInfo info)
        {
            return info;
        }

        if (provider?.GetFormat(typeof(NepaliDateFormatInfo)) is NepaliDateFormatInfo supplied)
        {
            return supplied;
        }

        return provider is CultureInfo culture && culture.TwoLetterISOLanguageName == "ne" ? Nepali : Roman;
    }

    /// <summary>Returns the name of a month, such as <c>Shrawan</c> or <c>साउन</c>.</summary>
    /// <param name="month">The month.</param>
    /// <returns>The month name.</returns>
    /// <exception cref="ArgumentOutOfRangeException"><paramref name="month"/> is not a defined month.</exception>
    public string GetMonthName(NepaliMonth month)
    {
        if (month < NepaliMonth.Baisakh || month > NepaliMonth.Chaitra)
        {
            throw new ArgumentOutOfRangeException(nameof(month), month, "Month must be between Baisakh and Chaitra.");
        }

        return _monthNames[(int)month - 1];
    }

    /// <summary>Returns the name of a day of the week, such as <c>Aaitabar</c> or <c>आइतबार</c>.</summary>
    /// <param name="dayOfWeek">The day of the week.</param>
    /// <returns>The day name.</returns>
    /// <exception cref="ArgumentOutOfRangeException"><paramref name="dayOfWeek"/> is not a defined day.</exception>
    public string GetDayName(DayOfWeek dayOfWeek) => _dayNames[ValidateDayOfWeek(dayOfWeek)];

    /// <summary>Returns the short name of a day of the week, such as <c>Aaita</c> or <c>आइत</c>.</summary>
    /// <param name="dayOfWeek">The day of the week.</param>
    /// <returns>The short day name.</returns>
    /// <exception cref="ArgumentOutOfRangeException"><paramref name="dayOfWeek"/> is not a defined day.</exception>
    public string GetAbbreviatedDayName(DayOfWeek dayOfWeek) => _abbreviatedDayNames[ValidateDayOfWeek(dayOfWeek)];

    /// <inheritdoc />
    public object? GetFormat(Type? formatType) => formatType == typeof(NepaliDateFormatInfo) ? this : null;

    private static int ValidateDayOfWeek(DayOfWeek dayOfWeek)
    {
        if (dayOfWeek < DayOfWeek.Sunday || dayOfWeek > DayOfWeek.Saturday)
        {
            throw new ArgumentOutOfRangeException(nameof(dayOfWeek), dayOfWeek, "Day of week must be between Sunday and Saturday.");
        }

        return (int)dayOfWeek;
    }
}
