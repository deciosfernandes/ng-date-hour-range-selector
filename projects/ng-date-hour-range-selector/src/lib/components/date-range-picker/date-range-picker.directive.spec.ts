import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DateRange, PredefinedRange } from '../../models/date-range.model';
import { DEFAULT_PICKER_CONFIG, PICKER_CONFIG } from '../../tokens/config.token';
import { DEFAULT_PICKER_LOCALE, PICKER_LOCALE } from '../../tokens/locale.token';
import { DateRangePickerDirective } from './date-range-picker.directive';

// ─── Host components ────────────────────────────────────────────────────────

@Component({
  template: `<input drsDateRangePicker [formControl]="control" />`,
  imports: [DateRangePickerDirective, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<DateRange | null>(null);
}

@Component({
  template: `<input drsDateRangePicker [formControl]="control" [initialRange]="initRange" />`,
  imports: [DateRangePickerDirective, ReactiveFormsModule],
})
class HostWithInitialRange {
  control = new FormControl<DateRange | null>(null);
  initRange: DateRange | PredefinedRange | null = null;
}

@Component({
  template: `<input drsDateRangePicker [formControl]="control" [predefinedRanges]="ranges" />`,
  imports: [DateRangePickerDirective, ReactiveFormsModule],
})
class HostWithCustomRanges {
  control = new FormControl<DateRange | null>(null);
  ranges: PredefinedRange[] = [];
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getDirective(fixture: ComponentFixture<unknown>): DateRangePickerDirective {
  return fixture.debugElement
    .query(By.directive(DateRangePickerDirective))
    .injector.get(DateRangePickerDirective);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DateRangePickerDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: DateRangePickerDirective;
  let overlayContainer: OverlayContainer;
  let overlayContainerEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, HostWithInitialRange, HostWithCustomRanges, ReactiveFormsModule],
      providers: [
        { provide: PICKER_LOCALE, useValue: DEFAULT_PICKER_LOCALE },
        { provide: PICKER_CONFIG, useValue: DEFAULT_PICKER_CONFIG },
      ],
    });

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerEl = overlayContainer.getContainerElement();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    directive = getDirective(fixture);
  });

  afterEach(() => {
    overlayContainerEl.innerHTML = '';
  });

  // ─── Directive is applied ──────────────────────────────────────────────

  it('is applied to the input element', () => {
    expect(directive).toBeTruthy();
  });

  it('sets the host input to readonly via attribute', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.hasAttribute('readonly')).toBe(true);
  });

  it('sets aria-haspopup="dialog" on the host input', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-haspopup')).toBe('dialog');
  });

  // ─── ControlValueAccessor ──────────────────────────────────────────────

  describe('ControlValueAccessor', () => {
    it('writeValue sets the internal value signal', () => {
      const range: DateRange = { start: new Date(2024, 0, 5), end: new Date(2024, 0, 10) };
      directive.writeValue(range);
      expect(directive.value()).toEqual(range);
    });

    it('writeValue with null clears the value', () => {
      directive.writeValue({ start: new Date(2024, 0, 5), end: new Date(2024, 0, 10) });
      directive.writeValue(null);
      expect(directive.value()).toBeNull();
    });

    it('registers onChange callback and invokes it on commit', () => {
      const committed: (DateRange | null)[] = [];
      directive.registerOnChange((v) => committed.push(v));

      directive['onDateSelect'](new Date(2024, 0, 5));
      directive['onDateSelect'](new Date(2024, 0, 10));

      expect(committed.length).toBe(1);
      expect((committed[0] as DateRange).start.getDate()).toBe(5);
      expect((committed[0] as DateRange).end.getDate()).toBe(10);
    });

    it('setDisabledState disables the directive', () => {
      directive.setDisabledState(true);
      expect(directive['isDisabled']()).toBe(true);
    });

    it('setDisabledState(false) re-enables the directive', () => {
      directive.setDisabledState(true);
      directive.setDisabledState(false);
      expect(directive['isDisabled']()).toBe(false);
    });

    it('works with a FormControl binding', () => {
      const control = fixture.componentInstance.control;
      const range: DateRange = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) };
      directive['onRangeSelect']({ label: 'Jan', range: () => range });
      expect(control.value?.start.getDate()).toBe(1);
      expect(control.value?.end.getDate()).toBe(31);
    });
  });

  // ─── rangeChange output ────────────────────────────────────────────────

  describe('rangeChange output', () => {
    it('emits the committed range', () => {
      const emitted: (DateRange | null)[] = [];
      directive.rangeChange.subscribe((v) => emitted.push(v));

      directive['onDateSelect'](new Date(2024, 0, 3));
      directive['onDateSelect'](new Date(2024, 0, 8));

      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).start.getDate()).toBe(3);
    });

    it('emits null when reset is called', () => {
      directive['onDateSelect'](new Date(2024, 0, 3));
      directive['onDateSelect'](new Date(2024, 0, 8));

      const emitted: (DateRange | null)[] = [];
      directive.rangeChange.subscribe((v) => emitted.push(v));
      directive['onReset']();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBeNull();
    });
  });

  // ─── Native input value (displayValue effect) ──────────────────────────

  describe('native input value', () => {
    it('writes the formatted range into the native input value', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      directive.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      fixture.detectChanges();
      expect(input.value).not.toBe('');
    });

    it('shows the predefined range label in the input when a predefined range is active', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      directive['onRangeSelect']({
        label: 'Last 7 days',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) }),
      });
      fixture.detectChanges();
      expect(input.value).toBe('Last 7 days');
    });

    it('clears the input value when reset is called', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      directive['onRangeSelect']({
        label: 'Last 7 days',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) }),
      });
      directive['onReset']();
      fixture.detectChanges();
      expect(input.value).toBe('');
    });
  });

  // ─── Date selection logic ──────────────────────────────────────────────

  describe('onDateSelect', () => {
    it('sets rangeStart on first click', () => {
      directive['onDateSelect'](new Date(2024, 0, 5));
      expect(directive['rangeStart']()?.getDate()).toBe(5);
      expect(directive['rangeEnd']()).toBeNull();
    });

    it('sets rangeEnd and commits on second click', () => {
      directive['onDateSelect'](new Date(2024, 0, 5));
      directive['onDateSelect'](new Date(2024, 0, 10));
      expect(directive['rangeEnd']()?.getDate()).toBe(10);
      expect(directive.value()).not.toBeNull();
    });

    it('swaps start/end when second click is before start', () => {
      directive['onDateSelect'](new Date(2024, 0, 10));
      directive['onDateSelect'](new Date(2024, 0, 3));
      expect(directive['rangeStart']()?.getDate()).toBe(3);
      expect(directive['rangeEnd']()?.getDate()).toBe(10);
    });

    it('clears activeRangeLabel on manual date select', () => {
      directive['onRangeSelect']({
        label: 'Today',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59) }),
      });
      directive['onDateSelect'](new Date(2024, 0, 5));
      expect(directive['activeRangeLabel']()).toBeNull();
    });
  });

  // ─── Predefined range selection ────────────────────────────────────────

  describe('onRangeSelect', () => {
    it('sets the range and activeRangeLabel', () => {
      directive['onRangeSelect']({
        label: 'This week',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59) }),
      });
      expect(directive['activeRangeLabel']()).toBe('This week');
      expect(directive.value()?.start.getDate()).toBe(1);
    });

    it('updates the calendar view to the range start month/year', () => {
      directive['onRangeSelect']({
        label: 'Future',
        range: () => ({ start: new Date(2025, 11, 1), end: new Date(2025, 11, 31) }),
      });
      expect(directive['_viewYear']()).toBe(2025);
      expect(directive['_viewMonth']()).toBe(11);
    });
  });

  // ─── onReset ──────────────────────────────────────────────────────────

  describe('onReset', () => {
    it('clears all state', () => {
      directive.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      directive['onReset']();
      expect(directive.value()).toBeNull();
      expect(directive['rangeStart']()).toBeNull();
      expect(directive['rangeEnd']()).toBeNull();
      expect(directive['activeRangeLabel']()).toBeNull();
    });
  });

  // ─── setRange ─────────────────────────────────────────────────────────

  describe('setRange', () => {
    it('sets the range and emits rangeChange', () => {
      const emitted: (DateRange | null)[] = [];
      directive.rangeChange.subscribe((v) => emitted.push(v));

      const range: DateRange = { start: new Date(2024, 3, 1), end: new Date(2024, 3, 30) };
      directive.setRange(range);

      expect(directive.value()?.start.getMonth()).toBe(3);
      expect(emitted.length).toBe(1);
    });

    it('clears range when called with null', () => {
      directive.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      directive.setRange(null);
      expect(directive.value()).toBeNull();
    });

    it('does not emit when emitEvent is false', () => {
      const emitted: (DateRange | null)[] = [];
      directive.rangeChange.subscribe((v) => emitted.push(v));

      directive.setRange({ start: new Date(2024, 3, 1), end: new Date(2024, 3, 30) }, false);
      expect(emitted.length).toBe(0);
    });
  });

  // ─── nextRange / previousRange ─────────────────────────────────────────

  describe('nextRange / previousRange', () => {
    it('nextRange advances the range by its duration', () => {
      directive.writeValue({
        start: new Date(2024, 0, 1, 0, 0),
        end: new Date(2024, 0, 7, 23, 59),
      });
      directive.nextRange();
      const { start, end } = directive.value()!;
      expect(start.getDate()).toBe(8);
      expect(end.getDate()).toBe(14);
    });

    it('previousRange rewinds the range by its duration', () => {
      directive.writeValue({
        start: new Date(2024, 0, 8, 0, 0),
        end: new Date(2024, 0, 14, 23, 59),
      });
      directive.previousRange();
      const { start, end } = directive.value()!;
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(7);
    });

    it('nextRange does nothing when no value is set', () => {
      directive.writeValue(null);
      const emitted: (DateRange | null)[] = [];
      directive.rangeChange.subscribe((v) => emitted.push(v));
      directive.nextRange();
      expect(emitted.length).toBe(0);
    });
  });

  // ─── initialRange ──────────────────────────────────────────────────────

  describe('initialRange', () => {
    it('applies a DateRange initial value on init', () => {
      const f = TestBed.createComponent(HostWithInitialRange);
      const range = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) };
      f.componentInstance.initRange = range;
      f.detectChanges();
      const dir = getDirective(f);
      expect(dir.value()).toEqual(range);
    });

    it('applies a PredefinedRange as initial value and sets the label', () => {
      const f = TestBed.createComponent(HostWithInitialRange);
      const preset: PredefinedRange = {
        label: 'Jan 2024',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) }),
      };
      f.componentInstance.initRange = preset;
      f.detectChanges();
      const dir = getDirective(f);
      expect(dir['activeRangeLabel']()).toBe('Jan 2024');
      expect(dir.value()?.start.getMonth()).toBe(0);
    });

    it('shows the PredefinedRange label in the native input', () => {
      const f = TestBed.createComponent(HostWithInitialRange);
      const preset: PredefinedRange = {
        label: 'Last 7 days',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) }),
      };
      f.componentInstance.initRange = preset;
      f.detectChanges();
      const input = f.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Last 7 days');
    });

    it('initialRange is ignored when the CVA already provided a value', () => {
      const f = TestBed.createComponent(HostWithInitialRange);
      const cvaRange = { start: new Date(2024, 5, 1), end: new Date(2024, 5, 30) };
      const initRange = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) };
      // CVA writes value before ngOnInit
      getDirective(f); // ensure directive is created — calling detect changes does this
      f.detectChanges(); // first detectChanges → ngOnInit runs with no CVA value yet
      // Now simulate CVA writing: set via writeValue before initial range check
      // Re-create with CVA value preset via control
      const f2 = TestBed.createComponent(HostWithInitialRange);
      f2.componentInstance.control.setValue(cvaRange);
      f2.componentInstance.initRange = initRange;
      f2.detectChanges();
      const dir = getDirective(f2);
      // CVA value must win over initialRange
      expect(dir.value()?.start.getMonth()).toBe(5);
    });

    it('adjusts calendar view to the initial range start month', () => {
      const f = TestBed.createComponent(HostWithInitialRange);
      const range = { start: new Date(2025, 9, 1), end: new Date(2025, 9, 31) };
      f.componentInstance.initRange = range;
      f.detectChanges();
      const dir = getDirective(f);
      expect(dir['_viewYear']()).toBe(2025);
      expect(dir['_viewMonth']()).toBe(9);
    });
  });

  // ─── auto-label detection (matchPredefinedRange) ───────────────────────

  describe('auto-label detection', () => {
    const CUSTOM_RANGES: PredefinedRange[] = [
      {
        label: 'Jan 2024',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) }),
      },
      {
        label: 'Feb 2024',
        range: () => ({ start: new Date(2024, 1, 1), end: new Date(2024, 1, 29) }),
      },
    ];

    let customFixture: ComponentFixture<HostWithCustomRanges>;
    let customDirective: DateRangePickerDirective;

    beforeEach(() => {
      customFixture = TestBed.createComponent(HostWithCustomRanges);
      customFixture.componentInstance.ranges = CUSTOM_RANGES;
      customFixture.detectChanges();
      customDirective = getDirective(customFixture);
    });

    it('writeValue sets activeRangeLabel when range matches', () => {
      customDirective.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      expect(customDirective['activeRangeLabel']()).toBe('Jan 2024');
    });

    it('writeValue leaves label null when no match', () => {
      customDirective.writeValue({ start: new Date(2024, 2, 1), end: new Date(2024, 2, 31) });
      expect(customDirective['activeRangeLabel']()).toBeNull();
    });

    it('setRange sets activeRangeLabel when range matches', () => {
      customDirective.setRange({ start: new Date(2024, 1, 1), end: new Date(2024, 1, 29) });
      expect(customDirective['activeRangeLabel']()).toBe('Feb 2024');
    });

    it('displayValue returns label when range matches', () => {
      customDirective.setRange({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      expect(customDirective['displayValue']()).toBe('Jan 2024');
    });

    it('matching is date-only — ignores time component', () => {
      customDirective.writeValue({
        start: new Date(2024, 0, 1, 9, 0),
        end: new Date(2024, 0, 31, 23, 59),
      });
      expect(customDirective['activeRangeLabel']()).toBe('Jan 2024');
    });
  });

  // ─── resolvedConfig ────────────────────────────────────────────────────

  describe('resolvedConfig', () => {
    it('uses global config defaults', () => {
      const cfg = directive['resolvedConfig']();
      expect(cfg.showTime).toBe(true);
      expect(cfg.timeFormat).toBe('24h');
      expect(cfg.minuteStep).toBe(1);
      expect(cfg.weekStartsOn).toBe(1);
    });
  });

  // ─── open / close overlay ─────────────────────────────────────────────

  describe('overlay', () => {
    it('open() sets isOpen to true', () => {
      directive.open();
      expect(directive['isOpen']()).toBe(true);
      directive.close();
    });

    it('close() sets isOpen to false', () => {
      directive.open();
      directive.close();
      expect(directive['isOpen']()).toBe(false);
    });

    it('open() does nothing when already open', () => {
      directive.open();
      // Second open call should not throw or create a second overlay
      expect(() => directive.open()).not.toThrow();
      directive.close();
    });

    it('open() does nothing when disabled', () => {
      directive.setDisabledState(true);
      directive.open();
      expect(directive['isOpen']()).toBe(false);
    });
  });
});
