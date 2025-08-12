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
export const fit = (svg) => {
  const { x, y, width, height } = svg.node().getBBox();
  svg.attr("viewBox", [x, y, width, height].join(" "));
};

/** color palette */
export const colors = [
  "#64748b",
  "#6b7280",
  "#71717a",
  "#737373",
  "#78716c",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
].map((color) => `color-mix(in oklab, ${color}, white 25%)`);
