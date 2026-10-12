# Nepal Sambat table

`generate.py` writes the Nepal Sambat data for both packages:
`src/OSN.NepaliCalendar/NepalSambatData.cs` and `js/packages/core/src/nepal-sambat-data.ts`. A JS
test checks that the two are identical. Run it after changing the BS table or the model:

```shell
python3 -m pip install ephem
python3 tools/nepal-sambat/generate.py
```

`validate.py` compares the table with a scraped Hamro Patro panchang day by day; its docstring
says how to get the data.

## The model

`model.py` reproduces how Nepal's panchang committee (Nepal Panchanga Nirnayak Bikas Samiti) sets
the tithi of each day:

- The Sun and Moon are the Surya Siddhanta's true positions, with the committee's bija for the
  Moon's apogee (488,199 revolutions per mahayuga instead of 488,203).
- Each day takes the tithi current at a modern sunrise in Kathmandu (upper limb at -34').
- Lunar months are amanta (new moon to new moon). A month is named by the sign the Surya Siddhanta
  Sun is in at the new moon that starts it. A month with no sankranti repeats the next month's name
  and is the leap month, Anala.
- The Nepal Sambat year turns over on the first day of the ordinary (non-leap) Kachhala, which is
  Kachhala Thwa Paru. The year number is anchored to Hamro Patro's NS 1147 on BS 2083-07-24.

The table stores how far the tithi moves each day (0 for a repeated tithi, 1, or 2 for a skipped
one), three days per character, and one character per lunar month for its name and leap flag.

## How it was checked (October 2026)

- **Day by day:** against the tithi of all 6,209 days of BS 2067-2083 in the panchang as scraped
  from Hamro Patro (github.com/S4NKALP/nepali-calendar-api). 6,120 match. Of the 89 that don't:
  - 43 (in BS 2067, 2070, 2071 and early 2074, mostly runs of days shifted by one tithi) are where a
    second, independent scrape (github.com/bibhuticoder/nepali-calendar-api) agrees with this table.
  - 43 are in BS 2074 from Kartik and in BS 2077. In those stretches the scrape matches a modern
    (drik) calculation exactly, as Ashesh Patro does, rather than the committee's. No other source
    for those years was found, so they keep the committee's method; this is unconfirmed.
  - 1 (BS 2083-04-08) has since been corrected on Hamro Patro, which now agrees with this table.
  - 2 (BS 2075-03-30 and 2075-11-04) are unexplained.
- **End times:** Hamro Patro's tithi end times for Ashwin 2083 are a modern calculation and do not
  decide the day. The committee's own times, as published, match this model within about 1.5
  minutes (github.com/teispace/teistro-sdk pull 232).
- **Leap months:** the panchang's adhik mas of BS 2072 (Asar 2-31), 2080 (Shrawan 2-31) and 2083
  (Jestha 3 to Asar 1) match to the day.
- **New years:** Mha Puja dates 2011-10-27 (NS 1132), 2024-11-02, 2025-10-22 and 2026-11-10 match.
- **Hamro Patro day pages** for 15 days of 2079 and 2083 match, including a skipped tithi
  (2083-06-19) and a repeated one (2083-07-01 and 02). These are in the .NET and JS tests.

## Known limits

- **Ashesh Patro** uses a modern (drik) calculation too, so it differs from the panchang on the same
  days as Hamro Patro's NS line.
- **Hamro Patro's "Nepal Sambat" line** on each day page uses a modern (drik) calculation, not the
  panchang's. It differs from the panchang tithi, and so from this table, on about 35 days a year.
  This table follows the panchang.
- **Before BS 2067** the only day-by-day source found (bibhuticoder) is noisy. The model agrees with
  it on 95-99% of days a year, and most differences are runs of shifted days. The rest are tithis
  ending within an hour of sunrise, where the older panchang may have used a slightly different
  method. Those years are the model's output.
- **After BS 2083** no panchang has been published, so the table is the model's output. BS 2085 is
  unusual: the model gives a leap Kachhala (BS 2085-07-03 to 08-01), a skipped Pohela and a leap
  Chaula. Re-check it when the panchang for that year comes out.
- **Mha Puja** is celebrated on the day Kachhala Thwa Paru begins by the evening. When the new moon
  ends after sunrise (BS 2076, 2077) the festival falls a day before the NS new-year date.
