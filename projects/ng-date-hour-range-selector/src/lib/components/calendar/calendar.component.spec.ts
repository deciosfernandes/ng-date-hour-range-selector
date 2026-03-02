import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PICKER_LOCALE, PICKER_LOCALE } from '../../tokens/locale.token';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;
  let el: HTMLElement;

  function createFixture(
    year: number,
    month: number,
    options: {
      rangeStart?: Date | null;
      rangeEnd?: Date | null;
      minDate?: Date | null;
      maxDate?: Date | null;
      weekStartsOn?: 0 | 1;
    } = {},
  ): void {
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;

    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('month', month);
    if (options.rangeStart !== undefined)
      fixture.componentRef.setInput('rangeStart', options.rangeStart);
    if (options.rangeEnd !== undefined) fixture.componentRef.setInput('rangeEnd', options.rangeEnd);
    if (options.minDate !== undefined) fixture.componentRef.setInput('minDate', options.minDate);
    if (options.maxDate !== undefined) fixture.componentRef.setInput('maxDate', options.maxDate);
    if (options.weekStartsOn !== undefined)
      fixture.componentRef.setInput('weekStartsOn', options.weekStartsOn);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [{ provide: PICKER_LOCALE, useValue: DEFAULT_PICKER_LOCALE }],
    });
  });

  // ─── Rendering ──────────────────────────────────────────────────────────

  it('displays the correct month and year in the title', () => {
    createFixture(2024, 0);
    const title = el.querySelector('.drs-cal__title');
    expect(title?.textContent?.trim()).toBe('January 2024');
  });

  it('displays the correct month title for December', () => {
    createFixture(2023, 11);
    const title = el.querySelector('.drs-cal__title');
    expect(title?.textContent?.trim()).toBe('December 2023');
  });

  it('renders exactly 42 day buttons', () => {
    createFixture(2024, 0);
    const days = el.querySelectorAll('.drs-cal__day');
    expect(days.length).toBe(42);
  });

  it('renders 7 weekday headers', () => {
    createFixture(2024, 0);
    const weekdays = el.querySelectorAll('.drs-cal__weekday');
    expect(weekdays.length).toBe(7);
  });

  it('renders weekdays starting from Monday when weekStartsOn=1', () => {
    createFixture(2024, 0, { weekStartsOn: 1 });
    const weekdays = el.querySelectorAll<HTMLElement>('.drs-cal__weekday');
    expect(weekdays[0]?.textContent?.trim()).toBe('Mo');
    expect(weekdays[6]?.textContent?.trim()).toBe('Su');
  });

  it('renders weekdays starting from Sunday when weekStartsOn=0', () => {
    createFixture(2024, 0, { weekStartsOn: 0 });
    const weekdays = el.querySelectorAll<HTMLElement>('.drs-cal__weekday');
    expect(weekdays[0]?.textContent?.trim()).toBe('Su');
    expect(weekdays[6]?.textContent?.trim()).toBe('Sa');
  });

  // ─── Range CSS classes ──────────────────────────────────────────────────

  it('applies range-start class to the start date', () => {
    const start = new Date(2024, 0, 5);
    createFixture(2024, 0, { rangeStart: start, rangeEnd: new Date(2024, 0, 10) });
    const startBtn = Array.from(el.querySelectorAll<HTMLElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '5' && !b.classList.contains('drs-cal__day--other-month'),
    );
    expect(startBtn?.classList.contains('drs-cal__day--range-start')).toBe(true);
  });

  it('applies range-end class to the end date', () => {
    createFixture(2024, 0, { rangeStart: new Date(2024, 0, 5), rangeEnd: new Date(2024, 0, 10) });
    const endBtn = Array.from(el.querySelectorAll<HTMLElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '10' && !b.classList.contains('drs-cal__day--other-month'),
    );
    expect(endBtn?.classList.contains('drs-cal__day--range-end')).toBe(true);
  });

  it('applies in-range class to days between start and end', () => {
    createFixture(2024, 0, { rangeStart: new Date(2024, 0, 5), rangeEnd: new Date(2024, 0, 10) });
    const inRangeDays = el.querySelectorAll('.drs-cal__day--in-range');
    // Days 5,6,7,8,9,10 are in range. 5 is start, 10 is end — neither has --in-range alone
    // The template only applies --in-range when NOT start/end, so 6,7,8,9 = 4 days
    expect(inRangeDays.length).toBe(4);
  });

  // ─── Disabled ───────────────────────────────────────────────────────────

  it('disables days before minDate', () => {
    createFixture(2024, 0, { minDate: new Date(2024, 0, 15) });
    const jan1 = Array.from(el.querySelectorAll<HTMLButtonElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '1' && !b.classList.contains('drs-cal__day--other-month'),
    );
    expect(jan1?.disabled).toBe(true);
  });

  it('does not disable days on or after minDate', () => {
    createFixture(2024, 0, { minDate: new Date(2024, 0, 15) });
    const jan15 = Array.from(el.querySelectorAll<HTMLButtonElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '15' && !b.classList.contains('drs-cal__day--other-month'),
    );
    expect(jan15?.disabled).toBe(false);
  });

  it('disables days after maxDate', () => {
    createFixture(2024, 0, { maxDate: new Date(2024, 0, 10) });
    const jan31 = Array.from(el.querySelectorAll<HTMLButtonElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '31' && !b.classList.contains('drs-cal__day--other-month'),
    );
    expect(jan31?.disabled).toBe(true);
  });

  // ─── Outputs ────────────────────────────────────────────────────────────

  it('emits dateSelect when a non-disabled day is clicked', () => {
    createFixture(2024, 0);
    const spy = vi.fn();
    component.dateSelect.subscribe(spy);

    const jan5 = Array.from(el.querySelectorAll<HTMLButtonElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '5' && !b.classList.contains('drs-cal__day--other-month'),
    )!;
    jan5.click();

    expect(spy).toHaveBeenCalledOnce();
    const emitted: Date = spy.mock.calls[0][0];
    expect(emitted.getFullYear()).toBe(2024);
    expect(emitted.getMonth()).toBe(0);
    expect(emitted.getDate()).toBe(5);
  });

  it('does not emit dateSelect when a disabled day is clicked', () => {
    createFixture(2024, 0, { minDate: new Date(2024, 0, 15) });
    const spy = vi.fn();
    component.dateSelect.subscribe(spy);

    const jan1 = Array.from(el.querySelectorAll<HTMLButtonElement>('.drs-cal__day')).find(
      (b) => b.textContent?.trim() === '1' && !b.classList.contains('drs-cal__day--other-month'),
    )!;
    jan1.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('emits prevMonth when the previous-month button is clicked', () => {
    createFixture(2024, 0);
    const spy = vi.fn();
    component.prevMonth.subscribe(spy);

    const prevBtn = el.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!;
    prevBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('emits nextMonth when the next-month button is clicked', () => {
    createFixture(2024, 0);
    const spy = vi.fn();
    component.nextMonth.subscribe(spy);

    const nextBtn = el.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!;
    nextBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('sets aria-selected on range-start and range-end cells', () => {
    createFixture(2024, 0, { rangeStart: new Date(2024, 0, 5), rangeEnd: new Date(2024, 0, 10) });

    const startBtn = Array.from(el.querySelectorAll<HTMLElement>('.drs-cal__day')).find((b) =>
      b.classList.contains('drs-cal__day--range-start'),
    );
    const endBtn = Array.from(el.querySelectorAll<HTMLElement>('.drs-cal__day')).find((b) =>
      b.classList.contains('drs-cal__day--range-end'),
    );

    expect(startBtn?.getAttribute('aria-selected')).toBe('true');
    expect(endBtn?.getAttribute('aria-selected')).toBe('true');
  });

  it('sets aria-disabled on disabled cells', () => {
    createFixture(2024, 0, { minDate: new Date(2024, 0, 15) });
    const disabledCells = el.querySelectorAll('[aria-disabled="true"]');
    expect(disabledCells.length).toBeGreaterThan(0);
  });

  it('sets aria-label on each day button', () => {
    createFixture(2024, 0);
    const dayBtns = el.querySelectorAll<HTMLElement>('.drs-cal__day');
    dayBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
