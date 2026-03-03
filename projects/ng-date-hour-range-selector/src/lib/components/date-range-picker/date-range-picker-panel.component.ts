import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { PredefinedRange } from '../../models/date-range.model';
import { PickerLocale } from '../../models/locale.model';
import { CalendarComponent } from '../calendar/calendar.component';
import { PredefinedRangesComponent } from '../predefined-ranges/predefined-ranges.component';
import { TimePickerComponent, TimeValue } from '../time-picker/time-picker.component';

/** Config subset consumed by the overlay panel (excludes trigger/overlay-management options). */
export interface ResolvedPickerConfig {
  showTime: boolean;
  timeFormat: '12h' | '24h';
  minuteStep: number;
  weekStartsOn: 0 | 1;
  showResetButton: boolean;
  showApplyButton: boolean;
  minDate: Date | null;
  maxDate: Date | null;
}

/**
 * The floating picker panel rendered inside the CDK overlay.
 * Used by both `DateRangePickerComponent` (via TemplatePortal) and
 * `DateRangePickerDirective` (via ComponentPortal).
 *
 * ViewEncapsulation.None is required so that CDK-overlay-rendered content
 * receives the styles when the component is created via ComponentPortal.
 */
@Component({
  selector: 'drs-picker-panel',
  imports: [CalendarComponent, TimePickerComponent, PredefinedRangesComponent],
  templateUrl: './date-range-picker-panel.component.html',
  styleUrl: './date-range-picker-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DateRangePickerPanelComponent {
  // ─── Inputs ───────────────────────────────────────────────────────────────
  rangeStart = input<Date | null>(null);
  rangeEnd = input<Date | null>(null);
  viewYear = input.required<number>();
  viewMonth = input.required<number>();
  config = input.required<ResolvedPickerConfig>();
  predefinedRanges = input.required<PredefinedRange[]>();
  locale = input.required<PickerLocale>();
  activeRangeLabel = input<string | null>(null);
  startHour = input<number>(0);
  startMinute = input<number>(0);
  endHour = input<number>(23);
  endMinute = input<number>(59);

  // ─── Outputs ──────────────────────────────────────────────────────────────
  readonly dateSelect = output<Date>();
  readonly rangeSelect = output<PredefinedRange>();
  readonly startTimeChange = output<TimeValue>();
  readonly endTimeChange = output<TimeValue>();
  readonly prevMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly reset = output<void>();
  readonly apply = output<void>();
}
