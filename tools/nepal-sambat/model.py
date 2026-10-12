"""The lunar model behind the Nepal Sambat table.

Tithis follow Nepal's official panchang (Nepal Panchanga Nirnayak Bikas Samiti):
- Sun and Moon are the Surya Siddhanta's true (manda-corrected) positions.
- The Moon's apogee uses the committee's bija: 488,199 revolutions per mahayuga instead of 488,203.
- A day takes the tithi current at a modern sunrise in Kathmandu (upper limb at -34', no further
  refraction), not the Surya Siddhanta's own sunrise.

Lunar months are amanta (new moon to new moon). A month is named by the sidereal sign the
Surya Siddhanta Sun is in at the new moon that starts it; a month that contains no sankranti
repeats the next month's name and is the leap month (Analā).
"""
import datetime
import math

import ephem  # pip install ephem; only used for sunrise

CIVIL_DAYS = 1577917828.0  # civil days in a mahayuga
SUN_REVS = 4320000
MOON_REVS = 57753336
MOON_APOGEE_REVS = 488203 - 4  # Nepal committee bija
KALI_JD = 588465.5 - 75.7683 / 360  # Kali epoch: mean midnight at Ujjain
SUN_APOGEE = 77 + 17 / 60

KATHMANDU = ('27.7172', '85.3240', 1340)
NPT = datetime.timedelta(hours=5, minutes=45)
EPHEM_JD0 = 2415020.0


def _manda(mean, apogee, epicycle_odd, epicycle_even):
    anomaly = math.radians(mean - apogee)
    epicycle = epicycle_odd - (epicycle_odd - epicycle_even) * abs(math.sin(anomaly))
    return (mean - math.degrees(math.asin(epicycle / 360 * math.sin(anomaly)))) % 360


def sun(ah):
    """True sidereal longitude of the Sun, ah days after the Kali epoch."""
    return _manda((360 * SUN_REVS * ah / CIVIL_DAYS) % 360, SUN_APOGEE, 14, 13 + 40 / 60)


def moon(ah):
    """True sidereal longitude of the Moon, ah days after the Kali epoch."""
    mean = (360 * MOON_REVS * ah / CIVIL_DAYS) % 360
    apogee = (360 * MOON_APOGEE_REVS * ah / CIVIL_DAYS + 90) % 360
    return _manda(mean, apogee, 32, 31 + 40 / 60)


def elongation(ah):
    return (moon(ah) - sun(ah)) % 360


def sunrise_ah(day):
    """Kathmandu sunrise on a Gregorian date, in days after the Kali epoch."""
    observer = ephem.Observer()
    observer.lat, observer.lon, observer.elevation = KATHMANDU
    observer.pressure = 0
    observer.horizon = '-0:34'
    observer.date = ephem.Date(datetime.datetime(day.year, day.month, day.day) - NPT)
    return float(observer.next_rising(ephem.Sun())) + EPHEM_JD0 - KALI_JD


def tithi(ah):
    """Tithi (1-30) at a moment: 1-15 in the bright half (15 is the full moon), 16-30 in the dark half."""
    return int(elongation(ah) // 12) + 1


def new_moon_before(ah):
    """The last new moon at or before ah."""
    lo = ah - elongation(ah) / 11.0 - 1.5
    hi = ah
    # elongation rises from ~360 (just before) to 0; find the wrap by bisection on unwrapped value
    f = lambda x: ((elongation(x) + 180) % 360) - 180
    while f(lo) >= 0:
        lo -= 1
    for _ in range(60):
        mid = (lo + hi) / 2
        if f(mid) < 0:
            lo = mid
        else:
            hi = mid
    return hi


def sign_at(ah):
    return int(sun(ah) // 30)
