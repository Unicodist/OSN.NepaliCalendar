using System;
using System.Globalization;
using System.Text;

namespace OSN.NepaliCalendar;

/// <summary>
/// Implements standard and custom format strings for <see cref="NepaliDate"/>.
/// </summary>
internal static class NepaliDateFormatter
{
    private const char NepaliZero = '०'; // ०

    internal static string Format(NepaliDate date, string? format, NepaliDateFormatInfo info)
    {
        if (string.IsNullOrEmpty(format))
        {
            format = "d";
        }

        if (format!.Length == 1)
        {
            format = ExpandStandardFormat(format[0]);
        }

        return FormatCustom(date, format, info);
    }

    private static string ExpandStandardFormat(char format) => format switch
    {
        'd' => "yyyy-MM-dd",
        'D' => "d MMMM yyyy",
        'F' => "dddd, d MMMM yyyy",
        'M' or 'm' => "d MMMM",
        'Y' or 'y' => "MMMM yyyy",
        _ => throw new FormatException($"'{format}' is not a valid standard format for {nameof(NepaliDate)}. Use d, D, F, M or Y, or a custom format."),
    };

    private static string FormatCustom(NepaliDate date, string format, NepaliDateFormatInfo info)
    {
        var result = new StringBuilder(format.Length + 16);
        var i = 0;

        if (format.Length > 1 && format[0] == '%')
        {
            i = 1;
        }

        while (i < format.Length)
        {
            var c = format[i];
            switch (c)
            {
                case 'y':
                    {
                        var count = CountRepeats(format, i);
                        var year = count == 2 ? date.Year % 100 : date.Year;
                        AppendNumber(result, year, count, info);
                        i += count;
                        break;
                    }

                case 'M':
                    {
                        var count = CountRepeats(format, i);
                        if (count >= 3)
                        {
                            result.Append(info.GetMonthName(date.NepaliMonth));
                        }
                        else
                        {
                            AppendNumber(result, date.Month, count, info);
                        }

                        i += count;
                        break;
                    }

                case 'd':
                    {
                        var count = CountRepeats(format, i);
                        if (count >= 4)
                        {
                            result.Append(info.GetDayName(date.DayOfWeek));
                        }
                        else if (count == 3)
                        {
                            result.Append(info.GetAbbreviatedDayName(date.DayOfWeek));
                        }
                        else
                        {
                            AppendNumber(result, date.Day, count, info);
                        }

                        i += count;
                        break;
                    }

                case '\'':
                case '"':
                    {
                        var end = format.IndexOf(c, i + 1);
                        if (end < 0)
                        {
                            throw new FormatException($"Format string has an unterminated quoted string starting at position {i}.");
                        }

                        result.Append(format, i + 1, end - i - 1);
                        i = end + 1;
                        break;
                    }

                case '\\':
                    if (i + 1 >= format.Length)
                    {
                        throw new FormatException("Format string ends with an escape character.");
                    }

                    result.Append(format[i + 1]);
                    i += 2;
                    break;

                default:
                    result.Append(c);
                    i++;
                    break;
            }
        }

        return result.ToString();
    }

    private static int CountRepeats(string format, int start)
    {
        var end = start + 1;
        while (end < format.Length && format[end] == format[start])
        {
            end++;
        }

        return end - start;
    }

    private static void AppendNumber(StringBuilder result, int value, int minDigits, NepaliDateFormatInfo info)
    {
        var digits = value.ToString(CultureInfo.InvariantCulture).PadLeft(minDigits, '0');
        if (!info.UsesNepaliScript)
        {
            result.Append(digits);
            return;
        }

        foreach (var digit in digits)
        {
            result.Append((char)(NepaliZero + (digit - '0')));
        }
    }
}
