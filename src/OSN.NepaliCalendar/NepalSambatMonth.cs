namespace OSN.NepaliCalendar;

/// <summary>
/// Lunar months of the Nepal Sambat calendar. Each runs from the day after one new moon to the next
/// new moon; the year starts with <see cref="Kachhala"/>.
/// </summary>
/// <remarks>
/// About every three years a month repeats. The first of the two is the leap month, Analā (अनला);
/// <see cref="NepalSambatDate.IsLeapMonth"/> is <see langword="true"/> on its days, and
/// <see cref="NepalSambatDate.Month"/> names the month it repeats.
/// </remarks>
public enum NepalSambatMonth
{
    /// <summary>कछला, the first month (about Kartik).</summary>
    Kachhala = 1,

    /// <summary>थिंला, the second month (about Mangsir).</summary>
    Thinla = 2,

    /// <summary>पोहेला, the third month (about Poush).</summary>
    Pohela = 3,

    /// <summary>सिल्ला, the fourth month (about Magh).</summary>
    Silla = 4,

    /// <summary>चिल्ला, the fifth month (about Falgun).</summary>
    Chilla = 5,

    /// <summary>चौला, the sixth month (about Chaitra).</summary>
    Chaula = 6,

    /// <summary>बछला, the seventh month (about Baisakh).</summary>
    Bachhala = 7,

    /// <summary>तछला, the eighth month (about Jestha).</summary>
    Tachhala = 8,

    /// <summary>दिल्ला, the ninth month (about Ashadh).</summary>
    Dilla = 9,

    /// <summary>गुंला, the tenth month (about Shrawan).</summary>
    Gunla = 10,

    /// <summary>ञंला, the eleventh month (about Bhadra).</summary>
    Yanla = 11,

    /// <summary>कौला, the twelfth month (about Ashwin).</summary>
    Kaula = 12,
}
