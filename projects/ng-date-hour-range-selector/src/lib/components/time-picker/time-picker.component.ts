import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { PICKER_LOCALE } from '../../tokens/locale.token';

export interface TimeValue {
  /** Hour in 24h format (0–23) */
  hour: number;
  /** Minute (0–59) */
  minute: number;
}

@Component({
  selector: 'drs-time-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './time-picker.component.scss',
  template: `
    <div class="drs-time" role="group" [attr.aria-label]="ariaLabel()">
      <!-- Hours column -->
      <div class="drs-time__col">
        <button
          class="drs-time__btn"
          type="button"
          aria-label="Increment hour"
          (click)="incrementHour()"
        >
          &#8963;
        </button>
        <span class="drs-time__value" aria-live="polite">{{ displayHour() }}</span>
        <button
          class="drs-time__btn"
          type="button"
          aria-label="Decrement hour"
          (click)="decrementHour()"
        >
          &#8964;
        </button>
      </div>

      <!-- Separator -->
      <span class="drs-time__sep" aria-hidden="true">:</span>

      <!-- Minutes column -->
      <div class="drs-time__col">
        <button
          class="drs-time__btn"
          type="button"
          aria-label="Increment minute"
          (click)="incrementMinute()"
        >
          &#8963;
        </button>
        <span class="drs-time__value" aria-live="polite">{{ displayMinute() }}</span>
        <button
          class="drs-time__btn"
          type="button"
          aria-label="Decrement minute"
          (click)="decrementMinute()"
        >
          &#8964;
        </button>
      </div>

      <!-- AM / PM toggle -->
      @if (timeFormat() === '12h') {
        <button
          class="drs-time__ampm"
          type="button"
          [attr.aria-label]="
            isPM()
              ? locale.am + ' / ' + locale.pm + ', currently PM'
              : locale.am + ' / ' + locale.pm + ', currently AM'
          "
          (click)="toggleAmPm()"
        >
          {{ isPM() ? locale.pm : locale.am }}
        </button>
      }
    </div>
  `,
})
export class TimePickerComponent {
  protected readonly locale = inject(PICKER_LOCALE);

  // ─── Inputs ──────────────────────────────────────────────────────────────
  /** Hour in 24h format (0–23) */
  hour = input.required<number>();
  /** Minute (0–59) */
  minute = input.required<number>();
  timeFormat = input<'12h' | '24h'>('12h');
  minuteStep = input<number>(1);
  ariaLabel = input<string>('Time picker');

  // ─── Outputs ─────────────────────────────────────────────────────────────
  readonly timeChange = output<TimeValue>();

  // ─── Computed ─────────────────────────────────────────────────────────────
  protected readonly isPM = computed(() => this.hour() >= 12);

  protected readonly displayHour = computed(() => {
    if (this.timeFormat() === '12h') {
      const h = this.hour() % 12;
      return String(h === 0 ? 12 : h).padStart(2, '0');
    }
    return String(this.hour()).padStart(2, '0');
  });

  protected readonly displayMinute = computed(() => String(this.minute()).padStart(2, '0'));

  // ─── Actions ─────────────────────────────────────────────────────────────
  protected incrementHour(): void {
    this.emit((this.hour() + 1) % 24, this.minute());
  }

  protected decrementHour(): void {
    this.emit((this.hour() - 1 + 24) % 24, this.minute());
  }

  protected incrementMinute(): void {
    const step = this.minuteStep();
    const next = this.minute() + step;
    if (next >= 60) {
      this.emit((this.hour() + 1) % 24, next % 60);
    } else {
      this.emit(this.hour(), next);
    }
  }

  protected decrementMinute(): void {
    const step = this.minuteStep();
    const prev = this.minute() - step;
    if (prev < 0) {
      this.emit((this.hour() - 1 + 24) % 24, (60 + prev) % 60);
    } else {
      this.emit(this.hour(), prev);
    }
  }

  protected toggleAmPm(): void {
    const newHour = this.isPM() ? this.hour() - 12 : this.hour() + 12;
    this.emit(newHour, this.minute());
  }

  private emit(hour: number, minute: number): void {
    this.timeChange.emit({ hour, minute });
  }
}
