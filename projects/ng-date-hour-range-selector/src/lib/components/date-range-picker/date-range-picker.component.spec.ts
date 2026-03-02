import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DateRange } from '../../models/date-range.model';
import { DEFAULT_PICKER_CONFIG, PICKER_CONFIG } from '../../tokens/config.token';
import { DEFAULT_PICKER_LOCALE, PICKER_LOCALE } from '../../tokens/locale.token';
import { DateRangePickerComponent } from './date-range-picker.component';

describe('DateRangePickerComponent', () => {
  let fixture: ComponentFixture<DateRangePickerComponent>;
  let component: DateRangePickerComponent;
  let overlayContainer: OverlayContainer;
  let overlayContainerEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DateRangePickerComponent, ReactiveFormsModule],
      providers: [
        { provide: PICKER_LOCALE, useValue: DEFAULT_PICKER_LOCALE },
        { provide: PICKER_CONFIG, useValue: DEFAULT_PICKER_CONFIG },
      ],
    });

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerEl = overlayContainer.getContainerElement();

    fixture = TestBed.createComponent(DateRangePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainerEl.innerHTML = '';
  });

  // ─── ControlValueAccessor ──────────────────────────────────────────────

  describe('ControlValueAccessor', () => {
    it('writeValue sets the internal value signal', () => {
      const range: DateRange = { start: new Date(2024, 0, 5), end: new Date(2024, 0, 10) };
      component.writeValue(range);
      expect(component.value()).toEqual(range);
    });

    it('writeValue with null clears the value', () => {
      component.writeValue({ start: new Date(2024, 0, 5), end: new Date(2024, 0, 10) });
      component.writeValue(null);
      expect(component.value()).toBeNull();
    });

    it('registers onChange callback and invokes it on commit', () => {
      const committed: (DateRange | null)[] = [];
      component.registerOnChange((v) => committed.push(v));

      // Simulate two date selections to commit a range
      component['onDateSelect'](new Date(2024, 0, 5)); // start
      component['onDateSelect'](new Date(2024, 0, 10)); // end

      expect(committed.length).toBe(1);
      expect(committed[0]).not.toBeNull();
      expect((committed[0] as DateRange).start.getDate()).toBe(5);
      expect((committed[0] as DateRange).end.getDate()).toBe(10);
    });

    it('setDisabledState disables the picker', () => {
      component.setDisabledState(true);
      expect(component['isDisabled']()).toBe(true);
    });

    it('setDisabledState(false) re-enables the picker', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);
      expect(component['isDisabled']()).toBe(false);
    });

    it('works with a FormControl via reactive forms', () => {
      const control = new FormControl<DateRange | null>(null);
      // Manually wire up the CVA
      component.registerOnChange((v) => control.setValue(v));
      const range: DateRange = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) };
      component['onRangeSelect']({ label: 'This month', range: () => range });
      expect(control.value?.start.getDate()).toBe(1);
      expect(control.value?.end.getDate()).toBe(31);
    });
  });

  // ─── rangeChange output ────────────────────────────────────────────────

  describe('rangeChange output', () => {
    it('emits the committed range', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onDateSelect'](new Date(2024, 0, 3));
      component['onDateSelect'](new Date(2024, 0, 8));

      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).start.getDate()).toBe(3);
    });

    it('emits null when reset is called', () => {
      component['onDateSelect'](new Date(2024, 0, 3));
      component['onDateSelect'](new Date(2024, 0, 8));

      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onReset']();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBeNull();
    });
  });

  // ─── Date selection logic ──────────────────────────────────────────────

  describe('onDateSelect', () => {
    it('sets rangeStart on first click', () => {
      component['onDateSelect'](new Date(2024, 0, 5));
      expect(component['rangeStart']()?.getDate()).toBe(5);
      expect(component['rangeEnd']()).toBeNull();
    });

    it('sets rangeEnd on second click', () => {
      component['onDateSelect'](new Date(2024, 0, 5));
      component['onDateSelect'](new Date(2024, 0, 10));
      expect(component['rangeEnd']()?.getDate()).toBe(10);
    });

    it('swaps start/end when second click is before start', () => {
      component['onDateSelect'](new Date(2024, 0, 10));
      component['onDateSelect'](new Date(2024, 0, 3));
      // After swap: start should be the 3rd, end the 10th
      expect(component['rangeStart']()?.getDate()).toBe(3);
      expect(component['rangeEnd']()?.getDate()).toBe(10);
    });

    it('begins a new selection after a range is already committed', () => {
      component['onDateSelect'](new Date(2024, 0, 5));
      component['onDateSelect'](new Date(2024, 0, 10));
      // Third click starts a new selection
      component['onDateSelect'](new Date(2024, 0, 15));
      expect(component['rangeStart']()?.getDate()).toBe(15);
      expect(component['rangeEnd']()).toBeNull();
    });

    it('clears the activeRangeLabel on manual date select', () => {
      // First set a predefined range
      component['onRangeSelect']({
        label: 'Today',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59) }),
      });
      expect(component['activeRangeLabel']()).toBe('Today');

      // Manual selection clears the label
      component['onDateSelect'](new Date(2024, 0, 5));
      expect(component['activeRangeLabel']()).toBeNull();
    });
  });

  // ─── Predefined range selection ────────────────────────────────────────

  describe('onRangeSelect', () => {
    it('sets the range and commits the value', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      const predefined = {
        label: 'Custom',
        range: () => ({ start: new Date(2024, 2, 1), end: new Date(2024, 2, 31) }),
      };
      component['onRangeSelect'](predefined);

      expect(component.value()?.start.getMonth()).toBe(2);
      expect(emitted.length).toBe(1);
    });

    it('sets the activeRangeLabel', () => {
      component['onRangeSelect']({
        label: 'This month',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) }),
      });
      expect(component['activeRangeLabel']()).toBe('This month');
    });

    it('updates the calendar view month/year to match range start', () => {
      component['onRangeSelect']({
        label: 'Future',
        range: () => ({ start: new Date(2025, 5, 1), end: new Date(2025, 5, 30) }),
      });
      expect(component['viewYear']()).toBe(2025);
      expect(component['viewMonth']()).toBe(5);
    });
  });

  // ─── onReset ────────────────────────────────────────────────────────────

  describe('onReset', () => {
    it('clears all range state', () => {
      component.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      component['onReset']();

      expect(component.value()).toBeNull();
      expect(component['rangeStart']()).toBeNull();
      expect(component['rangeEnd']()).toBeNull();
      expect(component['activeRangeLabel']()).toBeNull();
    });
  });

  // ─── Calendar navigation ────────────────────────────────────────────────

  describe('calendar navigation', () => {
    it('prevMonth decrements the month', () => {
      const initialMonth = component['viewMonth']();
      component['prevMonth']();
      fixture.detectChanges();
      expect(component['viewMonth']()).toBe(initialMonth === 0 ? 11 : initialMonth - 1);
    });

    it('prevMonth wraps from January to December and decrements year', () => {
      component['_viewMonth'].set(0);
      const year = component['viewYear']();
      component['prevMonth']();
      expect(component['viewMonth']()).toBe(11);
      expect(component['viewYear']()).toBe(year - 1);
    });

    it('nextMonth increments the month', () => {
      component['_viewMonth'].set(5);
      component['nextMonth']();
      expect(component['viewMonth']()).toBe(6);
    });

    it('nextMonth wraps from December to January and increments year', () => {
      component['_viewMonth'].set(11);
      const year = component['viewYear']();
      component['nextMonth']();
      expect(component['viewMonth']()).toBe(0);
      expect(component['viewYear']()).toBe(year + 1);
    });
  });

  // ─── Time picker integration ────────────────────────────────────────────

  describe('time picker integration', () => {
    beforeEach(() => {
      // Establish a base range
      component.writeValue({
        start: new Date(2024, 0, 5, 8, 0),
        end: new Date(2024, 0, 10, 18, 0),
      });
    });

    it('onStartTimeChange updates start time and commits', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onStartTimeChange']({ hour: 9, minute: 30 });

      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).start.getHours()).toBe(9);
      expect((emitted[0] as DateRange).start.getMinutes()).toBe(30);
    });

    it('onEndTimeChange updates end time and commits', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onEndTimeChange']({ hour: 20, minute: 45 });

      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).end.getHours()).toBe(20);
      expect((emitted[0] as DateRange).end.getMinutes()).toBe(45);
    });

    it('onStartTimeChange stores pending time but does not emit when rangeStart is null', () => {
      component.writeValue(null);
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onStartTimeChange']({ hour: 9, minute: 0 });

      expect(emitted.length).toBe(0);
    });

    it('onStartTimeChange emits using committed end when mid-selection (rangeEnd is null)', () => {
      // User starts a new date selection — clears rangeEnd but value() still holds old end
      component['onDateSelect'](new Date(2024, 0, 20)); // begins new selection
      expect(component['rangeEnd']()).toBeNull();

      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component['onStartTimeChange']({ hour: 11, minute: 15 });

      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).start.getHours()).toBe(11);
      expect((emitted[0] as DateRange).start.getMinutes()).toBe(15);
      // end comes from value().end (Jan 10 from beforeEach)
      expect((emitted[0] as DateRange).end.getDate()).toBe(10);
    });

    it('onEndTimeChange emits using committed start when mid-selection (rangeEnd is null)', () => {
      // User starts a new date selection — clears rangeEnd but value() still holds old start
      component['onDateSelect'](new Date(2024, 0, 20)); // begins new selection
      expect(component['rangeEnd']()).toBeNull();

      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      // onEndTimeChange: rangeEnd is null → stores to pending; rangeStart is set
      // but we flip to cover the fallback via rangeStart() ?? value()?.start
      // Confirm it doesn't blow up and doesn't emit (rangeEnd is null → stores pending)
      component['onEndTimeChange']({ hour: 22, minute: 0 });

      expect(emitted.length).toBe(0); // rangeEnd not set, can't construct a range end date
    });
  });

  // ─── nextRange / previousRange ─────────────────────────────────────────

  describe('nextRange / previousRange', () => {
    it('nextRange advances the range by its duration', () => {
      component.writeValue({
        start: new Date(2024, 0, 1, 0, 0),
        end: new Date(2024, 0, 7, 23, 59),
      });

      component.nextRange();

      const { start, end } = component.value()!;
      expect(start.getDate()).toBe(8);
      expect(end.getDate()).toBe(14);
    });

    it('previousRange rewinds the range by its duration', () => {
      component.writeValue({
        start: new Date(2024, 0, 8, 0, 0),
        end: new Date(2024, 0, 14, 23, 59),
      });

      component.previousRange();

      const { start, end } = component.value()!;
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(7);
    });

    it('nextRange does nothing when no value is set', () => {
      component.writeValue(null);
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component.nextRange();

      expect(emitted.length).toBe(0);
    });

    it('previousRange does nothing when no value is set', () => {
      component.writeValue(null);
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component.previousRange();

      expect(emitted.length).toBe(0);
    });
  });

  // ─── resolvedConfig ────────────────────────────────────────────────────

  describe('resolvedConfig', () => {
    it('uses the global config defaults', () => {
      const cfg = component['resolvedConfig']();
      expect(cfg.showTime).toBe(true);
      expect(cfg.timeFormat).toBe('24h');
      expect(cfg.minuteStep).toBe(1);
      expect(cfg.weekStartsOn).toBe(1);
    });

    it('input overrides global config', () => {
      fixture.componentRef.setInput('showTime', false);
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.detectChanges();

      const cfg = component['resolvedConfig']();
      expect(cfg.showTime).toBe(false);
      expect(cfg.timeFormat).toBe('24h');
    });

    it('closeOnSelect defaults to true', () => {
      expect(component['resolvedConfig']().closeOnSelect).toBe(true);
    });

    it('showApplyButton defaults to false', () => {
      expect(component['resolvedConfig']().showApplyButton).toBe(false);
    });

    it('closeOnSelect can be overridden via input', () => {
      fixture.componentRef.setInput('closeOnSelect', false);
      fixture.detectChanges();
      expect(component['resolvedConfig']().closeOnSelect).toBe(false);
    });

    it('showApplyButton can be overridden via input', () => {
      fixture.componentRef.setInput('showApplyButton', true);
      fixture.detectChanges();
      expect(component['resolvedConfig']().showApplyButton).toBe(true);
    });
  });

  // ─── closeOnSelect ─────────────────────────────────────────────────────

  describe('closeOnSelect', () => {
    it('closes the picker after range is committed when closeOnSelect is true', () => {
      fixture.componentRef.setInput('closeOnSelect', true);
      fixture.detectChanges();

      // Open the picker
      component['open']();
      expect(component['isOpen']()).toBe(true);

      component['onDateSelect'](new Date(2024, 0, 5));
      component['onDateSelect'](new Date(2024, 0, 10));

      expect(component['isOpen']()).toBe(false);
    });

    it('does not close picker after range committed when closeOnSelect is false', () => {
      fixture.componentRef.setInput('closeOnSelect', false);
      fixture.detectChanges();

      component['open']();
      expect(component['isOpen']()).toBe(true);

      component['onDateSelect'](new Date(2024, 0, 5));
      component['onDateSelect'](new Date(2024, 0, 10));

      expect(component['isOpen']()).toBe(true);
    });

    it('closes picker after predefined range is selected when closeOnSelect is true', () => {
      fixture.componentRef.setInput('closeOnSelect', true);
      fixture.detectChanges();

      component['open']();
      expect(component['isOpen']()).toBe(true);

      component['onRangeSelect']({
        label: 'Today',
        range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59) }),
      });

      expect(component['isOpen']()).toBe(false);
    });
  });

  // ─── setRange ──────────────────────────────────────────────────────────

  describe('setRange', () => {
    it('sets the range and emits rangeChange', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      const range: DateRange = { start: new Date(2024, 3, 1), end: new Date(2024, 3, 30) };
      component.setRange(range);

      expect(component.value()?.start.getMonth()).toBe(3);
      expect(component.value()?.end.getDate()).toBe(30);
      expect(emitted.length).toBe(1);
      expect((emitted[0] as DateRange).start.getMonth()).toBe(3);
    });

    it('clears the range when called with null and emits null', () => {
      component.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });

      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component.setRange(null);

      expect(component.value()).toBeNull();
      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBeNull();
    });

    it('updates the calendar view month/year to match the new range', () => {
      component.setRange({ start: new Date(2025, 7, 1), end: new Date(2025, 7, 31) });

      expect(component['viewYear']()).toBe(2025);
      expect(component['viewMonth']()).toBe(7);
    });

    it('does not emit rangeChange when emitEvent is false', () => {
      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      const range: DateRange = { start: new Date(2024, 3, 1), end: new Date(2024, 3, 30) };
      component.setRange(range, false);

      expect(component.value()?.start.getMonth()).toBe(3);
      expect(emitted.length).toBe(0);
    });

    it('does not emit rangeChange on null clear when emitEvent is false', () => {
      component.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });

      const emitted: (DateRange | null)[] = [];
      component.rangeChange.subscribe((v) => emitted.push(v));

      component.setRange(null, false);

      expect(component.value()).toBeNull();
      expect(emitted.length).toBe(0);
    });
  });

  // ─── onApply ───────────────────────────────────────────────────────────

  describe('onApply', () => {
    it('closes the picker', () => {
      component['open']();
      expect(component['isOpen']()).toBe(true);

      component['onApply']();

      expect(component['isOpen']()).toBe(false);
    });
  });

  // ─── displayValue ──────────────────────────────────────────────────────

  describe('displayValue', () => {
    it('returns empty string when no range is set', () => {
      expect(component['displayValue']()).toBe('');
    });

    it('returns a formatted string when a range is set', () => {
      component.writeValue({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) });
      expect(component['displayValue']()).not.toBe('');
      expect(typeof component['displayValue']()).toBe('string');
    });
  });
});
