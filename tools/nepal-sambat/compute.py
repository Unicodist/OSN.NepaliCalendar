"""Computes the day-by-day Nepal Sambat calendar for the BS range of BsCalendarData."""
import datetime
import os
import re

import model

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
MONTH_LENGTHS_TS = os.path.join(ROOT, 'js', 'packages', 'core', 'src', 'month-lengths.ts')
BS_MIN_YEAR = 1970
BS_ANCHOR = datetime.date(1913, 4, 13)  # BS 1970-01-01


def bs_range():
    rows = [list(map(int, m.group(1).split(','))) for m in re.finditer(r'\[([\d, ]+)\], // \d+', open(MONTH_LENGTHS_TS).read())]
    return BS_ANCHOR, BS_ANCHOR + datetime.timedelta(days=sum(map(sum, rows)) - 1), rows


# Kachhalā is the month that starts with the Sun in Tula (sign index 6).
def ns_month_for_sign(sign):
    return (sign - 6) % 12 + 1


def compute():
    """Returns (days, months).

    days: list of (date, tithi 1-30) for every BS day in range.
    months: list of dicts, one per lunar month touching the range: first date, NS month (1-12), leap flag.
    """
    first, last, _ = bs_range()
    days = []
    d = first
    while d <= last:
        days.append((d, model.tithi(model.sunrise_ah(d))))
        d += datetime.timedelta(days=1)
    # Split into lunar months: a month starts on a day whose tithi is lower than the day before's.
    starts = [0] + [i for i in range(1, len(days)) if days[i][1] < days[i - 1][1]]
    months = []
    for k, i in enumerate(starts):
        ah = model.sunrise_ah(days[i][0])
        nm = model.new_moon_before(ah)
        next_nm = model.new_moon_before(ah + 31) if k + 1 == len(starts) else model.new_moon_before(model.sunrise_ah(days[starts[k + 1]][0]))
        sign, next_sign = model.sign_at(nm), model.sign_at(next_nm)
        months.append({'first': days[i][0], 'start_index': i, 'month': ns_month_for_sign(sign), 'leap': sign == next_sign,
                       'new_moon_ah': nm})
    return days, months


if __name__ == '__main__':
    days, months = compute()
    print(len(days), 'days', len(months), 'months')
    for m in months:
        if m['leap']:
            print('leap', m['first'], m['month'])
    names = [m['month'] for m in months]
    for a, b in zip(months, months[1:]):
        if not a['leap'] and (b['month'] - a['month']) % 12 not in (1,):
            print('odd step', a['first'], a['month'], b['month'], b['leap'])
