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
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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

const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * A month-view Nepali (BS) calendar that shows AD dates alongside and lets the user pick a day.
 *
 * Bind `[(value)]` or use it as a form control (`ngModel`, `formControl`); the value is a
 * `BsDate` (`{ year, month, day }`). Styles come from `@opensourcenepal/nepali-calendar/styles.css`.
 */
@Component({
    selector: 'osn-nepali-calendar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NepaliCalendarComponent), multi: true }],
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
                            <option [value]="$index + 1" [selected]="$index + 1 === view().month">{{ name }}</option>
                        }
                    </select>
                    <select
                        class="osn-cal__select osn-cal__select--year"
                        [attr.aria-label]="nepali() ? 'साल' : 'Year'"
                        [disabled]="disabled()"
                        (change)="jumpTo(+$any($event.target).value, view().month)"
                    >
                        @for (year of years; track year) {
                            <option [value]="year" [selected]="year === view().year">{{ digits(year) }}</option>
                        }
                    </select>
                </span>
                @if (showAdDates) {
                    <span class="osn-cal__title-ad" aria-live="polite">{{ view().adLabel }}</span>
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
                                        [attr.tabindex]="isTabStop(day) ? 0 : -1"
                                        [attr.aria-label]="label(day)"
                                        [attr.aria-current]="day.isToday ? 'date' : null"
                                        [attr.aria-pressed]="day.isSelected"
                                        [attr.data-date]="day.key"
                                        [disabled]="disabled()"
                                        (click)="select(day.bs)"
                                        (keydown)="onDayKeyDown($event, day.bs)"
                                    >
                                        <span class="osn-cal__day-bs">{{ digits(day.bs.day) }}</span>
                                        @if (showAdDates) {
                                            <span class="osn-cal__day-ad">{{ digits(day.ad.day) }}</span>
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
        @if (showTodayButton || showScriptToggle) {
            <div class="osn-cal__toolbar">
                @if (showTodayButton) {
                    <button type="button" class="osn-cal__today" [disabled]="disabled()" (click)="goToToday()">
                        {{ nepali() ? 'आज' : 'Today' }}
                    </button>
                } @else {
                    <span></span>
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
            </div>
        }
    `,
})
export class NepaliCalendarComponent implements OnChanges, ControlValueAccessor {
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

    /** Shows the AD day under each BS day. Defaults to `true`. */
    @Input({ transform: booleanAttribute }) showAdDates = true;

    /** Shows the button that jumps to today. Defaults to `true`. */
    @Input({ transform: booleanAttribute }) showTodayButton = true;

    /** The month shown first. Defaults to the month of the selection, or of today. */
    @Input() initialMonth: { year: number; month: number } | null = null;

    /** Today's BS date. Defaults to today in local time; mainly useful for tests and server rendering. */
    @Input() set today(value: BsDate | null | undefined) {
        this.todayDate.set(value ?? safeToday());
    }

    protected readonly selected = signal<BsDate | null>(null);
    protected readonly activeScript = signal<Script>('nepali');
    protected readonly todayDate = signal<BsDate>(safeToday());
    protected readonly disabled = signal(false);
    protected readonly visible = signal<{ year: number; month: number } | null>(null);
    protected readonly focused = signal<BsDate | null>(null);

    protected readonly nepali = computed(() => this.activeScript() === 'nepali');
    protected readonly weekdays = computed(() => ABBREVIATED_DAY_NAMES[this.activeScript()]);
    protected readonly weekdayNames = computed(() => DAY_NAMES[this.activeScript()]);
    protected readonly monthNames = computed(() => MONTH_NAMES[this.activeScript()]);
    protected readonly years = supportedYears();

    protected readonly view = computed(() => {
        const visible = this.visible() ?? this.selected() ?? this.todayDate();
        return buildMonthView(visible.year, visible.month, {
            today: this.todayDate(),
            selected: this.selected(),
            script: this.activeScript(),
        });
    });

    protected readonly title = computed(
        () => `${monthName(this.view().month, this.activeScript())} ${toDigits(this.view().year, this.activeScript())}`,
    );

    /** The one day reachable with Tab: the focused day, else the selection, today or the 1st. */
    private readonly tabStop = computed(() => {
        const days = this.view()
            .weeks.flat()
            .filter((d): d is MonthViewDay => d !== null);
        for (const candidate of [this.focused(), this.selected(), this.todayDate()]) {
            const match = days.find((d) => isSameBs(d.bs, candidate));
            if (match) return match.bs;
        }
        return days[0]?.bs;
    });

    private onChange: (value: BsDate | null) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialMonth'] && this.initialMonth) {
            this.visible.set({ year: this.initialMonth.year, month: this.initialMonth.month });
        }
    }

    protected isTabStop(day: MonthViewDay): boolean {
        return isSameBs(day.bs, this.tabStop());
    }

    protected label(day: MonthViewDay): string {
        return formatBs(day.bs, 'F', this.activeScript());
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

    protected moveMonth(delta: number): void {
        const view = this.view();
        this.focused.set(null);
        this.visible.set(shiftMonth(view.year, view.month, delta));
    }

    protected jumpTo(year: number, month: number): void {
        this.focused.set(null);
        this.visible.set({ year, month });
    }

    protected goToToday(): void {
        const today = this.todayDate();
        this.focused.set(null);
        this.visible.set({ year: today.year, month: today.month });
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
        this.focused.set(target);
        this.visible.set({ year: target.year, month: target.month });
        this.changeDetector.detectChanges();
        this.host.nativeElement.querySelector<HTMLButtonElement>('.osn-cal__day[tabindex="0"]')?.focus();
    }

    writeValue(value: BsDate | null): void {
        this.selected.set(value ?? null);
        this.visible.set(value ? { year: value.year, month: value.month } : this.visible());
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
}

function safeToday(): BsDate {
    try {
        return todayBs();
    } catch {
        return MAX_DATE;
    }
}
