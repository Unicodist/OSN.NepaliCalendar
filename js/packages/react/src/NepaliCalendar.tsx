import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
    ABBREVIATED_DAY_NAMES,
    type AdDate,
    type BsDate,
    DAY_NAMES,
    MONTH_NAMES,
    MAX_DATE,
    MIN_DATE,
    type MonthViewDay,
    type Script,
    addDays,
    buildMonthView,
    formatBs,
    isSameBs,
    monthName,
    shiftMonth,
    supportedYears,
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
    /** Shows the AD day under each BS day. Defaults to `true`. */
    showAdDates?: boolean;
    /** Shows the button that jumps to today. Defaults to `true`. */
    showTodayButton?: boolean;
    /** The month shown first. Defaults to the month of the selection, or of today. */
    initialMonth?: { year: number; month: number };
    /** Today's BS date. Defaults to today in local time; mainly useful for tests and server rendering. */
    today?: BsDate;
    /** Extra class names for the root element. */
    className?: string;
}

const YEARS = supportedYears();

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/** A month-view Nepali (BS) calendar that shows AD dates alongside and lets the user pick a day. */
export function NepaliCalendar({
    value,
    defaultValue = null,
    onChange,
    script,
    defaultScript = 'nepali',
    onScriptChange,
    showScriptToggle = true,
    showAdDates = true,
    showTodayButton = true,
    initialMonth,
    today: todayProp,
    className,
}: NepaliCalendarProps) {
    const today = useMemo(() => todayProp ?? safeToday(), [todayProp]);
    const [uncontrolledValue, setUncontrolledValue] = useState<BsDate | null>(defaultValue);
    const selected = value !== undefined ? value : uncontrolledValue;
    const [uncontrolledScript, setUncontrolledScript] = useState<Script>(defaultScript);
    const activeScript = script ?? uncontrolledScript;

    const start = initialMonth ?? selected ?? today;
    const [visible, setVisible] = useState({ year: start.year, month: start.month });
    const [focused, setFocused] = useState<BsDate | null>(null);
    const gridRef = useRef<HTMLTableElement>(null);

    // Keep keyboard focus on the focused day after the month changes under it.
    useEffect(() => {
        if (focused) {
            gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
        }
    }, [focused]);

    const view = useMemo(
        () => buildMonthView(visible.year, visible.month, { today, selected, script: activeScript }),
        [visible.year, visible.month, today, selected, activeScript],
    );

    // The one day reachable with Tab: the focused day, else the selection, today or the 1st.
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

    const moveMonth = (delta: number) => {
        setFocused(null);
        setVisible(shiftMonth(visible.year, visible.month, delta));
    };

    const jumpTo = (year: number, month: number) => {
        setFocused(null);
        setVisible({ year, month });
    };

    const goToToday = () => {
        setFocused(null);
        setVisible({ year: today.year, month: today.month });
    };

    const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: BsDate) => {
        const step = ARROW_STEPS[event.key];
        if (step === undefined) {
            return;
        }
        event.preventDefault();
        const target = clamp(day, step);
        setFocused(target);
        if (target.year !== visible.year || target.month !== visible.month) {
            setVisible({ year: target.year, month: target.month });
        }
    };

    const nepali = activeScript === 'nepali';
    const title = `${monthName(view.month, activeScript)} ${toDigits(view.year, activeScript)}`;

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
                            {MONTH_NAMES[activeScript].map((name, i) => (
                                <option key={i} value={i + 1}>
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
                            {YEARS.map((year) => (
                                <option key={year} value={year}>
                                    {toDigits(year, activeScript)}
                                </option>
                            ))}
                        </select>
                    </span>
                    {showAdDates && (
                        <span className="osn-cal__title-ad" aria-live="polite">
                            {view.adLabel}
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
                                            aria-label={formatBs(day.bs, 'F', activeScript)}
                                            aria-current={day.isToday ? 'date' : undefined}
                                            aria-pressed={day.isSelected}
                                            data-date={day.key}
                                            onClick={() => select(day.bs)}
                                            onKeyDown={(event) => onDayKeyDown(event, day.bs)}
                                        >
                                            <span className="osn-cal__day-bs">
                                                {toDigits(day.bs.day, activeScript)}
                                            </span>
                                            {showAdDates && (
                                                <span className="osn-cal__day-ad">
                                                    {toDigits(day.ad.day, activeScript)}
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
            {(showTodayButton || showScriptToggle) && (
                <div className="osn-cal__toolbar">
                    {showTodayButton ? (
                        <button type="button" className="osn-cal__today" onClick={goToToday}>
                            {nepali ? 'आज' : 'Today'}
                        </button>
                    ) : (
                        <span />
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
    return name;
}

function pickTabStop(days: (MonthViewDay | null)[], ...candidates: (BsDate | null)[]): BsDate | undefined {
    const inMonth = days.filter((d): d is MonthViewDay => d !== null);
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
