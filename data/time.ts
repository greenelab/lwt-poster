import { eachMonthOfInterval, isAfter, isBefore, max, min } from "date-fns";

type D = string | undefined | null;

export const getOverTime = (dates: (D | [D, D])[]) => {
  const data = dates.map((date) =>
    [date].flat().map((d) => new Date(d || Date.now()))
  );

  const start = min(data.flat());
  const end = max(data.flat());

  const intervals = eachMonthOfInterval({ start, end });

  return intervals.map((date) => ({
    date,
    count: data.filter(([start, end]) =>
      end ? isBefore(date, end) && isAfter(date, start) : isAfter(date, start)
    ).length,
  }));
};
