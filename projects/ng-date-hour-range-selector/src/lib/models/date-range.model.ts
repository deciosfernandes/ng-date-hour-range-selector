export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Grafana-style relative time range expressed as `from`/`to` strings.
 *
 * Examples:
 * - `{ from: 'now/d', to: 'now/d' }` → Today
 * - `{ from: 'now-1d/d', to: 'now-1d/d' }` → Yesterday
 * - `{ from: 'now-24h', to: 'now' }` → Last 24 hours
 */
export interface GrafanaTimeRange {
  from: string;
  to: string;
}

export interface PredefinedRange {
  /** Displayed label in the sidebar */
  label: string;
  /** Factory function that returns a fresh DateRange on each call */
  range: () => DateRange;
  /**
   * Optional Grafana-style relative time strings for this range.
   * When set, `grafanaRangeChange` emits this object instead of the ISO-string fallback.
   */
  grafanaRange?: GrafanaTimeRange;
}
