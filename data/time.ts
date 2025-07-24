import {
  areIntervalsOverlapping,
  eachMonthOfInterval,
  isBefore,
  max,
  min,
} from "date-fns";
import type { Interval } from "date-fns";

type D = string | undefined | null;

const pairs = <Item>(array: Item[]): [Item, Item][] =>
  array
    .map((_, index) => array.slice(index, index + 2) as [Item, Item])
    .slice(0, -1);

export const getOverTime = (d: D[]) => {
  const dates = d.map((d) => new Date(d || Date.now()));

  const start = min(dates);
  const end = max(dates);

  const bins = eachMonthOfInterval({ start, end });

  return bins.map((bin) => ({
    date: bin,
    count: dates.filter((date) => isBefore(date, bin)).length,
  }));
};

export const getOverTimeRanges = (d: [D, D][]) => {
  const dates = d.map((d) => d.map((d) => new Date(d || Date.now())));

  const start = min(dates.flat());
  const end = max(dates.flat());

  const ranges: Interval[] = dates.map(([start, end]) => ({ start, end }));

  const bins: Interval[] = pairs(eachMonthOfInterval({ start, end })).map(
    ([start, end]) => ({ start, end })
  );

  return bins.map((bin) => ({
    date: bin.start,
    count: ranges.filter((range) => areIntervalsOverlapping(bin, range)).length,
  }));
};
