import { ConnectedPosition } from '@angular/cdk/overlay';
import { PredefinedRange } from './date-range.model';

export interface PickerConfig {
  /** Show the time picker section. Default: true */
  showTime?: boolean;
  /** Time format: '12h' (AM/PM) or '24h'. Default: '24h' */
  timeFormat?: '12h' | '24h';
  /** Minute increment step. Default: 1 */
  minuteStep?: number;
  /** CDK overlay connected positions. Defaults to bottom-start with top-start fallback */
  position?: ConnectedPosition[];
  /**
   * Predefined range shortcuts shown in the sidebar.
   * If omitted the library uses built-in defaults (Today, Yesterday, This/Last Week…).
   */
  predefinedRanges?: PredefinedRange[];
  /** Minimum selectable date (inclusive) */
  minDate?: Date;
  /** Maximum selectable date (inclusive) */
  maxDate?: Date;
  /** First day of week: 0 = Sunday, 1 = Monday. Default: 1 */
  weekStartsOn?: 0 | 1;
  /** Show or hide the reset button in the sidebar. Default: true */
  showResetButton?: boolean;
  /** Position of the calendar icon inside the trigger button, or hide it. Default: 'right' */
  calendarIcon?: 'left' | 'right' | 'hidden';
  /** Show an Apply button that closes the picker when clicked. Default: false */
  showApplyButton?: boolean;
  /** Automatically close the picker after a complete range is selected. Default: true */
  closeOnSelect?: boolean;
  /**
   * Controls how a selected range is matched against predefined ranges to display the label.
   * - `'day'` (default) — matches when the start and end fall on the same calendar days,
   *   regardless of time (e.g. any range covering today counts as "Today").
   * - `'exact'` — requires the start and end timestamps to match exactly.
   */
  rangeMatchMode?: 'day' | 'exact';
  /**
   * Controls when the selected range value is emitted / committed to the form control.
   * - `'change'` (default) — emit immediately on every selection (dates, time changes, predefined ranges).
   * - `'close'` — defer emission; only emit when the picker is closed (backdrop click, Escape,
   *   or the Apply button). Time and date adjustments update the UI but do not call `onChange`
   *   or emit `rangeChange` until the overlay is dismissed.
   *   Reset always emits `null` immediately, regardless of this setting.
   */
  emitOn?: 'change' | 'close';
}
