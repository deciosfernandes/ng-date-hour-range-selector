import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  Provider,
  TemplateRef,
  ViewContainerRef,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PickerConfig } from '../../models/config.model';
import { DateRange, PredefinedRange } from '../../models/date-range.model';
import { DateUtilsService } from '../../services/date-utils.service';
import { DEFAULT_PICKER_CONFIG, PICKER_CONFIG } from '../../tokens/config.token';
import { PICKER_LOCALE } from '../../tokens/locale.token';
import { CalendarComponent } from '../calendar/calendar.component';
import { PredefinedRangesComponent } from '../predefined-ranges/predefined-ranges.component';
import { TimePickerComponent, TimeValue } from '../time-picker/time-picker.component';

const DATE_RANGE_PICKER_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DateRangePickerComponent),
  multi: true,
};

@Component({
  selector: 'drs-date-range-picker',
  standalone: true,
  imports: [CalendarComponent, TimePickerComponent, PredefinedRangesComponent],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'drs-picker',
    '[class.drs-picker--open]': 'isOpen()',
    '[class.drs-picker--disabled]': 'isDisabled()',
  },
  providers: [DATE_RANGE_PICKER_VALUE_ACCESSOR],
})
export class DateRangePickerComponent implements ControlValueAccessor, OnDestroy {
  // ─── DI ─────────────────────────────────────────────────────────────────
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly dateUtils = inject(DateUtilsService);
  protected readonly locale = inject(PICKER_LOCALE);
  private readonly globalConfig = inject(PICKER_CONFIG);

  // ─── View queries ────────────────────────────────────────────────────────
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly overlayTplRef = viewChild.required<TemplateRef<unknown>>('overlayTpl');

  // ─── Component inputs ────────────────────────────────────────────────────
  showTime = input<boolean | undefined>(undefined);
  timeFormat = input<'12h' | '24h' | undefined>(undefined);
  minuteStep = input<number | undefined>(undefined);
  predefinedRanges = input<PredefinedRange[] | undefined>(undefined);
  minDate = input<Date | undefined>(undefined);
  maxDate = input<Date | undefined>(undefined);
  weekStartsOn = input<0 | 1 | undefined>(undefined);
  position = input<ConnectedPosition[] | undefined>(undefined);
  showResetButton = input<boolean | undefined>(undefined);
  calendarIcon = input<'left' | 'right' | 'hidden' | undefined>(undefined);
  showApplyButton = input<boolean | undefined>(undefined);
  closeOnSelect = input<boolean | undefined>(undefined);
  /** Accessible label for the trigger button */
  ariaLabel = input<string>('Select date range');

  // ─── Outputs ─────────────────────────────────────────────────────────────
  /** Emitted whenever a complete DateRange is committed (both start and end set). */
  readonly rangeChange = output<DateRange | null>();

  // ─── Internal state ───────────────────────────────────────────────────────
  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);
  /** The committed (emitted) value */
  readonly value = signal<DateRange | null>(null);
  /** In-progress start date while the user is selecting */
  protected readonly rangeStart = signal<Date | null>(null);
  /** In-progress end date — null means the user has picked a start but not yet an end */
  protected readonly rangeEnd = signal<Date | null>(null);
  /** Which predefined-range label is currently active */
  protected readonly activeRangeLabel = signal<string | null>(null);
  /** Pending start time used when no rangeStart date has been selected yet */
  private readonly _pendingStartHour = signal(0);
  private readonly _pendingStartMinute = signal(0);
  /** Pending end time used when no rangeEnd date has been selected yet */
  private readonly _pendingEndHour = signal(23);
  private readonly _pendingEndMinute = signal(59);

  // Calendar view month
  private readonly _viewYear = signal(new Date().getFullYear());
  private readonly _viewMonth = signal(new Date().getMonth());
  protected readonly viewYear = this._viewYear.asReadonly();
  protected readonly viewMonth = this._viewMonth.asReadonly();

  private overlayRef: OverlayRef | null = null;

  // CVA callbacks
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (v: DateRange | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  // ─── Computed ──────────────────────────────────────────────────────────
  protected readonly resolvedConfig = computed(() => {
    const g = this.globalConfig;
    return {
      showTime: this.showTime() ?? g.showTime ?? true,
      timeFormat: (this.timeFormat() ?? g.timeFormat ?? '24h') as '12h' | '24h',
      minuteStep: this.minuteStep() ?? g.minuteStep ?? 1,
      weekStartsOn: (this.weekStartsOn() ?? g.weekStartsOn ?? 1) as 0 | 1,
      predefinedRanges: this.predefinedRanges() ?? g.predefinedRanges,
      minDate: this.minDate() ?? (g as PickerConfig).minDate ?? null,
      maxDate: this.maxDate() ?? (g as PickerConfig).maxDate ?? null,
      position: this.position() ?? (g as PickerConfig).position ?? DEFAULT_PICKER_CONFIG.position,
      showResetButton: this.showResetButton() ?? g.showResetButton ?? true,
      calendarIcon: (this.calendarIcon() ?? g.calendarIcon ?? 'right') as
        | 'left'
        | 'right'
        | 'hidden',
      showApplyButton: this.showApplyButton() ?? g.showApplyButton ?? false,
      closeOnSelect: this.closeOnSelect() ?? g.closeOnSelect ?? true,
    };
  });

  protected readonly resolvedPredefinedRanges = computed<PredefinedRange[]>(
    () =>
      this.resolvedConfig().predefinedRanges ??
      this.dateUtils.getDefaultPredefinedRanges(this.resolvedConfig().weekStartsOn),
  );

  protected readonly displayValue = computed(() => {
    const range = this.value();
    if (!range) return '';
    if (this.resolvedConfig().showTime && this.locale.formatRangeWithTime) {
      return this.locale.formatRangeWithTime(range.start, range.end);
    }
    return this.locale.formatRange(range.start, range.end);
  });

  protected readonly startHour = computed(
    () => this.rangeStart()?.getHours() ?? this._pendingStartHour(),
  );
  protected readonly startMinute = computed(
    () => this.rangeStart()?.getMinutes() ?? this._pendingStartMinute(),
  );
  protected readonly endHour = computed(
    () => this.rangeEnd()?.getHours() ?? this._pendingEndHour(),
  );
  protected readonly endMinute = computed(
    () => this.rangeEnd()?.getMinutes() ?? this._pendingEndMinute(),
  );

  // ─── Overlay management ───────────────────────────────────────────────────
  protected toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  protected open(): void {
    if (this.isDisabled() || this.overlayRef?.hasAttached()) return;

    const cfg = this.resolvedConfig();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerRef().nativeElement)
      .withPositions(cfg.position)
      .withFlexibleDimensions(false)
      .withPush(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'drs-overlay-backdrop',
      panelClass: 'drs-overlay-pane',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.close();
    });

    this.overlayRef.attach(new TemplatePortal(this.overlayTplRef(), this.viewContainerRef));
    this.isOpen.set(true);
    this.onTouched();
  }

  protected close(): void {
    this.overlayRef?.detach();
    this.isOpen.set(false);
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  // ─── Calendar navigation ──────────────────────────────────────────────────
  protected prevMonth(): void {
    const m = this._viewMonth();
    if (m === 0) {
      this._viewMonth.set(11);
      this._viewYear.update((y) => y - 1);
    } else {
      this._viewMonth.update((m) => m - 1);
    }
  }

  protected nextMonth(): void {
    const m = this._viewMonth();
    if (m === 11) {
      this._viewMonth.set(0);
      this._viewYear.update((y) => y + 1);
    } else {
      this._viewMonth.update((m) => m + 1);
    }
  }

  // ─── Date selection ───────────────────────────────────────────────────────
  protected onDateSelect(date: Date): void {
    const start = this.rangeStart();
    const end = this.rangeEnd();

    // Both set or no start → begin a new selection
    if (start === null || end !== null) {
      const newStart = new Date(date);
      newStart.setHours(
        start?.getHours() ?? this._pendingStartHour(),
        start?.getMinutes() ?? this._pendingStartMinute(),
        0,
        0,
      );
      this.rangeStart.set(newStart);
      this.rangeEnd.set(null);
      this.activeRangeLabel.set(null);
      return;
    }

    // Second click → complete the selection
    let newStart: Date;
    let newEnd: Date;

    if (date >= this.dateUtils.startOfDay(start)) {
      newStart = start;
      newEnd = new Date(date);
      newEnd.setHours(this.endHour(), this.endMinute(), 0, 0);
    } else {
      // Clicked before start → swap
      newEnd = new Date(start);
      newEnd.setHours(23, 59, 59, 0);
      newStart = new Date(date);
      newStart.setHours(0, 0, 0, 0);
    }

    this.rangeStart.set(newStart);
    this.rangeEnd.set(newEnd);
    this.activeRangeLabel.set(null);
    this.commitValue({ start: newStart, end: newEnd });
    if (this.resolvedConfig().closeOnSelect) this.close();
  }

  // ─── Predefined ranges ────────────────────────────────────────────────────
  protected onRangeSelect(range: PredefinedRange): void {
    const dr = range.range();
    this.rangeStart.set(dr.start);
    this.rangeEnd.set(dr.end);
    this.activeRangeLabel.set(range.label);
    this._viewYear.set(dr.start.getFullYear());
    this._viewMonth.set(dr.start.getMonth());
    this.commitValue(dr);
    if (this.resolvedConfig().closeOnSelect) this.close();
  }

  protected onReset(): void {
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.activeRangeLabel.set(null);
    this.value.set(null);
    this._pendingStartHour.set(0);
    this._pendingStartMinute.set(0);
    this._pendingEndHour.set(23);
    this._pendingEndMinute.set(59);
    this.onChange(null);
    this.rangeChange.emit(null);
  }

  // ─── Time pickers ─────────────────────────────────────────────────────────
  protected onStartTimeChange(time: TimeValue): void {
    const start = this.rangeStart();
    if (!start) {
      this._pendingStartHour.set(time.hour);
      this._pendingStartMinute.set(time.minute);
      return;
    }
    const updated = new Date(start);
    updated.setHours(time.hour, time.minute, 0, 0);
    this.rangeStart.set(updated);
    const end = this.rangeEnd() ?? this.value()?.end ?? null;
    if (end) this.commitValue({ start: updated, end });
  }

  protected onEndTimeChange(time: TimeValue): void {
    const end = this.rangeEnd();
    if (!end) {
      this._pendingEndHour.set(time.hour);
      this._pendingEndMinute.set(time.minute);
      return;
    }
    const updated = new Date(end);
    updated.setHours(time.hour, time.minute, 0, 0);
    this.rangeEnd.set(updated);
    const start = this.rangeStart() ?? this.value()?.start ?? null;
    if (start) this.commitValue({ start, end: updated });
  }

  protected onApply(): void {
    this.close();
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  /**
   * Advance the current range forward by one "step" (equal to the range's length).
   * E.g. Mon–Sun → next Mon–Sun.
   */
  nextRange(): void {
    const current = this.value();
    if (!current) return;
    const cfg = this.resolvedConfig();
    const next = this.dateUtils.advanceRange(current, 1, cfg.minDate, cfg.maxDate);
    this.applyRange(next);
  }

  /**
   * Rewind the current range backward by one step.
   * E.g. Mon–Sun → previous Mon–Sun.
   */
  previousRange(): void {
    const current = this.value();
    if (!current) return;
    const cfg = this.resolvedConfig();
    const prev = this.dateUtils.advanceRange(current, -1, cfg.minDate, cfg.maxDate);
    this.applyRange(prev);
  }

  /**
   * Programmatically set the selected range.
   * Passing `null` clears the selection.
   * @param range The range to apply, or `null` to clear.
   * @param emitEvent When `false`, suppresses `rangeChange` output and CVA `onChange`. Defaults to `true`.
   */
  setRange(range: DateRange | null, emitEvent = true): void {
    if (range) {
      this.rangeStart.set(range.start);
      this.rangeEnd.set(range.end);
      this._viewYear.set(range.start.getFullYear());
      this._viewMonth.set(range.start.getMonth());
      this.activeRangeLabel.set(null);
      this.value.set(range);
      if (emitEvent) {
        this.onChange(range);
        this.rangeChange.emit(range);
      }
    } else {
      this.rangeStart.set(null);
      this.rangeEnd.set(null);
      this.activeRangeLabel.set(null);
      this.value.set(null);
      this._pendingStartHour.set(0);
      this._pendingStartMinute.set(0);
      this._pendingEndHour.set(23);
      this._pendingEndMinute.set(59);
      if (emitEvent) {
        this.onChange(null);
        this.rangeChange.emit(null);
      }
    }
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────
  writeValue(value: DateRange | null): void {
    const v = value ?? null;
    this.value.set(v);
    if (v) {
      this.rangeStart.set(v.start);
      this.rangeEnd.set(v.end);
      this._viewYear.set(v.start.getFullYear());
      this._viewMonth.set(v.start.getMonth());
    } else {
      this.rangeStart.set(null);
      this.rangeEnd.set(null);
      this._pendingStartHour.set(0);
      this._pendingStartMinute.set(0);
      this._pendingEndHour.set(23);
      this._pendingEndMinute.set(59);
    }
  }

  registerOnChange(fn: (v: DateRange | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private commitValue(range: DateRange): void {
    this.value.set(range);
    this.onChange(range);
    this.rangeChange.emit(range);
  }

  private applyRange(range: DateRange): void {
    this.rangeStart.set(range.start);
    this.rangeEnd.set(range.end);
    this._viewYear.set(range.start.getFullYear());
    this._viewMonth.set(range.start.getMonth());
    this.activeRangeLabel.set(null);
    this.commitValue(range);
  }
}
