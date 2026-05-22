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
        @if (allowManualTimeInput()) {
          <input
            class="drs-time__input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            [value]="displayHour()"
            [attr.aria-label]="timeFormat() === '12h' ? 'Hour (1 to 12)' : 'Hour (0 to 23)'"
            [attr.aria-description]="
              timeFormat() === '12h'
                ? 'Enter an hour between 1 and 12. Use the increment and decrement buttons for step changes.'
                : 'Enter an hour between 0 and 23. Use the increment and decrement buttons for step changes.'
            "
            (change)="onHourInputChange($event)"
            (blur)="onHourInputBlur($event)"
          />
        } @else {
          <span class="drs-time__value" aria-live="polite">{{ displayHour() }}</span>
        }
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
        @if (allowManualTimeInput()) {
          <input
            class="drs-time__input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            [value]="displayMinute()"
            aria-label="Minute (0 to 59)"
            aria-description="Enter minutes between 0 and 59. Use the increment and decrement buttons for step changes."
            (change)="onMinuteInputChange($event)"
            (blur)="onMinuteInputBlur($event)"
          />
        } @else {
          <span class="drs-time__value" aria-live="polite">{{ displayMinute() }}</span>
        }
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
  private static readonly VALID_TIME_INPUT_PATTERN = /^\d{1,2}$/;
  protected readonly locale = inject(PICKER_LOCALE);

  // ─── Inputs ──────────────────────────────────────────────────────────────
  /** Hour in 24h format (0–23) */
  hour = input.required<number>();
  /** Minute (0–59) */
  minute = input.required<number>();
  timeFormat = input<'12h' | '24h'>('12h');
  minuteStep = input<number>(1);
  allowManualTimeInput = input<boolean>(false);
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

  protected onHourInputChange(event: Event): void {
    this.updateHourFromText((event.target as HTMLInputElement).value, false);
  }

  protected onHourInputBlur(event: Event): void {
    this.updateHourFromText((event.target as HTMLInputElement).value, true);
  }

  protected onMinuteInputChange(event: Event): void {
    this.updateMinuteFromText((event.target as HTMLInputElement).value, false);
  }

  protected onMinuteInputBlur(event: Event): void {
    this.updateMinuteFromText((event.target as HTMLInputElement).value, true);
  }

  private updateHourFromText(raw: string, clamp: boolean): void {
    const hour = this.parseHour(raw, clamp);
    if (hour === null) return;
    this.emit(hour, this.minute());
  }

  private updateMinuteFromText(raw: string, clamp: boolean): void {
    const minute = this.parseBoundedInteger(raw, 0, 59, clamp);
    if (minute === null) return;
    this.emit(this.hour(), minute);
  }

  private parseHour(raw: string, clamp: boolean): number | null {
    if (this.timeFormat() === '24h') {
      return this.parseBoundedInteger(raw, 0, 23, clamp);
    }

    const parsed12h = this.parseBoundedInteger(raw, 1, 12, clamp);
    if (parsed12h === null) return null;

    if (parsed12h === 12) {
      return this.isPM() ? 12 : 0;
    }
    return this.isPM() ? parsed12h + 12 : parsed12h;
  }

  private parseBoundedInteger(
    raw: string,
    min: number,
    max: number,
    clamp: boolean,
  ): number | null {
    const trimmed = raw.trim();
    if (!TimePickerComponent.VALID_TIME_INPUT_PATTERN.test(trimmed)) return null;

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) return null;
    if (clamp) return Math.min(max, Math.max(min, parsed));
    if (parsed < min || parsed > max) return null;
    return parsed;
  }

  private emit(hour: number, minute: number): void {
    this.timeChange.emit({ hour, minute });
  }
}
