# ng-date-hour-range-selector

A flexible, fully accessible Angular date / date-time range picker built on top of **Angular CDK Overlay**. It supports predefined range shortcuts, 12h / 24h time pickers, full localization, CSS custom-property theming, and reactive-forms / template-driven binding out of the box.

## Features

- **Date & time range selection** — pick start and end dates with optional time precision
- **Predefined range shortcuts** — Today, Yesterday, This / Last Week, This / Last Month, and custom ones
- **24h / 12h time format** — 24h by default, easily switched
- **Configurable icon** — place the calendar icon on the left, right, or hide it
- **Reset button** — can be shown or hidden via config
- **Full localization** — override all labels, month names, and `formatRange` functions
- **CSS custom properties** — one-line theme overrides with zero `!important`
- **Reactive Forms & ControlValueAccessor** — drop-in `[formControl]` / `formControlName` support
- **`nextRange()` / `previousRange()`** — navigate forward / back by the current range duration
- **Fully keyboard accessible** — WCAG AA compliant, passes AXE checks

---

## Installation

```bash
npm install ng-date-hour-range-selector
```

The package has peer dependencies on `@angular/cdk`, `@angular/common`, `@angular/core`, and `@angular/forms` (all `^21.0.0`).

Import the global theme in your `styles.scss` (or `angular.json` styles array):

```scss
@use 'ng-date-hour-range-selector/styles/theme';
```

---

## Quick start

```typescript
import { DateRangePickerComponent } from 'ng-date-hour-range-selector';

@Component({
  imports: [DateRangePickerComponent, ReactiveFormsModule],
  template: ` <drs-date-range-picker [formControl]="range" (rangeChange)="onRange($event)" /> `,
})
export class MyComponent {
  range = new FormControl<DateRange | null>(null);

  onRange(value: DateRange | null) {
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
| `ariaLabel`        | `string`                        | `'Select date range'` | Accessible label for the trigger button                                  |

All inputs can also be set globally via the `PICKER_CONFIG` token (see below).

---

## Component outputs

| Output        | Type                | Description                                         |
| ------------- | ------------------- | --------------------------------------------------- |
| `rangeChange` | `DateRange \| null` | Emitted when a complete range is committed or reset |

---

## Public API methods

These methods are available on a component reference obtained via `viewChild(DateRangePickerComponent)`:

| Method            | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `nextRange()`     | Advance the current range forward by its own duration |
| `previousRange()` | Rewind the current range backward by its own duration |

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

Individual component inputs always take precedence over the global config.

---

## Localization — `PICKER_LOCALE`

Override the default English strings by providing a `PickerLocale` object:

```typescript
import { PICKER_LOCALE, PickerLocale } from 'ng-date-hour-range-selector';

const myLocale: PickerLocale = {
  daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  monthNames: ['Enero', 'Febrero', /* ... */ 'Diciembre'],
  am: 'AM',
  pm: 'PM',
  startTime: 'Hora inicio:',
  endTime: 'Hora fin:',
  reset: 'Restablecer',
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

> `formatRangeWithTime` is optional. When `showTime` is `true` and it is provided, the trigger input will include times in the display value. Falls back to `formatRange` if omitted.

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

// Or scoped to a single instance
drs-date-range-picker {
  --drs-primary: #e11d48;
}
```

You can also use the `style` attribute inline:

```html
<drs-date-range-picker style="--drs-primary: #8b5cf6;" />
```

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

### Icon on the left, no reset button

```html
<drs-date-range-picker calendarIcon="left" [showResetButton]="false" />
```

### Navigate range programmatically

```typescript
private picker = viewChild(DateRangePickerComponent);

next()  { this.picker()?.nextRange(); }
prev()  { this.picker()?.previousRange(); }
```

---

## License

MIT
