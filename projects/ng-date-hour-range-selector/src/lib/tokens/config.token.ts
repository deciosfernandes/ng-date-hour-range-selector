import { InjectionToken } from '@angular/core';
import { PickerConfig } from '../models/config.model';

export const DEFAULT_PICKER_CONFIG: Required<
  Pick<PickerConfig, 'showTime' | 'timeFormat' | 'minuteStep' | 'weekStartsOn' | 'position'>
> = {
  showTime: true,
  timeFormat: '24h',
  minuteStep: 1,
  weekStartsOn: 1,
  position: [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
  ],
};

/**
 * Injection token for global picker configuration defaults.
 * Override at the root or feature level:
 *
 * ```ts
 * { provide: PICKER_CONFIG, useValue: { showTime: false, timeFormat: '24h' } }
 * ```
 */
export const PICKER_CONFIG = new InjectionToken<PickerConfig>('PICKER_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_PICKER_CONFIG,
});
