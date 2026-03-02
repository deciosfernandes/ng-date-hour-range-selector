import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CalendarCell, DateUtilsService } from '../../services/date-utils.service';
import { PICKER_LOCALE } from '../../tokens/locale.token';

@Component({
  selector: 'drs-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './calendar.component.scss',
  template: `
    <div class="drs-cal">
      <!-- Month / year header -->
      <div class="drs-cal__header">
        <button
          class="drs-cal__nav"
          type="button"
          (click)="prevMonth.emit()"
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <span class="drs-cal__title">{{ title() }}</span>
        <button
          class="drs-cal__nav"
          type="button"
          (click)="nextMonth.emit()"
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      <!-- Day-of-week headers -->
      <div class="drs-cal__weekdays" role="row">
        @for (day of weekDayLabels(); track day) {
          <span class="drs-cal__weekday" role="columnheader" [attr.aria-label]="day">{{
            day
          }}</span>
        }
      </div>

      <!-- Date grid -->
      <div class="drs-cal__grid" role="grid">
        @for (cell of cells(); track cell.date.toISOString()) {
          <button
            class="drs-cal__day"
            type="button"
            role="gridcell"
            [attr.aria-label]="cell.date.toDateString()"
            [attr.aria-selected]="cell.isRangeStart || cell.isRangeEnd || null"
            [attr.aria-disabled]="cell.isDisabled || null"
            [disabled]="cell.isDisabled"
            [class.drs-cal__day--other-month]="!cell.isCurrentMonth"
            [class.drs-cal__day--today]="cell.isToday"
            [class.drs-cal__day--range-start]="cell.isRangeStart"
            [class.drs-cal__day--range-end]="cell.isRangeEnd"
            [class.drs-cal__day--in-range]="
              cell.isInRange && !cell.isRangeStart && !cell.isRangeEnd
            "
            (click)="onDayClick(cell)"
            (mouseenter)="hoverDate.set(cell.date)"
            (mouseleave)="hoverDate.set(null)"
            (focus)="hoverDate.set(cell.date)"
            (blur)="hoverDate.set(null)"
          >
            {{ cell.date.getDate() }}
          </button>
        }
      </div>
    </div>
  `,
})
export class CalendarComponent {
  // ─── Deps ────────────────────────────────────────────────────────────────
  private readonly dateUtils = inject(DateUtilsService);
  protected readonly locale = inject(PICKER_LOCALE);

  // ─── Inputs ──────────────────────────────────────────────────────────────
  year = input.required<number>();
  month = input.required<number>();
  rangeStart = input<Date | null>(null);
  rangeEnd = input<Date | null>(null);
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);
  weekStartsOn = input<0 | 1>(1);

  // ─── Outputs ─────────────────────────────────────────────────────────────
  readonly prevMonth = output<void>();
  readonly nextMonth = output<void>();
  /** Emitted when the user clicks a day. */
  readonly dateSelect = output<Date>();

  // ─── Internal state ───────────────────────────────────────────────────────
  protected readonly hoverDate = signal<Date | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────
  protected readonly title = computed(() => {
    const monthName = this.locale.monthNames[this.month()];
    return `${monthName} ${this.year()}`;
  });

  protected readonly weekDayLabels = computed<string[]>(() => {
    const all = this.locale.daysOfWeek;
    const start = this.weekStartsOn();
    return [...all.slice(start), ...all.slice(0, start)];
  });

  protected readonly cells = computed<CalendarCell[]>(() => {
    const grid = this.dateUtils.getCalendarGrid(this.year(), this.month(), this.weekStartsOn());
    const end = this.rangeEnd();
    const hover = this.hoverDate();
    // Show hover preview only when start is chosen but end is not yet confirmed
    const effectiveHover = end === null ? hover : null;
    return this.dateUtils.buildCells(
      grid,
      this.month(),
      this.rangeStart(),
      end,
      effectiveHover,
      this.minDate(),
      this.maxDate(),
    );
  });

  // ─── Handlers ────────────────────────────────────────────────────────────
  protected onDayClick(cell: CalendarCell): void {
    if (!cell.isDisabled) {
      this.dateSelect.emit(cell.date);
    }
  }
}
