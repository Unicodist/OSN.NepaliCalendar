using System;

namespace OSN.NepaliCalendar;

/// <summary>
/// Converts dates between the Gregorian (AD) and Nepali (BS) calendars.
/// </summary>
public static class NepaliDateConverter
{
    /// <summary>
    /// Converts a Gregorian (AD) date to its Nepali (BS) equivalent.
    /// </summary>
    /// <param name="date">The Gregorian date. The time of day is ignored.</param>
    /// <returns>The equivalent <see cref="NepaliDate"/>.</returns>
    /// <exception cref="NotImplementedException">Conversion is not implemented yet.</exception>
    public static NepaliDate ToNepali(DateTime date) =>
        throw new NotImplementedException("AD to BS conversion is not implemented yet.");

    /// <summary>
    /// Converts a Nepali (BS) date to its Gregorian (AD) equivalent.
    /// </summary>
    /// <param name="date">The Nepali date.</param>
    /// <returns>The equivalent Gregorian date at midnight.</returns>
    /// <exception cref="NotImplementedException">Conversion is not implemented yet.</exception>
    public static DateTime ToGregorian(NepaliDate date) =>
        throw new NotImplementedException("BS to AD conversion is not implemented yet.");
}
