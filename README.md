# ng-date-hour-range-selector

[![Live Demo](https://img.shields.io/badge/demo-live-orange?style=flat-square)](https://deciosfernandes.github.io/ng-date-hour-range-selector/)
[![npm](https://img.shields.io/npm/v/ng-date-hour-range-selector?style=flat-square)](https://www.npmjs.com/package/ng-date-hour-range-selector)

A flexible Angular **date / date-time range selector** built on Angular CDK Overlay. Supports predefined range shortcuts, time picking, localization, and full CSS customization — with zero third-party date-library dependency.

**[→ Live Demo](https://deciosfernandes.github.io/ng-date-hour-range-selector/)**

## Features

- Date **and** time range selection, or date-only mode
- 12-hour (AM/PM) and 24-hour time formats
- Configurable minute step
- Sidebar with predefined range shortcuts (Today, Yesterday, This/Last Week…)
- Works as a `ControlValueAccessor` — drop into any reactive form
- Fully localizable via the `PICKER_LOCALE` injection token
- No third-party date library required
- Built on Angular CDK Overlay
- Standalone components — no NgModule needed
- Accessible: keyboard navigation, ARIA attributes, meets WCAG AA
- Dark theme included; fully themeable via CSS custom properties

## Requirements

| Dependency     | Version   |
| -------------- | --------- |
| Angular        | `^21.0.0` |
| `@angular/cdk` | `^21.0.0` |

## Installation

```bash
npm install ng-date-hour-range-selector @angular/cdk
```

Import the built-in dark theme once in your global styles:

```scss
@import 'ng-date-hour-range-selector/styles/theme';
```

Add `provideAnimationsAsync()` to your application config:

```ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],
};
```

## Quick start

```ts
import { DateRange, DateRangePickerComponent } from 'ng-date-hour-range-selector';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, DateRangePickerComponent],
  template: `
    <drs-date-range-picker
      [formControl]="rangeControl"
      (rangeChange)="onRangeChange($event)"
      ariaLabel="Select date range"
    />
  `,
})
export class MyComponent {
  readonly rangeControl = new FormControl<DateRange | null>(null);

  onRangeChange(range: DateRange | null): void {
    console.log(range?.start, range?.end);
  }
}
```

## Component API — `<drs-date-range-picker>`

### Inputs

| Input              | Type                  | Default               | Description                                |
| ------------------ | --------------------- | --------------------- | ------------------------------------------ |
| `showTime`         | `boolean`             | `true`                | Show the time-picker section               |
| `timeFormat`       | `'12h' \| '24h'`      | `'12h'`               | 12-hour (AM/PM) or 24-hour format          |
| `minuteStep`       | `number`              | `1`                   | Minute increment step                      |
| `weekStartsOn`     | `0 \| 1`              | `1`                   | First day of week — `0` Sunday, `1` Monday |
| `predefinedRanges` | `PredefinedRange[]`   | built-in              | Sidebar shortcut definitions               |
| `minDate`          | `Date`                | —                     | Minimum selectable date (inclusive)        |
| `maxDate`          | `Date`                | —                     | Maximum selectable date (inclusive)        |
| `position`         | `ConnectedPosition[]` | bottom-start          | CDK Overlay connected positions            |
| `ariaLabel`        | `string`              | `'Select date range'` | Accessible label for the trigger button    |

### Output

| Output        | Payload             | Description                                           |
| ------------- | ------------------- | ----------------------------------------------------- |
| `rangeChange` | `DateRange \| null` | Emitted when a complete range is committed or cleared |

### Public methods

| Method            | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `nextRange()`     | Advance the current range forward by its own duration (e.g. Mon–Sun → next Mon–Sun) |
| `previousRange()` | Rewind the current range backward by its own duration                               |

### ControlValueAccessor

`DateRangePickerComponent` implements `ControlValueAccessor`, so it works with both `[formControl]` and `[(ngModel)]`:

```html
<!-- Reactive forms -->
<drs-date-range-picker [formControl]="rangeControl" />

<!-- Template-driven -->
<drs-date-range-picker [(ngModel)]="range" />
```

## Models

```ts
interface DateRange {
  start: Date;
  end: Date;
}

interface PredefinedRange {
  /** Label shown in the sidebar */
  label: string;
  /** Factory function — called on each click to produce a fresh range */
  range: () => DateRange;
}
```

## Global configuration — `PICKER_CONFIG`

Override defaults for every picker in your application (or a specific feature):

```ts
import { PICKER_CONFIG } from 'ng-date-hour-range-selector';

// app.config.ts
providers: [
  {
    provide: PICKER_CONFIG,
    useValue: { showTime: false, timeFormat: '24h', weekStartsOn: 0 },
  },
];
```

### `PickerConfig` interface

| Property           | Type                  | Default      | Description                     |
| ------------------ | --------------------- | ------------ | ------------------------------- |
| `showTime`         | `boolean`             | `true`       | Show time pickers               |
| `timeFormat`       | `'12h' \| '24h'`      | `'12h'`      | Hour format                     |
| `minuteStep`       | `number`              | `1`          | Minute increment step           |
| `weekStartsOn`     | `0 \| 1`              | `1`          | First day of week               |
| `predefinedRanges` | `PredefinedRange[]`   | built-in     | Override all shortcuts globally |
| `minDate`          | `Date`                | —            | Global minimum date             |
| `maxDate`          | `Date`                | —            | Global maximum date             |
| `position`         | `ConnectedPosition[]` | bottom-start | CDK overlay positions           |

## Localization — `PICKER_LOCALE`

Provide a `PickerLocale` object to translate every visible string:

```ts
import { PICKER_LOCALE, PickerLocale } from 'ng-date-hour-range-selector';

const ptBrLocale: PickerLocale = {
  daysOfWeek: ['Do', 'Se', 'Te', 'Qu', 'Qi', 'Se', 'Sa'],
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  am: 'AM',
  pm: 'PM',
  startTime: 'Início:',
  endTime: 'Fim:',
  reset: 'Limpar',
  placeholder: 'Selecione um período',
  formatRange: (start, end) =>
    `${start.toLocaleDateString('pt-BR')} – ${end.toLocaleDateString('pt-BR')}`,
};

providers: [{ provide: PICKER_LOCALE, useValue: ptBrLocale }];
```

### `PickerLocale` interface

| Property      | Type                                 | Description                                   |
| ------------- | ------------------------------------ | --------------------------------------------- |
| `daysOfWeek`  | `[string × 7]`                       | Abbreviated day labels — Sunday first         |
| `monthNames`  | `[string × 12]`                      | Full month names — January first              |
| `am`          | `string`                             | AM toggle label                               |
| `pm`          | `string`                             | PM toggle label                               |
| `startTime`   | `string`                             | Label above the start time picker             |
| `endTime`     | `string`                             | Label above the end time picker               |
| `reset`       | `string`                             | Reset/clear button label                      |
| `placeholder` | `string?`                            | Trigger placeholder when no range is selected |
| `formatRange` | `(start: Date, end: Date) => string` | Formats the trigger display value             |

## Predefined ranges

The sidebar shows these built-in shortcuts by default:

- Today
- Yesterday
- This week / Last week
- This month / Last month
- This quarter / Last quarter

Replace them per-picker via the `predefinedRanges` input, or globally via `PICKER_CONFIG`:

```ts
import { PredefinedRange } from 'ng-date-hour-range-selector';

const customRanges: PredefinedRange[] = [
  {
    label: 'Last 7 days',
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start, end };
    },
  },
  {
    label: 'Last 30 days',
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { start, end };
    },
  },
];
```

```html
<drs-date-range-picker [predefinedRanges]="customRanges" ariaLabel="Custom ranges" />
```

## Theming — CSS custom properties

Import the built-in dark theme and override variables at `:root` or on specific elements:

```scss
@import 'ng-date-hour-range-selector/styles/theme';

// Global accent colour
:root {
  --drs-primary: #3b82f6;
}

// Light theme on one picker instance
drs-date-range-picker.light {
  --drs-bg: #ffffff;
  --drs-text: #111111;
  --drs-border: rgba(0, 0, 0, 0.12);
  --drs-hover: rgba(0, 0, 0, 0.06);
  --drs-range-bg: rgba(59, 130, 246, 0.12);
}
```

### Full variable reference

| Variable                   | Description                       | Default      |
| -------------------------- | --------------------------------- | ------------ |
| `--drs-radius`             | Overlay panel border radius       | `10px`       |
| `--drs-radius-sm`          | Button border radius              | `5px`        |
| `--drs-sidebar-width`      | Predefined-ranges sidebar width   | `148px`      |
| `--drs-overlay-z`          | z-index of the overlay panel      | `1000`       |
| `--drs-shadow`             | Overlay panel box shadow          | dark shadow  |
| `--drs-bg`                 | Overlay / modal background        | `#1e1f22`    |
| `--drs-trigger-bg`         | Trigger button background         | `--drs-bg`   |
| `--drs-primary`            | Accent / highlight colour         | `#f97316`    |
| `--drs-primary-fg`         | Foreground on accent colour       | `#ffffff`    |
| `--drs-text`               | Primary text colour               | `#f1f1f1`    |
| `--drs-text-muted`         | Dimmed / secondary text           | 35 % opacity |
| `--drs-border`             | Border and divider colour         | 8 % white    |
| `--drs-hover`              | Hover background                  | 7 % white    |
| `--drs-range-bg`           | In-range day background           | orange 14 %  |
| `--drs-time-bg`            | Time-picker box background        | 5 % white    |
| `--drs-font-family`        | Font family                       | `inherit`    |
| `--drs-font-size`          | Base font size                    | `0.875rem`   |
| `--drs-header-font-size`   | Month / year header size          | `0.9375rem`  |
| `--drs-header-font-weight` | Month / year header weight        | `700`        |
| `--drs-weekday-font-size`  | Day-of-week label size            | `0.6875rem`  |
| `--drs-day-font-size`      | Day number size                   | `0.875rem`   |
| `--drs-sidebar-font-size`  | Predefined-range label size       | `0.875rem`   |
| `--drs-time-font-size`     | Hour / minute number size         | `1.375rem`   |
| `--drs-ampm-font-size`     | AM/PM toggle size                 | `0.9375rem`  |
| `--drs-label-font-size`    | "Start time:" / "End time:" label | `0.8125rem`  |
| `--drs-trigger-font-size`  | Trigger button text size          | `0.875rem`   |

## Exported API surface

```ts
// Components
import { DateRangePickerComponent } from 'ng-date-hour-range-selector';
import { CalendarComponent } from 'ng-date-hour-range-selector';
import { TimePickerComponent } from 'ng-date-hour-range-selector';
import { PredefinedRangesComponent } from 'ng-date-hour-range-selector';

// Models
import type { DateRange, PredefinedRange } from 'ng-date-hour-range-selector';
import type { PickerConfig } from 'ng-date-hour-range-selector';
import type { PickerLocale } from 'ng-date-hour-range-selector';
import type { TimeValue } from 'ng-date-hour-range-selector';
import type { CalendarCell } from 'ng-date-hour-range-selector';

// Tokens & defaults
import { PICKER_CONFIG, DEFAULT_PICKER_CONFIG } from 'ng-date-hour-range-selector';
import { PICKER_LOCALE, DEFAULT_PICKER_LOCALE } from 'ng-date-hour-range-selector';

// Service
import { DateUtilsService } from 'ng-date-hour-range-selector';
```

## Development

```bash
# Install dependencies
npm install

# Start the demo app at http://localhost:4200
npm start

# Build the library
npm run build:lib

# Build library + demo
npm run build

# Run unit tests (Vitest)
npm test
```

## License

MIT
