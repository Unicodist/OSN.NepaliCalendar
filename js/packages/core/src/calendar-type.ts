/**
 * A calendar a date can be shown in: `bs` (Bikram Sambat), `ad` (Gregorian) or `ns` (Nepal Sambat).
 * More may be added; use {@link CALENDAR_TYPES} rather than listing them yourself.
 */
export type CalendarType = 'bs' | 'ad' | 'ns';

/** @deprecated Use {@link CalendarType}. */
export type CalendarSystem = CalendarType;

/** Every calendar type, in the order a calendar picker lists them. */
export const CALENDAR_TYPES: readonly CalendarType[] = Object.freeze(['bs', 'ad', 'ns'] as const);

/**
 * A month of some calendar. `month` counts from 1 at the start of the year; in Nepal Sambat a year
 * with a leap month has 13, so `month` is the month's place in its year, not its name.
 */
export interface YearMonth {
    readonly year: number;
    readonly month: number;
}
