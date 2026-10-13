namespace OSN.NepaliCalendar;

/// <summary>
/// The calendars a date can be shown in. Get the behaviour of each from <see cref="CalendarSystem.Get"/>.
/// </summary>
/// <remarks>More calendars may be added, so code that switches on this should have a default case.</remarks>
public enum CalendarType
{
    /// <summary>Bikram Sambat (विक्रम संवत्, BS), Nepal's official solar calendar.</summary>
    BikramSambat = 0,

    /// <summary>The Gregorian calendar (ईस्वी संवत्, AD).</summary>
    Gregorian = 1,

    /// <summary>Nepal Sambat (नेपाल संवत्, NS), the lunar calendar.</summary>
    NepalSambat = 2,
}
