export interface PickerLocale {
  /** Abbreviated day names starting from Sunday, e.g. ['Su','Mo','Tu','We','Th','Fr','Sa'] */
  daysOfWeek: [string, string, string, string, string, string, string];
  /** Full month names, January first */
  monthNames: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  /** AM label for 12-hour time format */
  am: string;
  /** PM label for 12-hour time format */
  pm: string;
  /** Label above the start time picker */
  startTime: string;
  /** Label above the end time picker */
  endTime: string;
  /** Reset button label */
  reset: string;
  /** Input placeholder when no range is selected */
  placeholder?: string;
  /** Formats the selected range for display in the trigger input */
  formatRange: (start: Date, end: Date) => string;
  /**
   * Formats the selected range including time for display when `showTime` is enabled.
   * Falls back to `formatRange` if not provided.
   */
  formatRangeWithTime?: (start: Date, end: Date) => string;
}
