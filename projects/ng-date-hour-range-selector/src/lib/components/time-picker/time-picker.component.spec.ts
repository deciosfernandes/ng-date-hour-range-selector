import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PICKER_LOCALE, PICKER_LOCALE } from '../../tokens/locale.token';
import { TimePickerComponent, TimeValue } from './time-picker.component';

describe('TimePickerComponent', () => {
  let fixture: ComponentFixture<TimePickerComponent>;
  let component: TimePickerComponent;
  let el: HTMLElement;

  function createFixture(
    hour: number,
    minute: number,
    options: { timeFormat?: '12h' | '24h'; minuteStep?: number; ariaLabel?: string } = {},
  ): void {
    fixture = TestBed.createComponent(TimePickerComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;

    fixture.componentRef.setInput('hour', hour);
    fixture.componentRef.setInput('minute', minute);
    if (options.timeFormat !== undefined)
      fixture.componentRef.setInput('timeFormat', options.timeFormat);
    if (options.minuteStep !== undefined)
      fixture.componentRef.setInput('minuteStep', options.minuteStep);
    if (options.ariaLabel !== undefined)
      fixture.componentRef.setInput('ariaLabel', options.ariaLabel);
    fixture.detectChanges();
  }

  function getValues(): { hour: string; minute: string } {
    const spans = el.querySelectorAll<HTMLElement>('.drs-time__value');
    return {
      hour: spans[0]?.textContent?.trim() ?? '',
      minute: spans[1]?.textContent?.trim() ?? '',
    };
  }

  function clickBtn(ariaLabel: string): void {
    const btn = el.querySelector<HTMLButtonElement>(`[aria-label="${ariaLabel}"]`)!;
    btn.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimePickerComponent],
      providers: [{ provide: PICKER_LOCALE, useValue: DEFAULT_PICKER_LOCALE }],
    });
  });

  // ─── 12-hour display ────────────────────────────────────────────────────

  describe('12-hour format', () => {
    it('displays 12:00 for hour=0 (midnight)', () => {
      createFixture(0, 0, { timeFormat: '12h' });
      expect(getValues().hour).toBe('12');
    });

    it('displays 12:00 for hour=12 (noon)', () => {
      createFixture(12, 0, { timeFormat: '12h' });
      expect(getValues().hour).toBe('12');
    });

    it('displays 01 for hour=1', () => {
      createFixture(1, 30, { timeFormat: '12h' });
      expect(getValues().hour).toBe('01');
    });

    it('displays 11 for hour=23', () => {
      createFixture(23, 0, { timeFormat: '12h' });
      expect(getValues().hour).toBe('11');
    });

    it('shows AM button when hour < 12', () => {
      createFixture(9, 0, { timeFormat: '12h' });
      const ampmBtn = el.querySelector('.drs-time__ampm');
      expect(ampmBtn?.textContent?.trim()).toBe('AM');
    });

    it('shows PM button when hour >= 12', () => {
      createFixture(14, 0, { timeFormat: '12h' });
      const ampmBtn = el.querySelector('.drs-time__ampm');
      expect(ampmBtn?.textContent?.trim()).toBe('PM');
    });

    it('does not show AM/PM in 24-hour mode', () => {
      createFixture(14, 0, { timeFormat: '24h' });
      const ampmBtn = el.querySelector('.drs-time__ampm');
      expect(ampmBtn).toBeNull();
    });
  });

  // ─── 24-hour display ────────────────────────────────────────────────────

  describe('24-hour format', () => {
    it('displays 00 for hour=0', () => {
      createFixture(0, 0, { timeFormat: '24h' });
      expect(getValues().hour).toBe('00');
    });

    it('displays 14 for hour=14', () => {
      createFixture(14, 30, { timeFormat: '24h' });
      expect(getValues().hour).toBe('14');
    });

    it('displays 23 for hour=23', () => {
      createFixture(23, 59, { timeFormat: '24h' });
      expect(getValues().hour).toBe('23');
    });
  });

  // ─── Minute display ─────────────────────────────────────────────────────

  it('pads single-digit minutes with a leading zero', () => {
    createFixture(10, 5);
    expect(getValues().minute).toBe('05');
  });

  it('displays 59 minutes correctly', () => {
    createFixture(10, 59);
    expect(getValues().minute).toBe('59');
  });

  // ─── Hour increment / decrement ──────────────────────────────────────────

  describe('hour controls', () => {
    it('emits incremented hour on "Increment hour" click', () => {
      createFixture(10, 30);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment hour');

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toEqual({ hour: 11, minute: 30 });
    });

    it('wraps from 23 to 0 on increment', () => {
      createFixture(23, 0);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment hour');

      expect(emitted[0].hour).toBe(0);
    });

    it('emits decremented hour on "Decrement hour" click', () => {
      createFixture(10, 30);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Decrement hour');

      expect(emitted[0]).toEqual({ hour: 9, minute: 30 });
    });

    it('wraps from 0 to 23 on decrement', () => {
      createFixture(0, 0);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Decrement hour');

      expect(emitted[0].hour).toBe(23);
    });
  });

  // ─── Minute increment / decrement ────────────────────────────────────────

  describe('minute controls', () => {
    it('increments minute by the default step of 1', () => {
      createFixture(10, 30);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment minute');

      expect(emitted[0]).toEqual({ hour: 10, minute: 31 });
    });

    it('rolls minute over 59 and increments hour', () => {
      createFixture(10, 59);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment minute');

      expect(emitted[0]).toEqual({ hour: 11, minute: 0 });
    });

    it('decrements minute by the default step of 1', () => {
      createFixture(10, 15);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Decrement minute');

      expect(emitted[0]).toEqual({ hour: 10, minute: 14 });
    });

    it('rolls minute below 0 and decrements hour', () => {
      createFixture(10, 0);
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Decrement minute');

      expect(emitted[0]).toEqual({ hour: 9, minute: 59 });
    });

    it('respects a custom minuteStep of 15', () => {
      createFixture(10, 0, { minuteStep: 15 });
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment minute');

      expect(emitted[0]).toEqual({ hour: 10, minute: 15 });
    });

    it('rolls over using custom minuteStep correctly', () => {
      createFixture(10, 50, { minuteStep: 15 });
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      clickBtn('Increment minute');

      // 50 + 15 = 65 → hour+1, minute = 5
      expect(emitted[0]).toEqual({ hour: 11, minute: 5 });
    });
  });

  // ─── AM/PM toggle ───────────────────────────────────────────────────────

  describe('AM/PM toggle', () => {
    it('toggles from AM to PM (adds 12 hours)', () => {
      createFixture(9, 30, { timeFormat: '12h' });
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      el.querySelector<HTMLButtonElement>('.drs-time__ampm')!.click();

      expect(emitted[0].hour).toBe(21);
    });

    it('toggles from PM to AM (subtracts 12 hours)', () => {
      createFixture(21, 30, { timeFormat: '12h' });
      const emitted: TimeValue[] = [];
      component.timeChange.subscribe((v) => emitted.push(v));

      el.querySelector<HTMLButtonElement>('.drs-time__ampm')!.click();

      expect(emitted[0].hour).toBe(9);
    });
  });

  // ─── ariaLabel ──────────────────────────────────────────────────────────

  it('applies the ariaLabel to the group container', () => {
    createFixture(10, 0, { ariaLabel: 'Start time' });
    const group = el.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Start time');
  });

  it('uses the default ariaLabel when none is provided', () => {
    createFixture(10, 0);
    const group = el.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Time picker');
  });
});
