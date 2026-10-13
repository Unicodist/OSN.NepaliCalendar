using System;

namespace OSN.NepaliCalendar;

/// <summary>
/// Decodes <see cref="NepalSambatData"/> into day-by-day tables, indexed by days after BS 1970-01-01.
/// </summary>
internal static class NepalSambatCalendar
{
    private const string StepAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZa";

    // Per day.
    private static readonly byte[] _lunarDays = new byte[NepalSambatData.DayCount];
    private static readonly short[] _monthIndexes = new short[NepalSambatData.DayCount];

    // Per lunar month.
    private static readonly int[] _monthStarts = new int[NepalSambatData.Months.Length];
    private static readonly short[] _years = new short[NepalSambatData.Months.Length];

#pragma warning disable CA1810 // The tables are filled together in one pass.
    static NepalSambatCalendar()
#pragma warning restore CA1810
    {
        var lunarDay = NepalSambatData.FirstTithi;
        var monthIndex = 0;
        var year = NepalSambatData.FirstYear;
        var lastMonth = IsLeap(0) ? 0 : MonthNumber(0);
        _years[0] = (short)year;

        for (var day = 0; day < NepalSambatData.DayCount; day++)
        {
            if (day > 0)
            {
                var step = Step(day - 1);
                var next = (lunarDay - 1 + step) % 30 + 1;
                if (next < lunarDay)
                {
                    // A new lunar month. The year turns over at the first ordinary month whose number is
                    // lower than the previous ordinary month's, which is Kachhala unless it is skipped.
                    monthIndex++;
                    _monthStarts[monthIndex] = day;
                    if (!IsLeap(monthIndex))
                    {
                        var month = MonthNumber(monthIndex);
                        if (lastMonth != 0 && month < lastMonth)
                        {
                            year++;
                        }

                        lastMonth = month;
                    }

                    _years[monthIndex] = (short)year;
                }

                lunarDay = next;
            }

            _lunarDays[day] = (byte)lunarDay;
            _monthIndexes[day] = (short)monthIndex;
        }
    }

    /// <summary>The tithi (1-30) of a day: 1-15 in the bright half, 16-30 in the dark half.</summary>
    internal static int LunarDay(int dayNumber) => _lunarDays[dayNumber];

    internal static int Year(int dayNumber) => _years[_monthIndexes[dayNumber]];

    internal static NepalSambatMonth Month(int dayNumber) => (NepalSambatMonth)MonthNumber(_monthIndexes[dayNumber]);

    internal static bool IsLeapMonth(int dayNumber) => IsLeap(_monthIndexes[dayNumber]);

    /// <summary>Calls <paramref name="found"/> for each day (0, 1 or 2 of them) with the given NS date.</summary>
    internal static void FindDays(int year, NepalSambatMonth month, bool isLeapMonth, int lunarDay, Action<int> found)
    {
        for (var i = 0; i < _monthStarts.Length; i++)
        {
            if (_years[i] != year || MonthNumber(i) != (int)month || IsLeap(i) != isLeapMonth)
            {
                continue;
            }

            var end = i + 1 < _monthStarts.Length ? _monthStarts[i + 1] : NepalSambatData.DayCount;
            for (var day = _monthStarts[i]; day < end; day++)
            {
                if (_lunarDays[day] == lunarDay)
                {
                    found(day);
                }
            }
        }
    }

    private static int Step(int index)
    {
        var value = StepAlphabet.IndexOf(NepalSambatData.Steps[index / 3]);
        return (index % 3) switch
        {
            0 => value / 9,
            1 => value / 3 % 3,
            _ => value % 3,
        };
    }

    private static int MonthNumber(int monthIndex) => char.ToLowerInvariant(NepalSambatData.Months[monthIndex]) - 'a' + 1;

    private static bool IsLeap(int monthIndex) => char.IsUpper(NepalSambatData.Months[monthIndex]);
}
