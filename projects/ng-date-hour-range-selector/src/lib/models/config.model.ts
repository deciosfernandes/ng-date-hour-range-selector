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
}
