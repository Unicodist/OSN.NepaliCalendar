import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
    ABBREVIATED_DAY_NAMES,
    type AdDate,
    type BsDate,
    CALENDAR_TYPES,
    CALENDARS,
    type CalendarType,
    DAY_NAMES,
    type DateRange,
    MAX_DATE,
    MIN_DATE,
    type MonthViewDay,
    type Script,
    addDays,
    clampBs,
    convertMonth,
    getCalendar,
    isSameBs,
    toAd,
    toDigits,
    todayBs,
} from '@opensourcenepal/nepali-calendar';

export interface NepaliCalendarProps {
    /** The selected BS date. Pass it with `onChange` to control the selection. */
    value?: BsDate | null;
    /** The initially selected date when the selection is not controlled. */
    defaultValue?: BsDate | null;
    /** Called when the user picks a day, with the BS date and its AD equivalent. */
    onChange?: (date: BsDate, ad: AdDate) => void;
    /** The script for names and digits. Pass it with `onScriptChange` to control it. */
    script?: Script;
    /** The initial script when it is not controlled. Defaults to `nepali`. */
    defaultScript?: Script;
    /** Called when the user switches script with the toggle. */
    onScriptChange?: (script: Script) => void;
    /** Shows the Nepali/Roman toggle. Defaults to `true`. */
    showScriptToggle?: boolean;
    /**
     * The calendar the grid follows: `bs` (Bikram Sambat), `ad` (Gregorian) or `ns` (Nepal Sambat).
     * Pass it with `onCalendarChange` to control it.
     */
    calendar?: CalendarType;
    /** The initial calendar when it is not controlled. Defaults to `bs`. */
    defaultCalendar?: CalendarType;
    /** Called when the user picks another calendar from the dropdown. */
    onCalendarChange?: (calendar: CalendarType) => void;
    /** The calendars the dropdown offers, in order. Defaults to all of them: `['bs', 'ad', 'ns']`. */
    calendars?: readonly CalendarType[];
    /** Shows the calendar dropdown. Defaults to `true`; it is hidden when `calendars` has only one. */
    showCalendarToggle?: boolean;
    /**
     * Shows the other calendar's date under each day (AD under BS days, BS under AD and Nepal Sambat
     * days) and its months in the header. Defaults to `true`.
     */
    showAdDates?: boolean;
    /** Shows the button that jumps to today. Defaults to `true`. */
    showTodayButton?: boolean;
    /** The BS month shown first. Defaults to the month of the selection, or of today. */
    initialMonth?: { year: number; month: number };
    /** The earliest BS date the user can pick. Earlier days are disabled and navigation stops at its month. */
    min?: BsDate | null;
    /** The latest BS date the user can pick. Later days are disabled and navigation stops at its month. */
    max?: BsDate | null;
    /** Today's BS date. Defaults to today in local time; mainly useful for tests and server rendering. */
    today?: BsDate;
    /** Extra class names for the root element. */
    className?: string;
}

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * A month-view calendar that lets the user pick a day. It shows a Bikram Sambat month with AD dates
 * alongside by default, and can switch to a Gregorian (AD) or Nepal Sambat (lunar) month grid.
 */
export function NepaliCalendar({
    value,
    defaultValue = null,
    onChange,
    script,
    defaultScript = 'nepali',
    onScriptChange,
    showScriptToggle = true,
    calendar,
    defaultCalendar = 'bs',
    onCalendarChange,
    calendars = CALENDAR_TYPES,
    showCalendarToggle = true,
    showAdDates = true,
    showTodayButton = true,
    initialMonth,
    min = null,
    max = null,
    today: todayProp,
    className,
}: NepaliCalendarProps) {
    const today = useMemo(() => todayProp ?? safeToday(), [todayProp]);
    const [uncontrolledValue, setUncontrolledValue] = useState<BsDate | null>(defaultValue);
    const selected = value !== undefined ? value : uncontrolledValue;
    const [uncontrolledScript, setUncontrolledScript] = useState<Script>(defaultScript);
    const activeScript = script ?? uncontrolledScript;
    const [uncontrolledCalendar, setUncontrolledCalendar] = useState<CalendarType>(defaultCalendar);
    const system = calendar ?? uncontrolledCalendar;
    const cal = getCalendar(system);

    const [visible, setVisible] = useState<{ system: CalendarType; year: number; month: number }>(() => {
        if (initialMonth) {
            return { system: 'bs', year: initialMonth.year, month: initialMonth.month };
        }
        return { system, ...getCalendar(system).monthOf(selected ?? today) };
    });
    const [focused, setFocused] = useState<BsDate | null>(null);
    const range: DateRange = useMemo(() => ({ min, max }), [min, max]);
    const years = useMemo(() => cal.years(range), [cal, range]);
    // Convert and clamp at render time, so switching calendars or changing min or max keeps the
    // shown month in view and in range.
    const converted = convertMonth(visible.year, visible.month, visible.system, system, selected);
    const shown = cal.clampMonth(converted.year, converted.month, range);
    const gridRef = useRef<HTMLTableElement>(null);

    // Keep keyboard focus on the focused day after the month changes under it.
    useEffect(() => {
        if (focused) {
            gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
        }
    }, [focused]);

    const view = useMemo(
        () => cal.buildView(shown.year, shown.month, { today, selected, script: activeScript, ...range }),
        [cal, shown.year, shown.month, today, selected, activeScript, range],
    );

    // The one day reachable with Tab: the focused day, else the selection, today or the first enabled day.
    const tabStop = pickTabStop(view.weeks.flat(), focused, selected, today);

    const select = (day: BsDate) => {
        if (value === undefined) {
            setUncontrolledValue(day);
        }
        onChange?.(day, toAd(day));
    };

    const toggleScript = () => {
        const next: Script = activeScript === 'nepali' ? 'roman' : 'nepali';
        if (script === undefined) {
            setUncontrolledScript(next);
        }
        onScriptChange?.(next);
    };

    const changeCalendar = (next: CalendarType) => {
        setFocused(null);
        setVisible({ system, ...shown });
        if (calendar === undefined) {
            setUncontrolledCalendar(next);
        }
        onCalendarChange?.(next);
    };

    const show = (year: number, month: number) => {
        setVisible({ system, ...cal.clampMonth(year, month, range) });
    };

    const moveMonth = (delta: number) => {
        setFocused(null);
        setVisible({ system, ...cal.shiftMonth(shown.year, shown.month, delta, range) });
    };

    const jumpTo = (year: number, month: number) => {
        setFocused(null);
        show(year, month);
    };

    const goToToday = () => {
        setFocused(null);
        const month = cal.monthOf(today);
        show(month.year, month.month);
    };

    const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: BsDate) => {
        const step = ARROW_STEPS[event.key];
        if (step === undefined) {
            return;
        }
        event.preventDefault();
        const target = clampBs(clamp(day, step), range);
        setFocused(target);
        const month = cal.monthOf(target);
        if (month.year !== shown.year || month.month !== shown.month) {
            setVisible({ system, ...month });
        }
    };

    const nepali = activeScript === 'nepali';
    const monthNames = cal.monthNames(activeScript, view.year);
    const title = `${monthNames[view.month - 1]} ${toDigits(view.year, activeScript)}`;
    const calendarOptions = calendars.includes(system) ? calendars : [system, ...calendars];
    const showCalendarPicker = showCalendarToggle && calendarOptions.length > 1;

    return (
        <div className={['osn-cal', className].filter(Boolean).join(' ')} lang={nepali ? 'ne' : 'en'}>
            <div className="osn-cal__header">
                <button
                    type="button"
                    className="osn-cal__nav osn-cal__nav--previous"
                    aria-label={nepali ? 'अघिल्लो महिना' : 'Previous month'}
                    disabled={!view.hasPrevious}
                    onClick={() => moveMonth(-1)}
                >
                    ‹
                </button>
                <div className="osn-cal__title">
                    <span className="osn-cal__title-bs">
                        <select
                            className="osn-cal__select osn-cal__select--month"
                            aria-label={nepali ? 'महिना' : 'Month'}
                            value={view.month}
                            onChange={(event) => jumpTo(view.year, Number(event.target.value))}
                        >
                            {monthNames.map((name, i) => (
                                <option key={i} value={i + 1} disabled={!cal.isMonthInRange(view.year, i + 1, range)}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="osn-cal__select osn-cal__select--year"
                            aria-label={nepali ? 'साल' : 'Year'}
                            value={view.year}
                            onChange={(event) => jumpTo(Number(event.target.value), view.month)}
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {toDigits(year, activeScript)}
                                </option>
                            ))}
                        </select>
                    </span>
                    {showAdDates && (
                        <span className="osn-cal__title-ad" aria-live="polite">
                            {view.otherLabel}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="osn-cal__nav osn-cal__nav--next"
                    aria-label={nepali ? 'अर्को महिना' : 'Next month'}
                    disabled={!view.hasNext}
                    onClick={() => moveMonth(1)}
                >
                    ›
                </button>
            </div>
            <table className="osn-cal__grid" aria-label={title} ref={gridRef}>
                <thead>
                    <tr>
                        {ABBREVIATED_DAY_NAMES[activeScript].map((name, i) => (
                            <th
                                key={i}
                                scope="col"
                                abbr={DAY_NAMES[activeScript][i]}
                                className={`osn-cal__weekday${i === 6 ? ' osn-cal__weekday--saturday' : ''}`}
                            >
                                {name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {view.weeks.map((week, w) => (
                        <tr key={w}>
                            {week.map((day, i) =>
                                day === null ? (
                                    <td key={i} className="osn-cal__cell osn-cal__cell--empty" />
                                ) : (
                                    <td key={day.key} className="osn-cal__cell">
                                        <button
                                            type="button"
                                            className={dayClass(day)}
                                            tabIndex={isSameBs(day.bs, tabStop) ? 0 : -1}
                                            aria-label={cal.dayLabel(day, activeScript)}
                                            title={cal.dayLabel(day, activeScript)}
                                            aria-current={day.isToday ? 'date' : undefined}
                                            aria-pressed={day.isSelected}
                                            data-date={day.key}
                                            disabled={day.isDisabled}
                                            onClick={() => select(day.bs)}
                                            onKeyDown={(event) => onDayKeyDown(event, day.bs)}
                                        >
                                            <span className="osn-cal__day-bs">
                                                {toDigits(cal.dayNumber(day), activeScript)}
                                            </span>
                                            {showAdDates && (
                                                <span className="osn-cal__day-ad">
                                                    {toDigits(cal.otherDayNumber(day), activeScript)}
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                ),
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {(showTodayButton || showScriptToggle || showCalendarPicker) && (
                <div className="osn-cal__toolbar">
                    {showTodayButton ? (
                        <button type="button" className="osn-cal__today" onClick={goToToday}>
                            {nepali ? 'आज' : 'Today'}
                        </button>
                    ) : (
                        <span />
                    )}
                    <span className="osn-cal__toggles">
                        {showCalendarPicker && (
                            <select
                                className="osn-cal__calendar"
                                aria-label={nepali ? 'पात्रो' : 'Calendar'}
                                value={system}
                                onChange={(event) => changeCalendar(event.target.value as CalendarType)}
                            >
                                {calendarOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {CALENDARS[type].name[activeScript]}
                                    </option>
                                ))}
                            </select>
                        )}
                        {showScriptToggle && (
                            <button
                                type="button"
                                className="osn-cal__script"
                                aria-label={nepali ? 'Show in Roman script' : 'नेपालीमा देखाउनुहोस्'}
                                onClick={toggleScript}
                            >
                                {nepali ? 'ABC' : 'नेपाली'}
                            </button>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
}

function dayClass(day: MonthViewDay): string {
    let name = 'osn-cal__day';
    if (day.dayOfWeek === 6) name += ' osn-cal__day--saturday';
    if (day.isToday) name += ' osn-cal__day--today';
    if (day.isSelected) name += ' osn-cal__day--selected';
    if (day.isDisabled) name += ' osn-cal__day--disabled';
    return name;
}

function pickTabStop(days: (MonthViewDay | null)[], ...candidates: (BsDate | null)[]): BsDate | undefined {
    const inMonth = days.filter((d): d is MonthViewDay => d !== null && !d.isDisabled);
    for (const candidate of candidates) {
        const match = inMonth.find((d) => isSameBs(d.bs, candidate));
        if (match) return match.bs;
    }
    return inMonth[0]?.bs;
}

function clamp(day: BsDate, step: number): BsDate {
    try {
        return addDays(day, step);
    } catch {
        return step < 0 ? MIN_DATE : MAX_DATE;
    }
}

function safeToday(): BsDate {
    try {
        return todayBs();
    } catch {
        return MAX_DATE;
    }
}
