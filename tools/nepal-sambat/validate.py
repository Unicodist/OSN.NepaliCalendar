"""Compares the model with a scraped Hamro Patro panchang, day by day.

    git clone --depth 1 https://github.com/S4NKALP/nepali-calendar-api /tmp/hp
    python3 tools/nepal-sambat/validate.py /tmp/hp/data

Prints, for each BS year, how many days the scraped tithi matches and lists the ones that don't.
The scrape has no paksha, so a tithi is compared by its number within the half.
"""
import datetime
import glob
import json
import os
import sys

import compute

NAMES = [('प्रतिपदा', 1), ('द्वितीया', 2), ('द्दितीया', 2), ('दृतीया', 2), ('तृतीया', 3), ('चतुर्थी', 4), ('पञ्चमी', 5),
         ('षष्ठी', 6), ('सप्तमी', 7), ('अष्टमी', 8), ('नवमी', 9), ('दशमी', 10), ('एकादशी', 11), ('द्वादशी', 12),
         ('त्रयोदशी', 13), ('त्रायोदशी', 13), ('चतुर्दशि', 14), ('चतुर्दशी', 14), ('पुर्णिमा', 15), ('पूर्णिमा', 15),
         ('औसी', 30), ('औशी', 30), ('औंसी', 30)]
DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')


def parse(text):
    found = [(text.find(name), value) for name, value in NAMES if name in text]
    return min(found)[1] if found else None


def half(tithi):
    return tithi if tithi in (15, 30) else (tithi - 1) % 15 + 1


def main(data_dir):
    first, _, rows = compute.bs_range()
    starts, day = {}, first
    for i, row in enumerate(rows):
        for m, length in enumerate(row):
            starts[(compute.BS_MIN_YEAR + i, m + 1)] = day
            day += datetime.timedelta(days=length)
    days, _ = compute.compute()
    model = dict(days)

    for year_dir in sorted(glob.glob(os.path.join(data_dir, '*'))):
        year = int(os.path.basename(year_dir))
        matched, missed = 0, []
        for path in glob.glob(os.path.join(year_dir, '*.json')):
            month = int(os.path.basename(path).split('.')[0])
            if (year, month) not in starts:
                continue
            for cell in json.load(open(path, encoding='utf-8'))['days']:
                number, tithi = cell['n'].strip(), parse(cell['t'])
                if not number or tithi is None:
                    continue
                d = int(number.translate(DIGITS))
                date = starts[(year, month)] + datetime.timedelta(days=d - 1)
                if half(model[date]) == tithi:
                    matched += 1
                else:
                    missed.append(f'{year}-{month:02}-{d:02} scraped {tithi} model {half(model[date])}')
        if matched or missed:
            print(f'BS {year}: {matched} of {matched + len(missed)} match')
            for line in sorted(missed):
                print('  ', line)


if __name__ == '__main__':
    main(sys.argv[1])
