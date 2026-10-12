import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewEncapsulation,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    signal,
} from '@angular/core';
import {
    type AbstractControl,
    type ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    type ValidationErrors,
    type Validator,
} from '@angular/forms';
import {
    ABBREVIATED_DAY_NAMES,
    type AdDate,
    type BsDate,
    type CalendarSystem,
    DAY_NAMES,
    type DateRange,
    MAX_DATE,
    MIN_DATE,
    type MonthViewDay,
    type Script,
    addDays,
    buildCalendarView,
    calendarMonthNames,
    calendarYears,
    clampBs,
    clampCalendarMonth,
    compareBs,
    convertMonth,
    dayLabel,
    formatNepalSambat,
    formatNepalSambatYears,
    isCalendarMonthInRange,
    isSameBs,
    monthOf,
    toAd,
    toDigits,
    toNepalSambat,
    todayBs,
} from '@opensourcenepal/nepali-calendar';

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * A month-view Nepali (BS) calendar that shows AD dates alongside and lets the user pick a day.
 * It can also be switched to an AD (Gregorian) month grid with BS dates alongside.
 *
 * Bind `[(value)]` or use it as a form control (`ngModel`, `formControl`); the value is a
 * `BsDate` (`{ year, month, day }`). With `min` or `max` set, a form control also gets the
 * `minDate` or `maxDate` validation error when its value falls outside them. Styles come from `@opensourcenepal/nepali-calendar-angular/styles.css`.
 */
@Component({
    selector: 'osn-nepali-calendar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NepaliCalendarComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => NepaliCalendarComponent), multi: true },
    ],
    host: {
        class: 'osn-cal',
        '[attr.lang]': "nepali() ? 'ne' : 'en'",
    },
    template: `
        <div class="osn-cal__header">
            <button
                type="button"
                class="osn-cal__nav osn-cal__nav--previous"
                [attr.aria-label]="nepali() ? 'अघिल्लो महिना' : 'Previous month'"
                [disabled]="!view().hasPrevious || disabled()"
                (click)="moveMonth(-1)"
            >
                ‹
            </button>
            <div class="osn-cal__title">
                <span class="osn-cal__title-bs">
                    <select
                        class="osn-cal__select osn-cal__select--month"
                        [attr.aria-label]="nepali() ? 'महिना' : 'Month'"
                        [disabled]="disabled()"
                        (change)="jumpTo(view().year, +$any($event.target).value)"
                    >
                        @for (name of monthNames(); track $index) {
                            <option
                                [value]="$index + 1"
                                [selected]="$index + 1 === view().month"
                                [disabled]="!monthInRange($index + 1)"
                            >
                                {{ name }}
                            </option>
                        }
                    </select>
                    <select
                        class="osn-cal__select osn-cal__select--year"
                        [attr.aria-label]="nepali() ? 'साल' : 'Year'"
                        [disabled]="disabled()"
                        (change)="jumpTo(+$any($event.target).value, view().month)"
                    >
                        @for (year of years(); track year) {
                            <option [value]="year" [selected]="year === view().year">{{ digits(year) }}</option>
                        }
                    </select>
                </span>
                @if (showAdDates) {
                    <span class="osn-cal__title-ad" aria-live="polite">{{ view().otherLabel }}</span>
                }
                @if (showNepalSambat) {
                    <span class="osn-cal__title-ns">{{ nepalSambatYears() }}</span>
                }
            </div>
            <button
                type="button"
                class="osn-cal__nav osn-cal__nav--next"
                [attr.aria-label]="nepali() ? 'अर्को महिना' : 'Next month'"
                [disabled]="!view().hasNext || disabled()"
                (click)="moveMonth(1)"
            >
                ›
            </button>
        </div>
        <table class="osn-cal__grid" [attr.aria-label]="title()">
            <thead>
                <tr>
                    @for (name of weekdays(); track $index) {
                        <th
                            scope="col"
                            class="osn-cal__weekday"
                            [class.osn-cal__weekday--saturday]="$index === 6"
                            [attr.abbr]="weekdayNames()[$index]"
                        >
                            {{ name }}
                        </th>
                    }
                </tr>
            </thead>
            <tbody>
                @for (week of view().weeks; track $index) {
                    <tr>
                        @for (day of week; track $index) {
                            @if (day) {
                                <td class="osn-cal__cell">
                                    <button
                                        type="button"
                                        class="osn-cal__day"
                                        [class.osn-cal__day--saturday]="day.dayOfWeek === 6"
                                        [class.osn-cal__day--today]="day.isToday"
                                        [class.osn-cal__day--selected]="day.isSelected"
                                        [class.osn-cal__day--disabled]="day.isDisabled"
                                        [attr.tabindex]="isTabStop(day) ? 0 : -1"
                                        [attr.aria-label]="label(day)"
                                        [attr.title]="showNepalSambat ? nepalSambat(day) : null"
                                        [attr.aria-current]="day.isToday ? 'date' : null"
                                        [attr.aria-pressed]="day.isSelected"
                                        [attr.data-date]="day.key"
                                        [disabled]="disabled() || day.isDisabled"
                                        (click)="select(day.bs)"
                                        (keydown)="onDayKeyDown($event, day.bs)"
                                    >
                                        <span class="osn-cal__day-bs">{{ digits(primaryDay(day)) }}</span>
                                        @if (showAdDates) {
                                            <span class="osn-cal__day-ad">{{ digits(secondaryDay(day)) }}</span>
                                        }
                                    </button>
                                </td>
                            } @else {
                                <td class="osn-cal__cell osn-cal__cell--empty"></td>
                            }
                        }
                    </tr>
                }
            </tbody>
        </table>
        @if (showTodayButton || showScriptToggle || showCalendarToggle) {
            <div class="osn-cal__toolbar">
                @if (showTodayButton) {
                    <button type="button" class="osn-cal__today" [disabled]="disabled()" (click)="goToToday()">
                        {{ nepali() ? 'आज' : 'Today' }}
                    </button>
                } @else {
                    <span></span>
                }
                <span class="osn-cal__toggles">
                    @if (showCalendarToggle) {
                        <button
                            type="button"
                            class="osn-cal__system"
                            [attr.aria-label]="calendarToggleLabel()"
                            (click)="toggleCalendar()"
                        >
                            {{ calendarToggleText() }}
                        </button>
                    }
                    @if (showScriptToggle) {
                        <button
                            type="button"
                            class="osn-cal__script"
                            [attr.aria-label]="nepali() ? 'Show in Roman script' : 'नेपालीमा देखाउनुहोस्'"
                            (click)="toggleScript()"
                        >
                            {{ nepali() ? 'ABC' : 'नेपाली' }}
                        </button>
                    }
                </span>
            </div>
        }
    `,
})
export class NepaliCalendarComponent implements OnChanges, ControlValueAccessor, Validator {
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly changeDetector = inject(ChangeDetectorRef);

    /** The selected BS date. Supports two-way binding with `[(value)]`. */
    @Input() set value(value: BsDate | null | undefined) {
        this.selected.set(value ?? null);
    }
    get value(): BsDate | null {
        return this.selected();
    }

    /** Emits the picked BS date. */
    @Output() readonly valueChange = new EventEmitter<BsDate>();

    /** Emits the picked date with its AD equivalent. */
    @Output() readonly dateSelect = new EventEmitter<{ bs: BsDate; ad: AdDate }>();

    /** The script for names and digits. Defaults to `nepali`; supports `[(script)]`. */
    @Input() set script(value: Script | null | undefined) {
        this.activeScript.set(value ?? 'nepali');
    }
    get script(): Script {
        return this.activeScript();
    }

    /** Emits when the user switches script with the toggle. */
    @Output() readonly scriptChange = new EventEmitter<Script>();

    /** Shows the Nepali/Roman toggle. Defaults to `true`. */
    @Input({ transform: booleanAttribute }) showScriptToggle = true;

    /** The calendar the grid follows: `bs` (default) or `ad`. Supports `[(calendar)]`. */
    @Input() set calendar(value: CalendarSystem | null | undefined) {
        this.system.set(value ?? 'bs');
    }
    get calendar(): CalendarSystem {
        return this.system();
    }

    /** Emits when the user switches between BS and AD with the toggle. */
    @Output() readonly calendarChange = new EventEmitter<CalendarSystem>();

    /** Shows the BS/AD toggle. Defaults to `true`. */
    @Input({ transform: booleanAttribute }) showCalendarToggle = true;

    /**
     * Shows the other calendar's date under each day (AD under BS days, or BS under AD days) and
     * its months in the header. Defaults to `true`.
     */
    @Input({ transform: booleanAttribute }) showAdDates = true;

    /**
     * Shows the Nepal Sambat (lunar) year in the header and each day's full Nepal Sambat date, such as
     * NS 1147 Kachhala Thwa Paru, in its tooltip and accessible name. Defaults to `false`.
     */
    @Input({ transform: booleanAttribute }) showNepalSambat = false;

    /** Shows the button that jumps to today. Defaults to `true`. */
    @Input({ transform: booleanAttribute }) showTodayButton = true;

    /** The BS month shown first. Defaults to the month of the selection, or of today. */
    @Input() initialMonth: { year: number; month: number } | null = null;

    /** The earliest BS date the user can pick. Earlier days are disabled and navigation stops at its month. */
    @Input() set min(value: BsDate | null | undefined) {
        this.range.update((range) => ({ ...range, min: value ?? null }));
        this.onValidatorChange();
    }
    get min(): BsDate | null {
        return this.range().min ?? null;
    }

    /** The latest BS date the user can pick. Later days are disabled and navigation stops at its month. */
    @Input() set max(value: BsDate | null | undefined) {
        this.range.update((range) => ({ ...range, max: value ?? null }));
        this.onValidatorChange();
    }
    get max(): BsDate | null {
        return this.range().max ?? null;
    }

    /** Today's BS date. Defaults to today in local time; mainly useful for tests and server rendering. */
    @Input() set today(value: BsDate | null | undefined) {
        this.todayDate.set(value ?? safeToday());
    }

    protected readonly selected = signal<BsDate | null>(null);
    protected readonly activeScript = signal<Script>('nepali');
    protected readonly todayDate = signal<BsDate>(safeToday());
    protected readonly disabled = signal(false);
    protected readonly system = signal<CalendarSystem>('bs');
    protected readonly visible = signal<{ system: CalendarSystem; year: number; month: number } | null>(null);
    protected readonly focused = signal<BsDate | null>(null);
    protected readonly range = signal<DateRange>({ min: null, max: null });

    protected readonly nepali = computed(() => this.activeScript() === 'nepali');
    protected readonly weekdays = computed(() => ABBREVIATED_DAY_NAMES[this.activeScript()]);
    protected readonly weekdayNames = computed(() => DAY_NAMES[this.activeScript()]);
    protected readonly monthNames = computed(() => calendarMonthNames(this.system(), this.activeScript()));
    protected readonly years = computed(() => calendarYears(this.system(), this.range()));

    protected readonly view = computed(() => {
        // Convert and clamp here, so switching calendars or changing min or max keeps the shown
        // month in view and in range.
        const system = this.system();
        const visible = this.visible() ?? { system: 'bs', ...(this.selected() ?? this.todayDate()) };
        const converted = convertMonth(visible.year, visible.month, visible.system, system, this.selected());
        const shown = clampCalendarMonth(system, converted.year, converted.month, this.range());
        return buildCalendarView(system, shown.year, shown.month, {
            today: this.todayDate(),
            selected: this.selected(),
            script: this.activeScript(),
            ...this.range(),
        });
    });

    protected readonly title = computed(
        () => `${this.monthNames()[this.view().month - 1]} ${toDigits(this.view().year, this.activeScript())}`,
    );

    protected readonly calendarToggleText = computed(() => {
        if (this.system() === 'bs') return this.nepali() ? 'ई.सं.' : 'AD';
        return this.nepali() ? 'वि.सं.' : 'BS';
    });

    protected readonly calendarToggleLabel = computed(() => {
        if (this.system() === 'bs') return this.nepali() ? 'ईस्वी संवत्‌मा देखाउनुहोस्' : 'Show AD calendar';
        return this.nepali() ? 'विक्रम संवत्‌मा देखाउनुहोस्' : 'Show BS calendar';
    });

    /** The one day reachable with Tab: the focused day, else the selection, today or the first enabled day. */
    private readonly tabStop = computed(() => {
        const days = this.view()
            .weeks.flat()
            .filter((d): d is MonthViewDay => d !== null && !d.isDisabled);
        for (const candidate of [this.focused(), this.selected(), this.todayDate()]) {
            const match = days.find((d) => isSameBs(d.bs, candidate));
            if (match) return match.bs;
        }
        return days[0]?.bs;
    });

    private onChange: (value: BsDate | null) => void = () => {};
    private onTouched: () => void = () => {};
    private onValidatorChange: () => void = () => {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialMonth'] && this.initialMonth) {
            this.visible.set({ system: 'bs', year: this.initialMonth.year, month: this.initialMonth.month });
        }
    }

    protected isTabStop(day: MonthViewDay): boolean {
        return isSameBs(day.bs, this.tabStop());
    }

    protected monthInRange(month: number): boolean {
        return isCalendarMonthInRange(this.system(), this.view().year, month, this.range());
    }

    protected label(day: MonthViewDay): string {
        const label = dayLabel(day, this.system(), this.activeScript());
        return this.showNepalSambat ? `${label}, ${this.nepalSambat(day)}` : label;
    }

    protected nepalSambat(day: MonthViewDay): string {
        return formatNepalSambat(toNepalSambat(day.bs), 'G', this.activeScript());
    }

    protected nepalSambatYears(): string {
        const days = this.view()
            .weeks.flat()
            .filter((day): day is MonthViewDay => day !== null);
        return days.length === 0
            ? ''
            : formatNepalSambatYears(days[0]!.bs, days[days.length - 1]!.bs, this.activeScript());
    }

    protected primaryDay(day: MonthViewDay): number {
        return this.system() === 'ad' ? day.ad.day : day.bs.day;
    }

    protected secondaryDay(day: MonthViewDay): number {
        return this.system() === 'ad' ? day.bs.day : day.ad.day;
    }

    protected digits(value: number): string {
        return toDigits(value, this.activeScript());
    }

    protected select(day: BsDate): void {
        this.selected.set(day);
        this.valueChange.emit(day);
        this.dateSelect.emit({ bs: day, ad: toAd(day) });
        this.onChange(day);
        this.onTouched();
    }

    protected toggleScript(): void {
        const next: Script = this.nepali() ? 'roman' : 'nepali';
        this.activeScript.set(next);
        this.scriptChange.emit(next);
    }

    protected toggleCalendar(): void {
        const view = this.view();
        const next: CalendarSystem = view.system === 'bs' ? 'ad' : 'bs';
        this.focused.set(null);
        this.visible.set({ system: view.system, year: view.year, month: view.month });
        this.system.set(next);
        this.calendarChange.emit(next);
    }

    private show(year: number, month: number): void {
        const system = this.system();
        this.visible.set({ system, ...clampCalendarMonth(system, year, month, this.range()) });
    }

    protected moveMonth(delta: number): void {
        const view = this.view();
        this.focused.set(null);
        this.show(view.year, view.month + delta);
    }

    protected jumpTo(year: number, month: number): void {
        this.focused.set(null);
        this.show(year, month);
    }

    protected goToToday(): void {
        const month = monthOf(this.todayDate(), this.system());
        this.focused.set(null);
        this.show(month.year, month.month);
    }

    protected onDayKeyDown(event: KeyboardEvent, day: BsDate): void {
        const step = ARROW_STEPS[event.key];
        if (step === undefined) {
            return;
        }
        event.preventDefault();
        let target: BsDate;
        try {
            target = addDays(day, step);
        } catch {
            target = step < 0 ? MIN_DATE : MAX_DATE;
        }
        target = clampBs(target, this.range());
        this.focused.set(target);
        this.visible.set({ system: this.system(), ...monthOf(target, this.system()) });
        this.changeDetector.detectChanges();
        this.host.nativeElement.querySelector<HTMLButtonElement>('.osn-cal__day[tabindex="0"]')?.focus();
    }

    writeValue(value: BsDate | null): void {
        this.selected.set(value ?? null);
        this.visible.set(value ? { system: 'bs', year: value.year, month: value.month } : this.visible());
    }

    registerOnChange(fn: (value: BsDate | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    validate(control: AbstractControl<BsDate | null>): ValidationErrors | null {
        const value = control.value;
        const { min, max } = this.range();
        if (value && min && compareBs(value, min) < 0) {
            return { minDate: { min, actual: value } };
        }
        if (value && max && compareBs(value, max) > 0) {
            return { maxDate: { max, actual: value } };
        }
        return null;
    }

    registerOnValidatorChange(fn: () => void): void {
        this.onValidatorChange = fn;
    }
}

function safeToday(): BsDate {
    try {
        return todayBs();
    } catch {
        return MAX_DATE;
    }
}
