using System;

namespace OSN.NepaliCalendar;

/// <summary>
/// Converts dates between the Gregorian (AD) and Nepali (BS) calendars.
/// </summary>
/// <remarks>
/// Conversion covers BS 1970-01-01 to BS 2090-12-30, which is AD 1913-04-13 to AD 2034-04-13.
/// </remarks>
public static class NepaliDateConverter
{
    /// <summary>
    /// Converts a Gregorian (AD) date to its Nepali (BS) equivalent.
    /// </summary>
    /// <param name="date">The Gregorian date. The time of day and <see cref="DateTime.Kind"/> are ignored.</param>
    /// <returns>The equivalent <see cref="NepaliDate"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The date is outside the supported range.</exception>
    public static NepaliDate ToNepali(DateTime date)
    {
        if (date.Date < BsCalendarData.Anchor || date.Date > BsCalendarData.MaxGregorian)
        {
            throw new ArgumentOutOfRangeException(
                nameof(date),
                date,
                $"Date must be between {BsCalendarData.Anchor:yyyy-MM-dd} and {BsCalendarData.MaxGregorian:yyyy-MM-dd}.");
        }

        return BsCalendarData.FromDayNumber((date.Date - BsCalendarData.Anchor).Days);
    }

    /// <summary>
    /// Converts a Nepali (BS) date to its Gregorian (AD) equivalent.
    /// </summary>
    /// <param name="date">The Nepali date.</param>
    /// <returns>The equivalent Gregorian date at midnight, with <see cref="DateTimeKind.Unspecified"/> kind.</returns>
    /// <exception cref="ArgumentException"><paramref name="date"/> is <c>default(NepaliDate)</c>.</exception>
    public static DateTime ToGregorian(NepaliDate date)
    {
        // Only default(NepaliDate) can bypass the constructor's validation.
        if (!BsCalendarData.IsSupportedYear(date.Year))
        {
            throw new ArgumentException("The date is uninitialized.", nameof(date));
        }

        return BsCalendarData.Anchor.AddDays(BsCalendarData.ToDayNumber(date.Year, date.Month, date.Day));
    }

#if NET6_0_OR_GREATER
    /// <summary>
    /// Converts a Gregorian (AD) date to its Nepali (BS) equivalent.
    /// </summary>
    /// <param name="date">The Gregorian date.</param>
    /// <returns>The equivalent <see cref="NepaliDate"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The date is outside the supported range.</exception>
    public static NepaliDate ToNepali(DateOnly date) => ToNepali(date.ToDateTime(TimeOnly.MinValue));

    /// <summary>
    /// Converts a Nepali (BS) date to its Gregorian (AD) equivalent as a <see cref="DateOnly"/>.
    /// </summary>
    /// <param name="date">The Nepali date.</param>
    /// <returns>The equivalent Gregorian date.</returns>
    public static DateOnly ToGregorianDateOnly(NepaliDate date) => DateOnly.FromDateTime(ToGregorian(date));
#endif
}
