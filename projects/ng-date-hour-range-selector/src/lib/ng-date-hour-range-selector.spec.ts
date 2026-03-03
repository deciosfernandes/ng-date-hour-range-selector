// All tests are co-located with their source files:
//   services/date-utils.service.spec.ts
//   components/calendar/calendar.component.spec.ts
//   components/time-picker/time-picker.component.spec.ts
//   components/predefined-ranges/predefined-ranges.component.spec.ts
//   components/date-range-picker/date-range-picker.component.spec.ts
//   components/date-range-picker/date-range-picker.directive.spec.ts

import { describe, expect, it } from 'vitest';

describe('ng-date-hour-range-selector', () => {
  it('exports a public API surface', async () => {
    const api = await import('../public-api');

    // Components
    expect(api.DateRangePickerComponent).toBeDefined();
    expect(api.DateRangePickerPanelComponent).toBeDefined();
    expect(api.CalendarComponent).toBeDefined();
    expect(api.TimePickerComponent).toBeDefined();
    expect(api.PredefinedRangesComponent).toBeDefined();

    // Directive
    expect(api.DateRangePickerDirective).toBeDefined();

    // Tokens
    expect(api.PICKER_CONFIG).toBeDefined();
    expect(api.PICKER_LOCALE).toBeDefined();
    expect(api.DEFAULT_PICKER_CONFIG).toBeDefined();
    expect(api.DEFAULT_PICKER_LOCALE).toBeDefined();

    // Service
    expect(api.DateUtilsService).toBeDefined();
  });
});
