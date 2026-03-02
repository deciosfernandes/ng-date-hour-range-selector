import { Injectable } from '@angular/core';
import { DateRange, PredefinedRange } from '../models/date-range.model';

/** A single cell in the calendar grid */
export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
  /**
   * Returns exactly 42 Date objects (6 × 7 grid) centred on the given month.
   * Cells from adjacent months are included to fill incomplete first/last weeks.
   */
  getCalendarGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): Date[] {
    const firstOfMonth = new Date(year, month, 1);
    let startOffset = firstOfMonth.getDay() - weekStartsOn;
    if (startOffset < 0) startOffset += 7;

    const cells: Date[] = [];

    // Days from previous month
    for (let i = startOffset; i > 0; i--) {
      cells.push(new Date(year, month, 1 - i));
    }

    // Days of current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }

    // Days from next month to complete 42 cells
    let overflow = 1;
    while (cells.length < 42) {
      cells.push(new Date(year, month + 1, overflow++));
    }

    return cells;
  }

  /** Build CalendarCell metadata for each date in the grid */
  buildCells(
    grid: Date[],
    currentMonth: number,
    start: Date | null,
    end: Date | null,
    hover: Date | null,
    minDate: Date | null,
    maxDate: Date | null,
  ): CalendarCell[] {
    const rangeEnd = end ?? hover;
    const today = new Date();

    return grid.map((date) => {
      const isRangeStart = start !== null && this.isSameDay(date, start);
      const isRangeEnd = rangeEnd !== null && this.isSameDay(date, rangeEnd);
      const isInRange =
        start !== null &&
        rangeEnd !== null &&
        date >= this.startOfDay(start) &&
        date <= this.startOfDay(rangeEnd);

      return {
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: this.isSameDay(date, today),
        isRangeStart,
        isRangeEnd,
        isInRange,
        isDisabled:
          (minDate !== null && this.startOfDay(date) < this.startOfDay(minDate)) ||
          (maxDate !== null && this.startOfDay(date) > this.startOfDay(maxDate)),
      };
    });
  }

  // ─── Date helpers ──────────────────────────────────────────────────────────

  isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  addDays(d: Date, days: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  }

  startOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
    const diff = (d.getDay() - weekStartsOn + 7) % 7;
    return this.startOfDay(this.addDays(d, -diff));
  }

  endOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
    return this.endOfDay(this.addDays(this.startOfWeek(d, weekStartsOn), 6));
  }

  startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }

  endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  startOfQuarter(d: Date): Date {
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3, 1, 0, 0, 0, 0);
  }

  endOfQuarter(d: Date): Date {
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  }

  // ─── Predefined ranges ─────────────────────────────────────────────────────

  getDefaultPredefinedRanges(weekStartsOn: 0 | 1 = 1): PredefinedRange[] {
    return [
      {
        label: 'Today',
        range: () => {
          const now = new Date();
          return { start: this.startOfDay(now), end: this.endOfDay(now) };
        },
      },
      {
        label: 'Yesterday',
        range: () => {
          const yesterday = this.addDays(new Date(), -1);
          return { start: this.startOfDay(yesterday), end: this.endOfDay(yesterday) };
        },
      },
      {
        label: 'This week',
        range: () => {
          const now = new Date();
          return {
            start: this.startOfWeek(now, weekStartsOn),
            end: this.endOfWeek(now, weekStartsOn),
          };
        },
      },
      {
        label: 'Last week',
        range: () => {
          const lastWeek = this.addDays(new Date(), -7);
          return {
            start: this.startOfWeek(lastWeek, weekStartsOn),
            end: this.endOfWeek(lastWeek, weekStartsOn),
          };
        },
      },
      {
        label: 'This month',
        range: () => {
          const now = new Date();
          return { start: this.startOfMonth(now), end: this.endOfMonth(now) };
        },
      },
      {
        label: 'Last month',
        range: () => {
          const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
          return { start: this.startOfMonth(lastMonth), end: this.endOfMonth(lastMonth) };
        },
      },
      {
        label: 'This quarter',
        range: () => {
          const now = new Date();
          return { start: this.startOfQuarter(now), end: this.endOfQuarter(now) };
        },
      },
      {
        label: 'Last quarter',
        range: () => {
          const lastQ = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1);
          return { start: this.startOfQuarter(lastQ), end: this.endOfQuarter(lastQ) };
        },
      },
    ];
  }

  // ─── Range navigation ──────────────────────────────────────────────────────

  /**
   * Advances or rewinds a range by exactly one "step" equal to the range's length.
   *
   * Example: Mon–Sun (7 days) forward → next Mon–Sun.
   *
   * @param range   The current DateRange.
   * @param direction  1 to go forward, -1 to go backward.
   * @param minDate  Optional lower bound clamp.
   * @param maxDate  Optional upper bound clamp.
   */
  advanceRange(
    range: DateRange,
    direction: 1 | -1,
    minDate?: Date | null,
    maxDate?: Date | null,
  ): DateRange {
    const startDay = this.startOfDay(range.start);
    const endDay = this.startOfDay(range.end);
    const dayDiff = Math.round((endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000));

    let newStart: Date;
    let newEnd: Date;

    if (direction === 1) {
      newStart = this.addDays(endDay, 1);
      newEnd = this.addDays(newStart, dayDiff);
    } else {
      newEnd = this.addDays(startDay, -1);
      newStart = this.addDays(newEnd, -dayDiff);
    }

    // Restore original time-of-day
    newStart.setHours(
      range.start.getHours(),
      range.start.getMinutes(),
      range.start.getSeconds(),
      0,
    );
    newEnd.setHours(range.end.getHours(), range.end.getMinutes(), range.end.getSeconds(), 0);

    // Clamp
    if (minDate && newStart < minDate) {
      const shift = minDate.getTime() - newStart.getTime();
      newStart = new Date(newStart.getTime() + shift);
      newEnd = new Date(newEnd.getTime() + shift);
    }
    if (maxDate && newEnd > maxDate) {
      const shift = newEnd.getTime() - maxDate.getTime();
      newStart = new Date(newStart.getTime() - shift);
      newEnd = new Date(newEnd.getTime() - shift);
    }

    return { start: newStart, end: newEnd };
  }
}
