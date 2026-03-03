import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Provider,
  ViewContainerRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PickerConfig } from '../../models/config.model';
import { DateRange, PredefinedRange } from '../../models/date-range.model';
import { DateUtilsService } from '../../services/date-utils.service';
import { DEFAULT_PICKER_CONFIG, PICKER_CONFIG } from '../../tokens/config.token';
import { PICKER_LOCALE } from '../../tokens/locale.token';
import { TimeValue } from '../time-picker/time-picker.component';
import {
  DateRangePickerPanelComponent,
  ResolvedPickerConfig,
} from './date-range-picker-panel.component';

function isPredefinedRange(v: DateRange | PredefinedRange): v is PredefinedRange {
  return typeof (v as PredefinedRange).range === 'function';
}

const DATE_RANGE_PICKER_DIRECTIVE_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DateRangePickerDirective),
  multi: true,
};

/**
 * Directive that turns any `<input>` into a date-range picker trigger.
 *
 * Usage:
 * ```html
 * <input drsDateRangePicker [formControl]="ctrl" [showTime]="false" />
 * ```
 */
@Directive({
  selector: 'input[drsDateRangePicker]',
  host: {
    'attr.readonly': '',
    'attr.aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '(click)': 'open()',
  },
  providers: [DATE_RANGE_PICKER_DIRECTIVE_VALUE_ACCESSOR],
})
export class DateRangePickerDirective implements ControlValueAccessor, OnInit, OnDestroy {
  // ─── DI ─────────────────────────────────────────────────────────────────
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly dateUtils = inject(DateUtilsService);
  protected readonly locale = inject(PICKER_LOCALE);
  private readonly globalConfig = inject(PICKER_CONFIG);

  // ─── Inputs ──────────────────────────────────────────────────────────────
  showTime = input<boolean | undefined>(undefined);
  timeFormat = input<'12h' | '24h' | undefined>(undefined);
  minuteStep = input<number | undefined>(undefined);
  predefinedRanges = input<PredefinedRange[] | undefined>(undefined);
  minDate = input<Date | undefined>(undefined);
  maxDate = input<Date | undefined>(undefined);
  weekStartsOn = input<0 | 1 | undefined>(undefined);
  position = input<ConnectedPosition[] | undefined>(undefined);
  showResetButton = input<boolean | undefined>(undefined);
  showApplyButton = input<boolean | undefined>(undefined);
  closeOnSelect = input<boolean | undefined>(undefined);
  /** Initial range to pre-select on load. Accepts a DateRange or a PredefinedRange. */
  initialRange = input<DateRange | PredefinedRange | null | undefined>(undefined);
  /** Accessible label forwarded to the host input. */
  ariaLabel = input<string>('Select date range');

  // ─── Outputs ─────────────────────────────────────────────────────────────
  readonly rangeChange = output<DateRange | null>();

  // ─── Internal state ───────────────────────────────────────────────────────
  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);
  readonly value = signal<DateRange | null>(null);
  protected readonly rangeStart = signal<Date | null>(null);
  protected readonly rangeEnd = signal<Date | null>(null);
  protected readonly activeRangeLabel = signal<string | null>(null);
  private readonly _pendingStartHour = signal(0);
  private readonly _pendingStartMinute = signal(0);
  private readonly _pendingEndHour = signal(23);
  private readonly _pendingEndMinute = signal(59);

  private readonly _viewYear = signal(new Date().getFullYear());
  private readonly _viewMonth = signal(new Date().getMonth());

  private overlayRef: OverlayRef | null = null;
  /** ComponentRef of the panel while the overlay is open; null when closed. */
  private readonly _panelRef = signal<ComponentRef<DateRangePickerPanelComponent> | null>(null);

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
      showApplyButton: this.showApplyButton() ?? g.showApplyButton ?? false,
      closeOnSelect: this.closeOnSelect() ?? g.closeOnSelect ?? true,
    };
  });

  protected readonly resolvedPredefinedRanges = computed<PredefinedRange[]>(
    () =>
      this.resolvedConfig().predefinedRanges ??
      this.dateUtils.getDefaultPredefinedRanges(this.resolvedConfig().weekStartsOn),
  );

  private readonly panelConfig = computed((): ResolvedPickerConfig => {
    const c = this.resolvedConfig();
    return {
      showTime: c.showTime,
      timeFormat: c.timeFormat,
      minuteStep: c.minuteStep,
      weekStartsOn: c.weekStartsOn,
      showResetButton: c.showResetButton,
      showApplyButton: c.showApplyButton,
      minDate: c.minDate ?? null,
      maxDate: c.maxDate ?? null,
    };
  });

  protected readonly displayValue = computed(() => {
    const label = this.activeRangeLabel();
    if (label) return label;
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

  constructor() {
    // Write the formatted value to the native input element
    effect(() => {
      this.el.nativeElement.value = this.displayValue();
    });

    // Reactively sync state into the panel component while the overlay is open
    effect(() => {
      const ref = this._panelRef();
      if (!ref) return;
      ref.setInput('rangeStart', this.rangeStart());
      ref.setInput('rangeEnd', this.rangeEnd());
      ref.setInput('viewYear', this._viewYear());
      ref.setInput('viewMonth', this._viewMonth());
      ref.setInput('config', this.panelConfig());
      ref.setInput('predefinedRanges', this.resolvedPredefinedRanges());
      ref.setInput('locale', this.locale);
      ref.setInput('activeRangeLabel', this.activeRangeLabel());
      ref.setInput('startHour', this.startHour());
      ref.setInput('startMinute', this.startMinute());
      ref.setInput('endHour', this.endHour());
      ref.setInput('endMinute', this.endMinute());
    });
  }

  ngOnInit(): void {
    this._applyInitialRange();
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  // ─── Overlay management ───────────────────────────────────────────────────
  open(): void {
    if (this.isDisabled() || this.overlayRef?.hasAttached()) return;

    const cfg = this.resolvedConfig();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.el)
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

    const portal = new ComponentPortal(DateRangePickerPanelComponent, this.viewContainerRef);
    const ref = this.overlayRef.attach(portal);

    // Wire up panel outputs
    ref.instance.dateSelect.subscribe((date) => this.onDateSelect(date));
    ref.instance.rangeSelect.subscribe((range) => this.onRangeSelect(range));
    ref.instance.startTimeChange.subscribe((t) => this.onStartTimeChange(t));
    ref.instance.endTimeChange.subscribe((t) => this.onEndTimeChange(t));
    ref.instance.prevMonth.subscribe(() => this._prevMonth());
    ref.instance.nextMonth.subscribe(() => this._nextMonth());
    ref.instance.reset.subscribe(() => this.onReset());
    ref.instance.apply.subscribe(() => this.close());

    // Setting _panelRef triggers the state-sync effect
    this._panelRef.set(ref);
    this.isOpen.set(true);
    this.onTouched();
  }

  close(): void {
    this._panelRef.set(null);
    this.overlayRef?.detach();
    this.isOpen.set(false);
  }

  // ─── Calendar navigation ──────────────────────────────────────────────────
  private _prevMonth(): void {
    const m = this._viewMonth();
    if (m === 0) {
      this._viewMonth.set(11);
      this._viewYear.update((y) => y - 1);
    } else {
      this._viewMonth.update((m) => m - 1);
    }
  }

  private _nextMonth(): void {
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

    let newStart: Date;
    let newEnd: Date;

    if (date >= this.dateUtils.startOfDay(start)) {
      newStart = start;
      newEnd = new Date(date);
      newEnd.setHours(this.endHour(), this.endMinute(), 0, 0);
    } else {
      newEnd = new Date(start);
      newEnd.setHours(23, 59, 59, 0);
      newStart = new Date(date);
      newStart.setHours(0, 0, 0, 0);
    }

    this.rangeStart.set(newStart);
    this.rangeEnd.set(newEnd);
    this.activeRangeLabel.set(this._matchPredefinedRange({ start: newStart, end: newEnd }));
    this._commitValue({ start: newStart, end: newEnd });
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
    this._commitValue(dr);
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
    if (this.resolvedConfig().closeOnSelect) this.close();
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
    if (end) this._commitValue({ start: updated, end });
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
    if (start) this._commitValue({ start, end: updated });
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  nextRange(): void {
    const current = this.value();
    if (!current) return;
    const cfg = this.resolvedConfig();
    const next = this.dateUtils.advanceRange(current, 1, cfg.minDate, cfg.maxDate);
    this._applyRange(next);
  }

  previousRange(): void {
    const current = this.value();
    if (!current) return;
    const cfg = this.resolvedConfig();
    const prev = this.dateUtils.advanceRange(current, -1, cfg.minDate, cfg.maxDate);
    this._applyRange(prev);
  }

  setRange(range: DateRange | null, emitEvent = true): void {
    if (range) {
      this.rangeStart.set(range.start);
      this.rangeEnd.set(range.end);
      this._viewYear.set(range.start.getFullYear());
      this._viewMonth.set(range.start.getMonth());
      this.activeRangeLabel.set(this._matchPredefinedRange(range));
      this.value.set(range);
      if (emitEvent) {
        this.onChange(range);
        this.rangeChange.emit(range);
      }
    } else {
      this._clearState();
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
      this.activeRangeLabel.set(this._matchPredefinedRange(v));
    } else {
      this._clearState();
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

  // ─── Private helpers ──────────────────────────────────────────────────────
  private _commitValue(range: DateRange): void {
    this.value.set(range);
    this.onChange(range);
    this.rangeChange.emit(range);
  }

  private _applyRange(range: DateRange): void {
    this.rangeStart.set(range.start);
    this.rangeEnd.set(range.end);
    this._viewYear.set(range.start.getFullYear());
    this._viewMonth.set(range.start.getMonth());
    this.activeRangeLabel.set(this._matchPredefinedRange(range));
    this._commitValue(range);
  }

  private _clearState(): void {
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.activeRangeLabel.set(null);
    this._pendingStartHour.set(0);
    this._pendingStartMinute.set(0);
    this._pendingEndHour.set(23);
    this._pendingEndMinute.set(59);
  }

  private _applyInitialRange(): void {
    const init = this.initialRange();
    if (!init || this.value()) return;
    if (isPredefinedRange(init)) {
      const dr = init.range();
      this.rangeStart.set(dr.start);
      this.rangeEnd.set(dr.end);
      this.activeRangeLabel.set(init.label);
      this._viewYear.set(dr.start.getFullYear());
      this._viewMonth.set(dr.start.getMonth());
      this.value.set(dr);
    } else {
      this.rangeStart.set(init.start);
      this.rangeEnd.set(init.end);
      this._viewYear.set(init.start.getFullYear());
      this._viewMonth.set(init.start.getMonth());
      this.activeRangeLabel.set(this._matchPredefinedRange(init));
      this.value.set(init);
    }
  }

  /**
   * Returns the label of the first predefined range whose start/end days match
   * the given range, or `null` if no match is found.
   * Comparison is date-only (ignores time) for robust matching.
   */
  private _matchPredefinedRange(range: DateRange): string | null {
    for (const pr of this.resolvedPredefinedRanges()) {
      const dr = pr.range();
      if (
        this.dateUtils.isSameDay(dr.start, range.start) &&
        this.dateUtils.isSameDay(dr.end, range.end)
      ) {
        return pr.label;
      }
    }
    return null;
  }
}
