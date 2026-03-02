import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateRange, DateRangePickerComponent } from 'ng-date-hour-range-selector';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, DateRangePickerComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly rangeControl = new FormControl<DateRange | null>(null);
  readonly lastEmitted = signal<DateRange | null>(null);

  private readonly picker = viewChild(DateRangePickerComponent);

  onRangeChange(range: DateRange | null): void {
    this.lastEmitted.set(range);
  }

  next(): void {
    this.picker()?.nextRange();
  }

  previous(): void {
    this.picker()?.previousRange();
  }
}
