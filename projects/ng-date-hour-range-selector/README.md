# ng-date-hour-range-selector

A flexible, fully accessible Angular date / date-time range picker built on top of **Angular CDK Overlay**. It supports predefined range shortcuts, 12h / 24h time pickers, full localization, CSS custom-property theming, and reactive-forms / template-driven binding out of the box.

## Features

- **Date & time range selection** — pick start and end dates with optional time precision
- **Predefined range shortcuts** — Today, Yesterday, This / Last Week, This / Last Month, and custom ones
- **24h / 12h time format** — configurable per picker or globally
- **Configurable calendar icon** — place the icon on the left, right, or hide it
- **Optional reset button** — show or hide the sidebar reset button
- **Initial range** — pre-select a range or predefined shortcut on load
- **Full localization** — override all labels, month names, and `formatRange` functions
- **CSS custom properties** — one-line theme overrides with zero `!important`
- **Reactive Forms & ControlValueAccessor** — drop-in `[formControl]` / `formControlName` / `[(ngModel)]` support
- **Directive variant** — `[drsDateRangePicker]` attaches the picker to any `<input>`
- **`nextRange()` / `previousRange()` / `setRange()`** — navigate or set ranges programmatically
- **Fully keyboard accessible** — WCAG AA compliant, passes AXE checks

---

## Installation

```bash
npm install ng-date-hour-range-selector @angular/cdk
```

The package requires `@angular/cdk`, `@angular/common`, `@angular/core`, and `@angular/forms` (`>=19.0.0`) as peer dependencies.

Import the global theme in your `styles.scss` (or in the `styles` array of `angular.json`):

```scss
@use 'ng-date-hour-range-selector/styles/theme';
```

Add `provideAnimationsAsync()` to your application config:

```ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],
};
```

---

## Quick start

### Component (`<drs-date-range-picker>`)

```typescript
import { DateRange, DateRangePickerComponent } from 'ng-date-hour-range-selector';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, DateRangePickerComponent],
  template: ` <drs-date-range-picker [formControl]="range" (rangeChange)="onRange($event)" /> `,
})
export class MyComponent {
  readonly range = new FormControl<DateRange | null>(null);

  onRange(value: DateRange | null): void {
    console.log(value);
  }
}
```

### Directive (`[drsDateRangePicker]`)

Attach the picker to any `<input>` element:

```typescript
import { DateRangePickerDirective } from 'ng-date-hour-range-selector';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, DateRangePickerDirective],
  template: ` <input drsDateRangePicker [formControl]="range" (rangeChange)="onRange($event)" /> `,
})
export class MyComponent {
  readonly range = new FormControl<DateRange | null>(null);

  onRange(value: DateRange | null): void {
    console.log(value);
  }
}
```

---

## Component inputs

| Input              | Type                            | Default               | Description                                                              |
| ------------------ | ------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `showTime`         | `boolean`                       | `true`                | Show/hide the time picker section inside the overlay                     |
| `timeFormat`       | `'12h' \| '24h'`                | `'24h'`               | Display format for the time pickers                                      |
| `minuteStep`       | `number`                        | `1`                   | Minute increment/decrement step                                          |
| `weekStartsOn`     | `0 \| 1`                        | `1`                   | First day of the week: `0` = Sunday, `1` = Monday                        |
| `predefinedRanges` | `PredefinedRange[]`             | built-in              | Custom sidebar shortcuts; omit to use built-in defaults                  |
| `minDate`          | `Date`                          | `undefined`           | Minimum selectable date (inclusive)                                      |
| `maxDate`          | `Date`                          | `undefined`           | Maximum selectable date (inclusive)                                      |
| `position`         | `ConnectedPosition[]`           | bottom-start          | CDK overlay positions array                                              |
| `showResetButton`  | `boolean`                       | `true`                | Show or hide the reset button in the sidebar                             |
| `calendarIcon`     | `'left' \| 'right' \| 'hidden'` | `'right'`             | Position of the calendar icon in the trigger button, or hide it entirely |
| `showApplyButton`  | `boolean`                       | `false`               | Show an Apply button that commits the selection and closes the picker    |
| `closeOnSelect`    | `boolean`                       | `true`                | Automatically close the picker after a complete range is selected        |
| `initialRange`     | `DateRange \| PredefinedRange`  | `undefined`           | Range or predefined-range factory to pre-select on component load        |
| `ariaLabel`        | `string`                        | `'Select date range'` | Accessible label for the trigger button                                  |

All inputs can also be set globally via the `PICKER_CONFIG` token (see [Global configuration](#global-configuration----picker_config)).

---

## Component outputs

| Output        | Type                | Description                                         |
| ------------- | ------------------- | --------------------------------------------------- |
| `rangeChange` | `DateRange \| null` | Emitted when a complete range is committed or reset |

---

## Directive API — `[drsDateRangePicker]`

The directive exposes the **same inputs and output** as the component, **except** `calendarIcon` (which is specific to the component's trigger button).

```html
<input drsDateRangePicker [formControl]="ctrl" [showTime]="false" />
```

---

## Public API methods

These methods are available on a component (or directive) reference obtained via `viewChild()`:

| Method                        | Description                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `nextRange()`                 | Advance the current range forward by its own duration                                                          |
| `previousRange()`             | Rewind the current range backward by its own duration                                                          |
| `setRange(range, emitEvent?)` | Programmatically set `DateRange \| null`; pass `emitEvent: false` to suppress `rangeChange` and CVA `onChange` |

```typescript
private picker = viewChild(DateRangePickerComponent);

next(): void { this.picker()?.nextRange(); }
prev(): void { this.picker()?.previousRange(); }
```

---

## Models

```typescript
interface DateRange {
  start: Date;
  end: Date;
}

interface PredefinedRange {
  label: string;
  range: () => DateRange;
}
```

---

## Global configuration — `PICKER_CONFIG`

Provide a partial `PickerConfig` once at the root level to set defaults for every picker in your application:

```typescript
// app.config.ts
import { PICKER_CONFIG } from 'ng-date-hour-range-selector';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: PICKER_CONFIG, useValue: { timeFormat: '12h', showResetButton: false } }],
};
```

Individual component/directive inputs always take precedence over the global config.

### `PickerConfig` interface

| Property           | Type                            | Default      | Description                                                                       |
| ------------------ | ------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| `showTime`         | `boolean`                       | `true`       | Show the time-picker section                                                      |
| `timeFormat`       | `'12h' \| '24h'`                | `'24h'`      | Hour format                                                                       |
| `minuteStep`       | `number`                        | `1`          | Minute increment step                                                             |
| `weekStartsOn`     | `0 \| 1`                        | `1`          | First day of week                                                                 |
| `predefinedRanges` | `PredefinedRange[]`             | built-in     | Override all shortcuts globally                                                   |
| `minDate`          | `Date`                          | —            | Global minimum date                                                               |
| `maxDate`          | `Date`                          | —            | Global maximum date                                                               |
| `position`         | `ConnectedPosition[]`           | bottom-start | CDK overlay positions                                                             |
| `showResetButton`  | `boolean`                       | `true`       | Show or hide the reset button                                                     |
| `calendarIcon`     | `'left' \| 'right' \| 'hidden'` | `'right'`    | Calendar icon position in the trigger button                                      |
| `showApplyButton`  | `boolean`                       | `false`      | Show an Apply button inside the overlay                                           |
| `closeOnSelect`    | `boolean`                       | `true`       | Automatically close the overlay after a complete range is selected or pre-defined |

---

## Localization — `PICKER_LOCALE`

Override the default English strings by providing a `PickerLocale` object:

```typescript
import { PICKER_LOCALE, PickerLocale } from 'ng-date-hour-range-selector';

const myLocale: PickerLocale = {
  daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  am: 'AM',
  pm: 'PM',
  startTime: 'Hora inicio:',
  endTime: 'Hora fin:',
  reset: 'Restablecer',
  apply: 'Aplicar',
  placeholder: 'Seleccione un rango',
  formatRange: (s, e) => `${s.toLocaleDateString('es')} – ${e.toLocaleDateString('es')}`,
  formatRangeWithTime: (s, e) => {
    const fmt = (d: Date) =>
      `${d.toLocaleDateString('es')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(s)} – ${fmt(e)}`;
  },
};

// app.config.ts
providers: [{ provide: PICKER_LOCALE, useValue: myLocale }];
```

> `formatRangeWithTime` is optional. When `showTime` is `true` and it is provided, the trigger will include times in the display value. Falls back to `formatRange` if omitted.

### `PickerLocale` interface

| Property              | Type                                 | Description                                                              |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `daysOfWeek`          | `[string × 7]`                       | Abbreviated day labels — Sunday first                                    |
| `monthNames`          | `[string × 12]`                      | Full month names — January first                                         |
| `am`                  | `string`                             | AM toggle label                                                          |
| `pm`                  | `string`                             | PM toggle label                                                          |
| `startTime`           | `string`                             | Label above the start time picker                                        |
| `endTime`             | `string`                             | Label above the end time picker                                          |
| `reset`               | `string`                             | Reset/clear button label                                                 |
| `apply`               | `string`                             | Apply button label (used when `showApplyButton` is `true`)               |
| `placeholder`         | `string?`                            | Trigger placeholder when no range is selected                            |
| `formatRange`         | `(start: Date, end: Date) => string` | Formats the selected range for display in the trigger                    |
| `formatRangeWithTime` | `(start: Date, end: Date) => string` | Formats the range including time; falls back to `formatRange` if omitted |

---

## Custom predefined ranges

```typescript
import { PredefinedRange } from 'ng-date-hour-range-selector';

const ranges: PredefinedRange[] = [
  {
    label: 'Last 7 days',
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 0);
      return { start, end };
    },
  },
  // ...
];
```

```html
<drs-date-range-picker [predefinedRanges]="ranges" />
```

---

## CSS theming

All visual aspects are controlled via CSS custom properties. Override them globally or scoped to a specific picker:

```scss
// Global (in styles.scss)
:root {
  --drs-bg: #ffffff;
  --drs-primary: #3b82f6;
  --drs-primary-fg: #ffffff;
  --drs-text: #111827;
  --drs-text-muted: rgba(0, 0, 0, 0.4);
  --drs-border: rgba(0, 0, 0, 0.12);
  --drs-hover: rgba(0, 0, 0, 0.05);
  --drs-range-bg: rgba(59, 130, 246, 0.15);
  --drs-radius: 8px;
  --drs-radius-sm: 4px;
  --drs-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --drs-font-family: inherit;
  --drs-sidebar-width: 148px;
}

// Scoped to a single instance
drs-date-range-picker {
  --drs-primary: #e11d48;
}
```

You can also use the `style` attribute inline:

```html
<drs-date-range-picker style="--drs-primary: #8b5cf6;" />
```

### Full variable reference

| Variable                   | Description                       | Default     |
| -------------------------- | --------------------------------- | ----------- |
| `--drs-radius`             | Overlay panel border radius       | `10px`      |
| `--drs-radius-sm`          | Button border radius              | `5px`       |
| `--drs-sidebar-width`      | Predefined-ranges sidebar width   | `148px`     |
| `--drs-overlay-z`          | z-index of the overlay panel      | `1000`      |
| `--drs-shadow`             | Overlay panel box shadow          | dark shadow |
| `--drs-bg`                 | Overlay / modal background        | `#1e1f22`   |
| `--drs-trigger-bg`         | Trigger button background         | `--drs-bg`  |
| `--drs-primary`            | Accent / highlight colour         | `#f97316`   |
| `--drs-primary-fg`         | Foreground on accent colour       | `#ffffff`   |
| `--drs-text`               | Primary text colour               | `#f1f1f1`   |
| `--drs-text-muted`         | Dimmed / secondary text           | 35% opacity |
| `--drs-border`             | Border and divider colour         | 8% white    |
| `--drs-hover`              | Hover background                  | 7% white    |
| `--drs-range-bg`           | In-range day background           | orange 14%  |
| `--drs-time-bg`            | Time-picker box background        | 5% white    |
| `--drs-font-family`        | Font family                       | `inherit`   |
| `--drs-font-size`          | Base font size                    | `0.875rem`  |
| `--drs-header-font-size`   | Month / year header size          | `0.9375rem` |
| `--drs-header-font-weight` | Month / year header weight        | `700`       |
| `--drs-weekday-font-size`  | Day-of-week label size            | `0.6875rem` |
| `--drs-day-font-size`      | Day number size                   | `0.875rem`  |
| `--drs-sidebar-font-size`  | Predefined-range label size       | `0.875rem`  |
| `--drs-time-font-size`     | Hour / minute number size         | `1.375rem`  |
| `--drs-ampm-font-size`     | AM/PM toggle size                 | `0.9375rem` |
| `--drs-label-font-size`    | "Start time:" / "End time:" label | `0.8125rem` |
| `--drs-trigger-font-size`  | Trigger button text size          | `0.875rem`  |
| `--drs-apply-font-size`    | Apply button text size            | `0.875rem`  |

---

## Examples

### Date-only picker (no time)

```html
<drs-date-range-picker [showTime]="false" />
```

### 12-hour format, Sunday start

```html
<drs-date-range-picker timeFormat="12h" [weekStartsOn]="0" />
```

### Calendar icon on the left, no reset button

```html
<drs-date-range-picker calendarIcon="left" [showResetButton]="false" />
```

### Pre-selected range on load

```ts
readonly initialRange: PredefinedRange = {
  label: 'Last 7 days',
  range: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return { start, end };
  },
};
```

```html
<drs-date-range-picker [initialRange]="initialRange" />
```

### Navigate range programmatically

```typescript
private picker = viewChild(DateRangePickerComponent);

next(): void  { this.picker()?.nextRange(); }
prev(): void  { this.picker()?.previousRange(); }
```

### Directive on a plain input

```html
<input drsDateRangePicker [formControl]="ctrl" [showTime]="false" />
```

---

## License

MIT
