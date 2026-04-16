import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  DateRange,
  DateRangePickerComponent,
  DateRangePickerDirective,
  PredefinedRange,
} from 'ng-date-hour-range-selector';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, DateRangePickerComponent, DateRangePickerDirective, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly rangeControl = new FormControl<DateRange | null>(null);
  readonly directiveControl = new FormControl<DateRange | null>(null);
  readonly deferredControl = new FormControl<DateRange | null>(null);
  readonly lastEmitted = signal<DateRange | null>(null);
  readonly lastDeferredEmitted = signal<DateRange | null>(null);

  private readonly picker = viewChild(DateRangePickerComponent);

  // Min / max boundaries: restrict to current month only
  private readonly _now = new Date();
  readonly minDate = new Date(this._now.getFullYear(), this._now.getMonth(), 1);
  readonly maxDate = new Date(this._now.getFullYear(), this._now.getMonth() + 1, 0);

  /** Predefined range used as the initial value for the directive demo. */
  readonly last7DaysRange: PredefinedRange = {
    label: 'Last 7 days',
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start, end };
    },
  };

  // Custom predefined ranges (forward-looking)
  readonly customRanges: PredefinedRange[] = [
    {
      label: 'Next 7 days',
      range: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 6);
        return { start, end };
      },
    },
    {
      label: 'Next 30 days',
      range: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 29);
        return { start, end };
      },
    },
    {
      label: 'Next quarter',
      range: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 89);
        return { start, end };
      },
    },
  ];

  onRangeChange(range: DateRange | null): void {
    this.lastEmitted.set(range);
  }

  onDeferredRangeChange(range: DateRange | null): void {
    this.lastDeferredEmitted.set(range);
  }

  next(): void {
    this.picker()?.nextRange();
  }

  previous(): void {
    this.picker()?.previousRange();
  }
}
