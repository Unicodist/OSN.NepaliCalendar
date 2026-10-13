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
    CALENDAR_TYPES,
    CALENDARS,
    type CalendarType,
    DAY_NAMES,
    type DateRange,
    MAX_DATE,
    MIN_DATE,
    type MonthViewDay,
    type NepalSambatDate,
    type Script,
    addDays,
    clampBs,
    compareBs,
    convertMonth,
    getCalendar,
    isSameBs,
    toAd,
    toDigits,
    toNepalSambat,
    todayBs,
} from '@opensourcenepal/nepali-calendar';

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * A month-view calendar that lets the user pick a day. It shows a Bikram Sambat month with AD dates
 * alongside by default, and can switch to a Gregorian (AD) or Nepal Sambat (lunar) month grid:
 * `<osn-calendar calendar="ns" />`. `osn-nepali-calendar` is the same component under its old name.
 *
 * Bind `[(value)]` or use it as a form control (`ngModel`, `formControl`); the value is a
 * `BsDate` (`{ year, month, day }`). With `min` or `max` set, a form control also gets the
 * `minDate` or `maxDate` validation error when its value falls outside them. Styles come from `@opensourcenepal/nepali-calendar-angular/styles.css`.
 */
@Component({
    selector: 'osn-calendar, osn-nepali-calendar',
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
                        (change)="jumpToYear(+$any($event.target).value)"
                    >
                        @for (year of years(); track year) {
                            <option [value]="year" [selected]="year === view().year">{{ digits(year) }}</option>
                        }
                    </select>
                </span>
                @if (showAdDates) {
                    <span class="osn-cal__title-ad" aria-live="polite">{{ view().otherLabel }}</span>
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
                                        [class]="dayClass(day)"
                                        [class.osn-cal__day--saturday]="day.dayOfWeek === 6"
                                        [class.osn-cal__day--today]="day.isToday"
                                        [class.osn-cal__day--selected]="day.isSelected"
                                        [class.osn-cal__day--disabled]="day.isDisabled"
                                        [attr.tabindex]="isTabStop(day) ? 0 : -1"
                                        [attr.aria-label]="label(day)"
                                        [attr.title]="label(day)"
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
        @if (showTodayButton || showScriptToggle || showCalendarPicker()) {
            <div class="osn-cal__toolbar">
                @if (showTodayButton) {
                    <button type="button" class="osn-cal__today" [disabled]="disabled()" (click)="goToToday()">
                        {{ nepali() ? 'आज' : 'Today' }}
                    </button>
                } @else {
                    <span></span>
                }
                <span class="osn-cal__toggles">
                    @if (showCalendarPicker()) {
                        <select
                            class="osn-cal__calendar"
                            [attr.aria-label]="nepali() ? 'पात्रो' : 'Calendar'"
                            [disabled]="disabled()"
                            (change)="changeCalendar($any($event.target).value)"
                        >
                            @for (type of calendarOptions(); track type) {
                                <option [value]="type" [selected]="type === system()">
                                    {{ calendarName(type) }}
                                </option>
                            }
                        </select>
                    }
                    @if (showScriptToggle) {
                        <button
                            type="button"
                            class="osn-cal__script"
                            [disabled]="disabled()"
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

    /**
     * Emits the picked date in every calendar: BS, AD and Nepal Sambat. `value` is always the BS date,
     * whichever calendar is shown, because two days can share one NS date.
     */
    @Output() readonly dateSelect = new EventEmitter<{ bs: BsDate; ad: AdDate; ns: NepalSambatDate }>();

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

    /**
     * The calendar the grid follows: `bs` (Bikram Sambat, the default), `ad` (Gregorian) or `ns`
     * (Nepal Sambat). Supports `[(calendar)]`.
     */
    @Input() set calendar(value: CalendarType | null | undefined) {
        this.system.set(value ?? 'bs');
    }
    get calendar(): CalendarType {
        return this.system();
    }

    /** Emits when the user picks another calendar from the dropdown. */
    @Output() readonly calendarChange = new EventEmitter<CalendarType>();

    /** The calendars the dropdown offers, in order. Defaults to all of them: `['bs', 'ad', 'ns']`. */
    @Input() set calendars(value: readonly CalendarType[] | null | undefined) {
        this.calendarList.set(value ?? CALENDAR_TYPES);
    }
    get calendars(): readonly CalendarType[] {
        return this.calendarList();
    }

    /** Shows the calendar dropdown. Defaults to `true`; it is hidden when `calendars` has only one. */
    @Input({ transform: booleanAttribute }) set showCalendarToggle(value: boolean) {
        this.calendarToggle.set(value);
    }
    get showCalendarToggle(): boolean {
        return this.calendarToggle();
    }

    /**
     * Shows the other calendar's date under each day (AD under BS days, BS under AD and Nepal Sambat
     * days) and its months in the header. Defaults to `true`.
     */
    @Input({ transform: booleanAttribute }) showAdDates = true;

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
    protected readonly system = signal<CalendarType>('bs');
    protected readonly calendarList = signal<readonly CalendarType[]>(CALENDAR_TYPES);
    protected readonly calendarToggle = signal(true);
    protected readonly visible = signal<{ system: CalendarType; year: number; month: number } | null>(null);
    protected readonly focused = signal<BsDate | null>(null);
    protected readonly range = signal<DateRange>({ min: null, max: null });

    protected readonly nepali = computed(() => this.activeScript() === 'nepali');
    protected readonly weekdays = computed(() => ABBREVIATED_DAY_NAMES[this.activeScript()]);
    protected readonly weekdayNames = computed(() => DAY_NAMES[this.activeScript()]);
    protected readonly cal = computed(() => getCalendar(this.system()));
    protected readonly monthNames = computed(() => this.cal().monthNames(this.activeScript(), this.view().year));
    protected readonly years = computed(() => this.cal().years(this.range()));
    protected readonly calendarOptions = computed(() => {
        const list = this.calendarList();
        return list.includes(this.system()) ? list : [this.system(), ...list];
    });
    protected readonly showCalendarPicker = computed(() => this.calendarToggle() && this.calendarOptions().length > 1);

    protected readonly view = computed(() => {
        // Convert and clamp here, so switching calendars or changing min or max keeps the shown
        // month in view and in range.
        const system = this.system();
        const cal = this.cal();
        const visible = this.visible() ?? { system, ...cal.monthOf(this.selected() ?? this.todayDate()) };
        const converted = convertMonth(visible.year, visible.month, visible.system, system, this.selected());
        const shown = cal.clampMonth(converted.year, converted.month, this.range());
        return cal.buildView(shown.year, shown.month, {
            today: this.todayDate(),
            selected: this.selected(),
            script: this.activeScript(),
            ...this.range(),
        });
    });

    protected readonly title = computed(
        () => `${this.monthNames()[this.view().month - 1]} ${toDigits(this.view().year, this.activeScript())}`,
    );

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
        return this.cal().isMonthInRange(this.view().year, month, this.range());
    }

    protected label(day: MonthViewDay): string {
        return this.cal().dayLabel(day, this.activeScript());
    }

    protected calendarName(type: CalendarType): string {
        return CALENDARS[type].name[this.activeScript()];
    }

    protected dayClass(day: MonthViewDay): string {
        return [
            'osn-cal__day',
            ...this.cal()
                .dayMarkers(day)
                .map((marker) => `osn-cal__day--${marker}`),
        ].join(' ');
    }

    protected primaryDay(day: MonthViewDay): number {
        return this.cal().dayNumber(day);
    }

    protected secondaryDay(day: MonthViewDay): number {
        return this.cal().otherDayNumber(day);
    }

    protected digits(value: number): string {
        return toDigits(value, this.activeScript());
    }

    protected select(day: BsDate): void {
        this.selected.set(day);
        this.valueChange.emit(day);
        this.dateSelect.emit({ bs: day, ad: toAd(day), ns: toNepalSambat(day) });
        this.onChange(day);
        this.onTouched();
    }

    protected toggleScript(): void {
        const next: Script = this.nepali() ? 'roman' : 'nepali';
        this.activeScript.set(next);
        this.scriptChange.emit(next);
    }

    protected changeCalendar(next: CalendarType): void {
        const view = this.view();
        this.focused.set(null);
        this.visible.set({ system: view.system, year: view.year, month: view.month });
        this.system.set(next);
        this.calendarChange.emit(next);
    }

    private show(year: number, month: number): void {
        this.visible.set({ system: this.system(), ...this.cal().clampMonth(year, month, this.range()) });
    }

    protected moveMonth(delta: number): void {
        const view = this.view();
        this.focused.set(null);
        this.visible.set({
            system: this.system(),
            ...this.cal().shiftMonth(view.year, view.month, delta, this.range()),
        });
    }

    protected jumpTo(year: number, month: number): void {
        this.focused.set(null);
        this.show(year, month);
    }

    protected jumpToYear(year: number): void {
        this.focused.set(null);
        const view = this.view();
        this.visible.set({
            system: this.system(),
            ...this.cal().moveToYear(view.year, view.month, year, this.range()),
        });
    }

    protected goToToday(): void {
        const month = this.cal().monthOf(this.todayDate());
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
        this.visible.set({ system: this.system(), ...this.cal().monthOf(target) });
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
