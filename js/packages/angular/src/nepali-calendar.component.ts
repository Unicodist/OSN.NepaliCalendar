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
    type MonthPickerCell,
    type NepalSambatDate,
    type PickLevel,
    type Script,
    YEARS_PER_PAGE,
    type YearPickerCell,
    addDays,
    buildMonthPicker,
    buildYearPicker,
    clampBs,
    compareBs,
    convertMonth,
    getCalendar,
    isSameBs,
    pickedDate,
    toAd,
    toDigits,
    toNepalSambat,
    todayBs,
} from '@opensourcenepal/nepali-calendar';

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
// The month and year grids have three columns.
const PERIOD_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };

type PeriodCell = MonthPickerCell | YearPickerCell;

const NAV_LABELS: Readonly<Record<PickLevel, Readonly<Record<Script, readonly [string, string]>>>> = {
    day: { nepali: ['अघिल्लो महिना', 'अर्को महिना'], roman: ['Previous month', 'Next month'] },
    month: { nepali: ['अघिल्लो साल', 'अर्को साल'], roman: ['Previous year', 'Next year'] },
    year: { nepali: ['अघिल्ला सालहरू', 'अर्का सालहरू'], roman: ['Previous years', 'Next years'] },
};

/**
 * A month-view calendar that lets the user pick a day. It shows a Bikram Sambat month with AD dates
 * alongside by default, and can switch to a Gregorian (AD) or Nepal Sambat (lunar) month grid:
 * `<osn-calendar calendar="ns" />`. `osn-nepali-calendar` is the same component under its old name.
 *
 * Bind `[(value)]` or use it as a form control (`ngModel`, `formControl`); the value is a
 * `BsDate` (`{ year, month, day }`). Set `pick="month"` or `pick="year"` to pick a whole month or year. With `min` or `max` set, a form control also gets the
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
                [attr.aria-label]="navLabels()[0]"
                [disabled]="!hasPrevious() || disabled()"
                (click)="movePage(-1)"
            >
                ‹
            </button>
            <div class="osn-cal__title">
                <span class="osn-cal__title-bs">
                    @if (level() === 'day') {
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
                    }
                    @if (level() === 'year') {
                        <span class="osn-cal__range" aria-live="polite">{{ title() }}</span>
                    } @else {
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
                    }
                </span>
                @if (showAdDates && otherLabel()) {
                    <span class="osn-cal__title-ad" aria-live="polite">{{ otherLabel() }}</span>
                }
            </div>
            <button
                type="button"
                class="osn-cal__nav osn-cal__nav--next"
                [attr.aria-label]="navLabels()[1]"
                [disabled]="!hasNext() || disabled()"
                (click)="movePage(1)"
            >
                ›
            </button>
        </div>
        @if (level() !== 'day') {
            <div
                class="osn-cal__periods"
                [class]="'osn-cal__periods--' + level()"
                role="group"
                [attr.aria-label]="title()"
            >
                @for (cell of periodCells(); track cell.key; let i = $index) {
                    <button
                        type="button"
                        class="osn-cal__period"
                        [class.osn-cal__period--current]="cell.isCurrent"
                        [class.osn-cal__period--selected]="cell.isSelected"
                        [class.osn-cal__period--disabled]="cell.isDisabled"
                        [attr.tabindex]="cell.key === periodTabStop() ? 0 : -1"
                        [attr.aria-label]="cell.label"
                        [attr.title]="cell.label"
                        [attr.aria-current]="cell.isCurrent ? 'date' : null"
                        [attr.aria-pressed]="cell.isSelected"
                        [attr.data-period]="cell.key"
                        [disabled]="disabled() || cell.isDisabled"
                        (click)="selectPeriod(cell)"
                        (keydown)="onPeriodKeyDown($event, i)"
                    >
                        <span class="osn-cal__period-name">{{ cell.name }}</span>
                        @if (showAdDates && cell.otherLabel) {
                            <span class="osn-cal__period-other">{{ cell.otherLabel }}</span>
                        }
                    </button>
                }
            </div>
        } @else {
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
        }
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

    /**
     * What the user picks: a `day` (the default), a whole `month` or a whole `year`. For `month` and
     * `year` the calendar shows a grid of months or years, and the value becomes the first day of the
     * picked month or year that is in range. Months and years follow the shown calendar, so in `ad`
     * the user picks a Gregorian month; `getCalendar(calendar).monthOf(value)` gives it back.
     */
    @Input() set pick(value: PickLevel | null | undefined) {
        this.level.set(value ?? 'day');
    }
    get pick(): PickLevel {
        return this.level();
    }

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
    protected readonly focusedPeriod = signal<string | null>(null);
    protected readonly level = signal<PickLevel>('day');
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

    protected readonly periods = computed(() => {
        const level = this.level();
        if (level === 'day') {
            return null;
        }
        const options = {
            today: this.todayDate(),
            selected: this.selected(),
            script: this.activeScript(),
            ...this.range(),
        };
        return level === 'month'
            ? buildMonthPicker(this.system(), this.view().year, options)
            : buildYearPicker(this.system(), this.view().year, options);
    });

    protected readonly periodCells = computed((): readonly PeriodCell[] => {
        const periods = this.periods();
        return !periods ? [] : 'months' in periods ? periods.months : periods.years;
    });

    /** The one month or year reachable with Tab: the focused one, else the selection, the current one or the first enabled. */
    protected readonly periodTabStop = computed(() => {
        const enabled = this.periodCells().filter((c) => !c.isDisabled);
        const focused = this.focusedPeriod();
        return (
            enabled.find((c) => c.key === focused) ??
            enabled.find((c) => c.isSelected) ??
            enabled.find((c) => c.isCurrent) ??
            enabled[0]
        )?.key;
    });

    protected readonly title = computed(() => {
        const periods = this.periods();
        const script = this.activeScript();
        if (!periods) {
            return `${this.monthNames()[this.view().month - 1]} ${toDigits(this.view().year, script)}`;
        }
        return 'months' in periods
            ? toDigits(periods.year, script)
            : `${toDigits(periods.first, script)} – ${toDigits(periods.last, script)}`;
    });

    protected readonly navLabels = computed(() => NAV_LABELS[this.level()][this.activeScript()]);
    protected readonly hasPrevious = computed(() => (this.periods() ?? this.view()).hasPrevious);
    protected readonly hasNext = computed(() => (this.periods() ?? this.view()).hasNext);
    protected readonly otherLabel = computed(() => {
        const periods = this.periods();
        return !periods ? this.view().otherLabel : 'months' in periods ? periods.otherLabel : '';
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

    /** The arrows move a month in the day grid, a year in the month grid and a page in the year grid. */
    protected movePage(delta: number): void {
        const level = this.level();
        if (level === 'day') {
            this.moveMonth(delta);
            return;
        }
        const view = this.view();
        const years = level === 'year' ? delta * YEARS_PER_PAGE : delta;
        this.focusedPeriod.set(null);
        this.visible.set({
            system: this.system(),
            ...this.cal().moveToYear(view.year, view.month, view.year + years, this.range()),
        });
    }

    protected selectPeriod(cell: PeriodCell): void {
        const level = this.level();
        if (level === 'day') return;
        const date = pickedDate(this.system(), level, cell.year, 'month' in cell ? cell.month : 1, this.range());
        if (date) this.select(date);
    }

    protected onPeriodKeyDown(event: KeyboardEvent, index: number): void {
        const step = PERIOD_STEPS[event.key];
        if (step === undefined) {
            return;
        }
        event.preventDefault();
        const cells = this.periodCells();
        for (let i = index + step; i >= 0 && i < cells.length; i += step) {
            if (!cells[i]!.isDisabled) {
                this.focusedPeriod.set(cells[i]!.key);
                this.changeDetector.detectChanges();
                this.host.nativeElement.querySelector<HTMLButtonElement>('.osn-cal__period[tabindex="0"]')?.focus();
                return;
            }
        }
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
        this.focusedPeriod.set(null);
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
