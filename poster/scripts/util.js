/** format value */
const formatVal = (value) =>
  value.toLocaleString(undefined, { notation: "compact" });

/** format hours */
const formatHrs = (hours) => {
  let suffix = "hrs";
  if (hours > 2 * 24) {
    hours /= 24;
    suffix = "days";
  }
  hours = hours.toLocaleString(undefined, { notation: "compact" });
  return `${hours} ${suffix}`;
};

/** fit svg view box to contents */
export const fit = (svg) => {
  const { x, y, width, height } = svg.node().getBBox();
  svg.attr("viewBox", [x, y, width, height].join(" "));
};

/** make globally available */
window.formatVal = formatVal;
window.formatHrs = formatHrs;
