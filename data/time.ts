import {
  addMonths,
  areIntervalsOverlapping,
  eachMonthOfInterval,
  isBefore,
  min,
} from "date-fns";
import type { Interval } from "date-fns";
import { pairs } from "./util";

/** today's date */
export const today = new Date().toISOString();

type RawDate = string | undefined | null;

/** group list of raw date ranges into bins */
export const binDateRanges = (d: [RawDate, RawDate][]) => {
  /** convert to date objects */
  const dates = d.map((d) => d.map((d) => new Date(d || Date.now())));

  /** find earliest/latest dates */
  const start = min(dates.flat());
  const end = today;

  /** create interval objects for comparison */
  const ranges: Interval[] = dates.map(([start, end]) => ({ start, end }));

  /** create evenly spaced bins between earliest/latest */
  const months = eachMonthOfInterval({ start, end });
  /** add one month so last month always extends beyond end date */
  months.push(addMonths(months.at(-1)!, 1));
  /** create intervals from months */
  const bins: Interval[] = pairs(months).map(([start, end]) => ({
    start,
    end,
  }));

  /** for each bin */
  return bins.map((bin) => ({
    date: bin.start,
    /** count all date ranges that overlap bin */
    count: ranges.filter((range) => areIntervalsOverlapping(bin, range)).length,
  }));
};

/** group list of raw dates into cumulative bins */
export const binDatesCumulative = (d: RawDate[]) => {
  /** convert to date objects */
  const dates = d.map((d) => new Date(d || Date.now()));

  /** find earliest/latest dates */
  const start = min(dates);
  const end = today;

  /** create evenly spaced bins between earliest/latest */
  const bins = eachMonthOfInterval({ start, end });

  /** for each bin */
  return bins.map((bin) => ({
    date: bin,
    /** count all dates that fall before bin */
    count: dates.filter((date) => isBefore(date, bin)).length,
  }));
};
