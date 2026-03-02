import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { PredefinedRange } from '../../models/date-range.model';
import { PICKER_LOCALE } from '../../tokens/locale.token';

@Component({
  selector: 'drs-predefined-ranges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './predefined-ranges.component.scss',
  template: `
    <nav class="drs-prd" aria-label="Predefined date ranges">
      <ul class="drs-prd__list" role="list">
        @for (item of ranges(); track item.label) {
          <li class="drs-prd__item">
            <button
              class="drs-prd__btn"
              type="button"
              [class.drs-prd__btn--active]="item.label === activeLabel()"
              [attr.aria-pressed]="item.label === activeLabel()"
              (click)="rangeSelect.emit(item)"
            >
              {{ item.label }}
            </button>
          </li>
        }
      </ul>

      @if (showReset()) {
        <button class="drs-prd__reset" type="button" (click)="reset.emit()">
          {{ locale.reset }}
        </button>
      }
    </nav>
  `,
})
export class PredefinedRangesComponent {
  protected readonly locale = inject(PICKER_LOCALE);

  ranges = input.required<PredefinedRange[]>();
  /** Label of the currently active range (if any) */
  activeLabel = input<string | null>(null);
  /** Whether to show the reset button. Default: true */
  showReset = input<boolean>(true);

  readonly rangeSelect = output<PredefinedRange>();
  readonly reset = output<void>();
}
