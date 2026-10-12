using System;
using System.Collections.Generic;
using System.Globalization;

namespace OSN.NepaliCalendar;

/// <summary>
/// One calendar a <see cref="NepaliDate"/> can be shown in: its names, and how to read a date's year
/// and write the date in it. The same calendars, with the same names, are offered by the npm packages'
/// calendar component.
/// </summary>
/// <example>
/// <code>
/// var date = new NepaliDate(2083, 7, 24);
/// foreach (var calendar in CalendarSystem.All)
/// {
///     Console.WriteLine($"{calendar.GetName()}: {calendar.Format(date)}");
/// }
/// // Bikram Sambat: 2083-07-24
/// // Gregorian: 2026-11-10
/// // Nepal Sambat: NS 1147 Kachhala Thwa Paru
/// </code>
/// </example>
public abstract class CalendarSystem
{
    private readonly string _romanName;
    private readonly string _nepaliName;
    private readonly string _romanAbbreviation;
    private readonly string _nepaliAbbreviation;

    private protected CalendarSystem(CalendarType type, string romanName, string nepaliName, string romanAbbreviation, string nepaliAbbreviation)
    {
        Type = type;
        _romanName = romanName;
        _nepaliName = nepaliName;
        _romanAbbreviation = romanAbbreviation;
        _nepaliAbbreviation = nepaliAbbreviation;
    }

    /// <summary>Gets Bikram Sambat (विक्रम संवत्, BS).</summary>
    public static CalendarSystem BikramSambat { get; } = new BikramSambatSystem();

    /// <summary>Gets the Gregorian calendar (ईस्वी संवत्, AD).</summary>
    public static CalendarSystem Gregorian { get; } = new GregorianSystem();

    /// <summary>Gets Nepal Sambat (नेपाल संवत्, NS).</summary>
    public static CalendarSystem NepalSambat { get; } = new NepalSambatSystem();

    /// <summary>Gets every calendar, in the order <see cref="CalendarType"/> lists them.</summary>
    public static IReadOnlyList<CalendarSystem> All { get; } = [BikramSambat, Gregorian, NepalSambat];

    /// <summary>Gets which calendar this is.</summary>
    public CalendarType Type { get; }

    /// <summary>Returns the calendar of a type.</summary>
    /// <param name="type">The calendar type.</param>
    /// <returns>The calendar.</returns>
    /// <exception cref="ArgumentOutOfRangeException"><paramref name="type"/> is not a defined calendar type.</exception>
    public static CalendarSystem Get(CalendarType type) => type switch
    {
        CalendarType.BikramSambat => BikramSambat,
        CalendarType.Gregorian => Gregorian,
        CalendarType.NepalSambat => NepalSambat,
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Not a defined calendar type."),
    };

    /// <summary>Returns the calendar's name, such as <c>Bikram Sambat</c> or <c>विक्रम संवत्</c>.</summary>
    /// <param name="provider">The script, as for <see cref="NepaliDate.ToString(string?, IFormatProvider?)"/>.</param>
    /// <returns>The name.</returns>
    public string GetName(IFormatProvider? provider = null) =>
        NepaliDateFormatInfo.GetInstance(provider).UsesNepaliScript ? _nepaliName : _romanName;

    /// <summary>Returns the calendar's short name, such as <c>BS</c> or <c>वि.सं.</c>.</summary>
    /// <param name="provider">The script, as for <see cref="NepaliDate.ToString(string?, IFormatProvider?)"/>.</param>
    /// <returns>The short name.</returns>
    public string GetAbbreviation(IFormatProvider? provider = null) =>
        NepaliDateFormatInfo.GetInstance(provider).UsesNepaliScript ? _nepaliAbbreviation : _romanAbbreviation;

    /// <summary>Returns the year of a date in this calendar.</summary>
    /// <param name="nepaliDate">The date.</param>
    /// <returns>The year, such as 2083 (BS), 2026 (AD) or 1147 (NS).</returns>
    public abstract int GetYear(NepaliDate nepaliDate);

    /// <summary>Writes a date in this calendar.</summary>
    /// <param name="nepaliDate">The date.</param>
    /// <param name="format">
    /// A format for this calendar: as for <see cref="NepaliDate.ToString(string?, IFormatProvider?)"/> in
    /// Bikram Sambat, <see cref="DateTime.ToString(string?, IFormatProvider?)"/> in Gregorian (default
    /// <c>yyyy-MM-dd</c>), and <see cref="NepalSambatDate.ToString(string?, IFormatProvider?)"/> in Nepal Sambat.
    /// </param>
    /// <param name="provider">
    /// The script, as for <see cref="NepaliDate.ToString(string?, IFormatProvider?)"/>. In Gregorian, a
    /// culture also supplies the month and day names.
    /// </param>
    /// <returns>The formatted date.</returns>
    /// <exception cref="FormatException"><paramref name="format"/> is not valid for this calendar.</exception>
    public abstract string Format(NepaliDate nepaliDate, string? format = null, IFormatProvider? provider = null);

    /// <summary>Returns the calendar's name in Roman script.</summary>
    /// <returns>The name.</returns>
    public override string ToString() => _romanName;

    private sealed class BikramSambatSystem : CalendarSystem
    {
        public BikramSambatSystem()
            : base(CalendarType.BikramSambat, "Bikram Sambat", "विक्रम संवत्", "BS", "वि.सं.")
        {
        }

        public override int GetYear(NepaliDate nepaliDate) => nepaliDate.Year;

        public override string Format(NepaliDate nepaliDate, string? format = null, IFormatProvider? provider = null) =>
            nepaliDate.ToString(format, provider);
    }

    private sealed class GregorianSystem : CalendarSystem
    {
        public GregorianSystem()
            : base(CalendarType.Gregorian, "Gregorian", "ईस्वी संवत्", "AD", "ई.सं.")
        {
        }

        public override int GetYear(NepaliDate nepaliDate) => nepaliDate.ToDateTime().Year;

        public override string Format(NepaliDate nepaliDate, string? format = null, IFormatProvider? provider = null)
        {
            var culture = provider?.GetFormat(typeof(DateTimeFormatInfo)) is null ? CultureInfo.InvariantCulture : provider;
            var text = nepaliDate.ToDateTime().ToString(string.IsNullOrEmpty(format) ? "yyyy-MM-dd" : format, culture);
            return NepaliDateFormatInfo.GetInstance(provider).UsesNepaliScript ? NepaliDateFormatter.ToNepaliDigits(text) : text;
        }
    }

    private sealed class NepalSambatSystem : CalendarSystem
    {
        public NepalSambatSystem()
            : base(CalendarType.NepalSambat, "Nepal Sambat", "नेपाल संवत्", "NS", "ने.सं.")
        {
        }

        public override int GetYear(NepaliDate nepaliDate) => nepaliDate.NepalSambatYear;

        public override string Format(NepaliDate nepaliDate, string? format = null, IFormatProvider? provider = null) =>
            nepaliDate.ToNepalSambatDate().ToString(format, provider);
    }
}
