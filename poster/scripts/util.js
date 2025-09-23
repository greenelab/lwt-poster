/** format value */
window.formatVal = (value) =>
  value.toLocaleString(undefined, { notation: "compact" });

/** format hours */
window.formatHrs = (hours) => {
  let suffix = "hrs";
  if (hours > 2 * 24) {
    hours /= 24;
    suffix = "days";
  }
  hours = hours.toLocaleString(undefined, { notation: "compact" });
  return `${hours} ${suffix}`;
};

/** fit svg view box to contents */
window.fit = (svg) => {
  const { x, y, width, height } = svg.node().getBBox();
  svg.attr("viewBox", [x, y, width, height].join(" "));
};

/** make debounced function */
window.debounce = (func, delay = 100) => {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => func(...args), delay);
  };
};
