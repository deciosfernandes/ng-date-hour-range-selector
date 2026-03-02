import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PredefinedRange } from '../../models/date-range.model';
import { DEFAULT_PICKER_LOCALE, PICKER_LOCALE } from '../../tokens/locale.token';
import { PredefinedRangesComponent } from './predefined-ranges.component';

const RANGES: PredefinedRange[] = [
  {
    label: 'Today',
    range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59) }),
  },
  {
    label: 'This week',
    range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59) }),
  },
  {
    label: 'This month',
    range: () => ({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 31, 23, 59) }),
  },
];

describe('PredefinedRangesComponent', () => {
  let fixture: ComponentFixture<PredefinedRangesComponent>;
  let component: PredefinedRangesComponent;
  let el: HTMLElement;

  function createFixture(activeLabel: string | null = null): void {
    fixture = TestBed.createComponent(PredefinedRangesComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;

    fixture.componentRef.setInput('ranges', RANGES);
    fixture.componentRef.setInput('activeLabel', activeLabel);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PredefinedRangesComponent],
      providers: [{ provide: PICKER_LOCALE, useValue: DEFAULT_PICKER_LOCALE }],
    });
  });

  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a button for each range', () => {
    createFixture();
    const buttons = el.querySelectorAll('.drs-prd__btn');
    expect(buttons.length).toBe(RANGES.length);
  });

  it('renders the correct label text on each button', () => {
    createFixture();
    const labels = Array.from(el.querySelectorAll<HTMLElement>('.drs-prd__btn')).map((b) =>
      b.textContent?.trim(),
    );
    expect(labels).toEqual(RANGES.map((r) => r.label));
  });

  it('renders a reset button with the locale reset label', () => {
    createFixture();
    const resetBtn = el.querySelector('.drs-prd__reset');
    expect(resetBtn?.textContent?.trim()).toBe(DEFAULT_PICKER_LOCALE.reset);
  });

  it('renders a <nav> with an accessible label', () => {
    createFixture();
    const nav = el.querySelector('nav.drs-prd');
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  // ─── Active label ───────────────────────────────────────────────────────

  it('applies active class to the button matching activeLabel', () => {
    createFixture('Today');
    const activeBtn = el.querySelector('.drs-prd__btn--active');
    expect(activeBtn?.textContent?.trim()).toBe('Today');
  });

  it('does not apply active class when activeLabel is null', () => {
    createFixture(null);
    const activeBtns = el.querySelectorAll('.drs-prd__btn--active');
    expect(activeBtns.length).toBe(0);
  });

  it('applies active class only to the matching button, not others', () => {
    createFixture('This week');
    const allBtns = el.querySelectorAll<HTMLElement>('.drs-prd__btn');
    const activeBtns = el.querySelectorAll('.drs-prd__btn--active');
    expect(activeBtns.length).toBe(1);
    expect(activeBtns[0].textContent?.trim()).toBe('This week');
    // others must not be active
    Array.from(allBtns)
      .filter((b) => b.textContent?.trim() !== 'This week')
      .forEach((b) => expect(b.classList.contains('drs-prd__btn--active')).toBe(false));
  });

  it('sets aria-pressed="true" on the active button', () => {
    createFixture('Today');
    const activeBtn = el.querySelector<HTMLElement>('.drs-prd__btn--active');
    expect(activeBtn?.getAttribute('aria-pressed')).toBe('true');
  });

  it('sets aria-pressed="false" on inactive buttons', () => {
    createFixture('Today');
    const inactiveBtns = Array.from(
      el.querySelectorAll<HTMLElement>('.drs-prd__btn:not(.drs-prd__btn--active)'),
    );
    inactiveBtns.forEach((b) => expect(b.getAttribute('aria-pressed')).toBe('false'));
  });

  // ─── Outputs ────────────────────────────────────────────────────────────

  it('emits rangeSelect with the correct PredefinedRange when a button is clicked', () => {
    createFixture();
    const emitted: PredefinedRange[] = [];
    component.rangeSelect.subscribe((v) => emitted.push(v));

    const buttons = el.querySelectorAll<HTMLButtonElement>('.drs-prd__btn');
    buttons[1].click(); // "This week"

    expect(emitted.length).toBe(1);
    expect(emitted[0].label).toBe('This week');
  });

  it('emits rangeSelect for each button independently', () => {
    createFixture();
    const emitted: PredefinedRange[] = [];
    component.rangeSelect.subscribe((v) => emitted.push(v));

    const buttons = el.querySelectorAll<HTMLButtonElement>('.drs-prd__btn');
    buttons[0].click();
    buttons[2].click();

    expect(emitted.length).toBe(2);
    expect(emitted[0].label).toBe('Today');
    expect(emitted[1].label).toBe('This month');
  });

  it('emits reset when the reset button is clicked', () => {
    createFixture();
    let resetCount = 0;
    component.reset.subscribe(() => resetCount++);

    el.querySelector<HTMLButtonElement>('.drs-prd__reset')!.click();

    expect(resetCount).toBe(1);
  });

  it('does not emit rangeSelect when the reset button is clicked', () => {
    createFixture();
    const emitted: PredefinedRange[] = [];
    component.rangeSelect.subscribe((v) => emitted.push(v));

    el.querySelector<HTMLButtonElement>('.drs-prd__reset')!.click();

    expect(emitted.length).toBe(0);
  });
});
