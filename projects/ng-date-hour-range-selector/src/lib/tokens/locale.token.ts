import { InjectionToken } from '@angular/core';
import { PickerLocale } from '../models/locale.model';

export const DEFAULT_PICKER_LOCALE: PickerLocale = {
  daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  am: 'AM',
  pm: 'PM',
  startTime: 'Start time:',
  endTime: 'End time:',
  reset: 'Reset',
  apply: 'Apply',
  placeholder: 'Select a date range',
  formatRange: (start: Date, end: Date) =>
    `${start.toLocaleDateString()} \u2013 ${end.toLocaleDateString()}`,
  formatRangeWithTime: (start: Date, end: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${start.toLocaleDateString()} ${startTime} \u2013 ${end.toLocaleDateString()} ${endTime}`;
  },
};

/**
 * Injection token for picker locale strings.
 * Override globally by providing in your root or feature module/config:
 *
 * ```ts
 * { provide: PICKER_LOCALE, useValue: myLocale }
 * ```
 */
export const PICKER_LOCALE = new InjectionToken<PickerLocale>('PICKER_LOCALE', {
  providedIn: 'root',
  factory: () => DEFAULT_PICKER_LOCALE,
});
