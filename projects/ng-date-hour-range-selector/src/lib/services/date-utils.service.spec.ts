import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DateUtilsService } from './date-utils.service';

describe('DateUtilsService', () => {
  let svc: DateUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(DateUtilsService);
  });

  // ─── getCalendarGrid ───────────────────────────────────────────────────────

  describe('getCalendarGrid', () => {
    it('always returns exactly 42 cells', () => {
      // Check several months
      for (let month = 0; month < 12; month++) {
        expect(svc.getCalendarGrid(2024, month, 1)).toHaveLength(42);
      }
    });

    it('includes the correct days of the month', () => {
      const cells = svc.getCalendarGrid(2024, 0, 1); // January 2024
      const janDays = cells.filter((d) => d.getMonth() === 0 && d.getFullYear() === 2024);
      expect(janDays).toHaveLength(31);
    });

    it('starts on Monday when weekStartsOn=1', () => {
      // January 2024 starts on a Monday
      const cells = svc.getCalendarGrid(2024, 0, 1);
      expect(cells[0].getDay()).toBe(1); // Monday
    });

    it('starts on Sunday when weekStartsOn=0', () => {
      // January 2024 — first Sunday on or before the 1st
      const cells = svc.getCalendarGrid(2024, 0, 0);
      expect(cells[0].getDay()).toBe(0); // Sunday
    });

    it('fills trailing cells with days from the next month', () => {
      const cells = svc.getCalendarGrid(2024, 0, 1); // January 2024
      const lastCell = cells[41];
      // The last cell must be after Jan 31
      expect(lastCell.getTime()).toBeGreaterThan(new Date(2024, 0, 31).getTime());
    });
  });

  // ─── buildCells ────────────────────────────────────────────────────────────

  describe('buildCells', () => {
    const year = 2024;
    const month = 0; // January

    it('marks isCurrentMonth correctly', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const cells = svc.buildCells(grid, month, null, null, null, null, null);
      const inMonth = cells.filter((c) => c.isCurrentMonth);
      expect(inMonth).toHaveLength(31);
    });

    it('marks isRangeStart and isRangeEnd', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const start = new Date(2024, 0, 5);
      const end = new Date(2024, 0, 10);
      const cells = svc.buildCells(grid, month, start, end, null, null, null);

      const startCell = cells.find((c) => svc.isSameDay(c.date, start));
      const endCell = cells.find((c) => svc.isSameDay(c.date, end));
      expect(startCell?.isRangeStart).toBe(true);
      expect(endCell?.isRangeEnd).toBe(true);
    });

    it('marks isInRange for days between start and end', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const start = new Date(2024, 0, 5);
      const end = new Date(2024, 0, 10);
      const cells = svc.buildCells(grid, month, start, end, null, null, null);

      const inRange = cells.filter((c) => c.isInRange);
      // Days 5–10 inclusive = 6 days
      expect(inRange).toHaveLength(6);
    });

    it('uses hover as effective end when end is null', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const start = new Date(2024, 0, 3);
      const hover = new Date(2024, 0, 7);
      const cells = svc.buildCells(grid, month, start, null, hover, null, null);

      const endCell = cells.find((c) => svc.isSameDay(c.date, hover));
      expect(endCell?.isRangeEnd).toBe(true);
    });

    it('ignores hover when end is already set', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const start = new Date(2024, 0, 3);
      const end = new Date(2024, 0, 6);
      const hover = new Date(2024, 0, 9);
      const cells = svc.buildCells(grid, month, start, end, hover, null, null);

      const hoverCell = cells.find((c) => svc.isSameDay(c.date, hover));
      expect(hoverCell?.isRangeEnd).toBe(false);
    });

    it('disables cells before minDate', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const minDate = new Date(2024, 0, 15);
      const cells = svc.buildCells(grid, month, null, null, null, minDate, null);

      const jan1Cell = cells.find((c) => svc.isSameDay(c.date, new Date(2024, 0, 1)));
      expect(jan1Cell?.isDisabled).toBe(true);

      const jan15Cell = cells.find((c) => svc.isSameDay(c.date, new Date(2024, 0, 15)));
      expect(jan15Cell?.isDisabled).toBe(false);
    });

    it('disables cells after maxDate', () => {
      const grid = svc.getCalendarGrid(year, month, 1);
      const maxDate = new Date(2024, 0, 10);
      const cells = svc.buildCells(grid, month, null, null, null, null, maxDate);

      const jan11Cell = cells.find((c) => svc.isSameDay(c.date, new Date(2024, 0, 11)));
      expect(jan11Cell?.isDisabled).toBe(true);

      const jan10Cell = cells.find((c) => svc.isSameDay(c.date, new Date(2024, 0, 10)));
      expect(jan10Cell?.isDisabled).toBe(false);
    });
  });

  // ─── isSameDay ─────────────────────────────────────────────────────────────

  describe('isSameDay', () => {
    it('returns true for the same calendar day regardless of time', () => {
      const a = new Date(2024, 5, 15, 8, 30, 0);
      const b = new Date(2024, 5, 15, 23, 59, 59);
      expect(svc.isSameDay(a, b)).toBe(true);
    });

    it('returns false for different days', () => {
      expect(svc.isSameDay(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(false);
    });

    it('returns false for same day in different months', () => {
      expect(svc.isSameDay(new Date(2024, 5, 15), new Date(2024, 6, 15))).toBe(false);
    });

    it('returns false for same day in different years', () => {
      expect(svc.isSameDay(new Date(2024, 5, 15), new Date(2025, 5, 15))).toBe(false);
    });
  });

  // ─── startOfDay / endOfDay ─────────────────────────────────────────────────

  describe('startOfDay', () => {
    it('sets time to midnight', () => {
      const d = svc.startOfDay(new Date(2024, 5, 15, 14, 30, 45, 999));
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
      expect(d.getMilliseconds()).toBe(0);
    });

    it('preserves the date', () => {
      const d = svc.startOfDay(new Date(2024, 5, 15, 14, 30));
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(5);
      expect(d.getDate()).toBe(15);
    });
  });

  describe('endOfDay', () => {
    it('sets time to 23:59:59.999', () => {
      const d = svc.endOfDay(new Date(2024, 5, 15, 0, 0, 0));
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(59);
      expect(d.getSeconds()).toBe(59);
      expect(d.getMilliseconds()).toBe(999);
    });
  });

  // ─── addDays ───────────────────────────────────────────────────────────────

  describe('addDays', () => {
    it('advances by positive days', () => {
      const result = svc.addDays(new Date(2024, 0, 28), 5);
      expect(result.getDate()).toBe(2);
      expect(result.getMonth()).toBe(1); // February
    });

    it('rewinds by negative days', () => {
      const result = svc.addDays(new Date(2024, 1, 3), -5);
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(0); // January (leap year)
    });

    it('does not mutate the input Date', () => {
      const original = new Date(2024, 0, 10);
      svc.addDays(original, 5);
      expect(original.getDate()).toBe(10);
    });
  });

  // ─── startOfWeek / endOfWeek ───────────────────────────────────────────────

  describe('startOfWeek', () => {
    it('returns the Monday when weekStartsOn=1', () => {
      // Wednesday 2024-01-10
      const result = svc.startOfWeek(new Date(2024, 0, 10), 1);
      expect(result.getDate()).toBe(8); // Monday
      expect(result.getDay()).toBe(1);
    });

    it('returns the Sunday when weekStartsOn=0', () => {
      // Wednesday 2024-01-10
      const result = svc.startOfWeek(new Date(2024, 0, 10), 0);
      expect(result.getDate()).toBe(7); // Sunday
      expect(result.getDay()).toBe(0);
    });

    it('returns itself when the day is already the start day', () => {
      // Monday 2024-01-08
      const monday = new Date(2024, 0, 8);
      const result = svc.startOfWeek(monday, 1);
      expect(svc.isSameDay(result, monday)).toBe(true);
    });
  });

  describe('endOfWeek', () => {
    it('returns Sunday (end of Mon-start week)', () => {
      const result = svc.endOfWeek(new Date(2024, 0, 10), 1);
      expect(result.getDate()).toBe(14); // Sunday 2024-01-14
      expect(result.getDay()).toBe(0);
    });

    it('returns Saturday for Sunday-start week', () => {
      const result = svc.endOfWeek(new Date(2024, 0, 10), 0);
      expect(result.getDate()).toBe(13); // Saturday 2024-01-13
      expect(result.getDay()).toBe(6);
    });
  });

  // ─── startOfMonth / endOfMonth ─────────────────────────────────────────────

  describe('startOfMonth', () => {
    it('returns the 1st at midnight', () => {
      const result = svc.startOfMonth(new Date(2024, 5, 20, 12, 30));
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });
  });

  describe('endOfMonth', () => {
    it('returns the last day of the month at 23:59:59', () => {
      const result = svc.endOfMonth(new Date(2024, 1, 10)); // February 2024 (leap)
      expect(result.getDate()).toBe(29);
      expect(result.getHours()).toBe(23);
    });

    it('returns the 30th for a 30-day month', () => {
      const result = svc.endOfMonth(new Date(2024, 3, 5)); // April
      expect(result.getDate()).toBe(30);
    });
  });

  // ─── startOfQuarter / endOfQuarter ────────────────────────────────────────

  describe('startOfQuarter', () => {
    it.each([
      [0, 0], // Jan → Q1 starts Jan
      [1, 0], // Feb → Q1 starts Jan
      [2, 0], // Mar → Q1 starts Jan
      [3, 3], // Apr → Q2 starts Apr
      [6, 6], // Jul → Q3 starts Jul
      [9, 9], // Oct → Q4 starts Oct
    ])('month %i → quarter start month %i', (inputMonth, expectedMonth) => {
      const result = svc.startOfQuarter(new Date(2024, inputMonth, 15));
      expect(result.getMonth()).toBe(expectedMonth);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('endOfQuarter', () => {
    it.each([
      [0, 2, 31], // Jan → Q1 ends Mar 31
      [3, 5, 30], // Apr → Q2 ends Jun 30
      [6, 8, 30], // Jul → Q3 ends Sep 30
      [9, 11, 31], // Oct → Q4 ends Dec 31
    ])('month %i → quarter end month %i day %i', (inputMonth, expectedMonth, expectedDay) => {
      const result = svc.endOfQuarter(new Date(2024, inputMonth, 15));
      expect(result.getMonth()).toBe(expectedMonth);
      expect(result.getDate()).toBe(expectedDay);
    });
  });

  // ─── getDefaultPredefinedRanges ────────────────────────────────────────────

  describe('getDefaultPredefinedRanges', () => {
    it('returns 8 shortcuts', () => {
      expect(svc.getDefaultPredefinedRanges()).toHaveLength(8);
    });

    it('has the expected labels', () => {
      const labels = svc.getDefaultPredefinedRanges().map((r) => r.label);
      expect(labels).toEqual([
        'Today',
        'Yesterday',
        'This week',
        'Last week',
        'This month',
        'Last month',
        'This quarter',
        'Last quarter',
      ]);
    });

    it('each range factory returns a DateRange with start ≤ end', () => {
      const ranges = svc.getDefaultPredefinedRanges();
      for (const range of ranges) {
        const { start, end } = range.range();
        expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
      }
    });

    it('Today range covers today only', () => {
      const today = svc.getDefaultPredefinedRanges().find((r) => r.label === 'Today')!;
      const { start, end } = today.range();
      const now = new Date();
      expect(svc.isSameDay(start, now)).toBe(true);
      expect(svc.isSameDay(end, now)).toBe(true);
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
    });
  });

  // ─── advanceRange ──────────────────────────────────────────────────────────

  describe('advanceRange', () => {
    it('advances a 7-day range forward by 7 days', () => {
      const range = {
        start: new Date(2024, 0, 1, 0, 0),
        end: new Date(2024, 0, 7, 23, 59),
      };
      const { start, end } = svc.advanceRange(range, 1);
      expect(start.getDate()).toBe(8);
      expect(end.getDate()).toBe(14);
      expect(start.getMonth()).toBe(0);
    });

    it('rewinds a 7-day range backward by 7 days', () => {
      const range = {
        start: new Date(2024, 0, 8, 0, 0),
        end: new Date(2024, 0, 14, 23, 59),
      };
      const { start, end } = svc.advanceRange(range, -1);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(7);
    });

    it('preserves time-of-day when advancing', () => {
      const range = {
        start: new Date(2024, 0, 1, 9, 30),
        end: new Date(2024, 0, 3, 18, 0),
      };
      const { start, end } = svc.advanceRange(range, 1);
      expect(start.getHours()).toBe(9);
      expect(start.getMinutes()).toBe(30);
      expect(end.getHours()).toBe(18);
      expect(end.getMinutes()).toBe(0);
    });

    it('clamps to minDate when advancing into it', () => {
      const range = {
        start: new Date(2024, 0, 1),
        end: new Date(2024, 0, 7),
      };
      const minDate = new Date(2024, 0, 5);
      const { start } = svc.advanceRange(range, -1, minDate);
      expect(start.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    });

    it('clamps to maxDate when advancing past it', () => {
      const range = {
        start: new Date(2024, 0, 1),
        end: new Date(2024, 0, 7),
      };
      const maxDate = new Date(2024, 0, 10);
      const { end } = svc.advanceRange(range, 1, null, maxDate);
      expect(end.getTime()).toBeLessThanOrEqual(maxDate.getTime());
    });

    it('advances a single-day range (start === end) by 1 day', () => {
      const range = {
        start: svc.startOfDay(new Date(2024, 0, 15)),
        end: svc.endOfDay(new Date(2024, 0, 15)),
      };
      const { start, end } = svc.advanceRange(range, 1);
      expect(start.getDate()).toBe(16);
      expect(end.getDate()).toBe(16);
    });
  });
});
