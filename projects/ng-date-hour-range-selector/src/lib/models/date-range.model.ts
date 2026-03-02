export interface DateRange {
  start: Date;
  end: Date;
}

export interface PredefinedRange {
  /** Displayed label in the sidebar */
  label: string;
  /** Factory function that returns a fresh DateRange on each call */
  range: () => DateRange;
}
