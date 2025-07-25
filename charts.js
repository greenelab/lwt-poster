import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { colors, fit } from "./util.js";
import {
  stars,
  forks,
  issues,
  discussions,
  commits,
  pullRequests,
  releases,
} from "./data.js";

const makeOverTimeChart = async (plot, series) => {
  const svg = d3.select(`#${plot}`);
  const { width, height } = svg.node().getBoundingClientRect();

  series.forEach(({ data }) =>
    data.forEach((d) => (d.date = new Date(d.date)))
  );
  releases.forEach((d) => (d.date = new Date(d.date)));

  const flatData = series.map(({ data }) => data).flat();

  const xScale = d3
    .scaleUtc()
    .domain(d3.extent(flatData, (d) => d.date))
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(flatData, (d) => d.count))
    .range([height, 0]);

  const xAxis = d3.axisBottom(xScale).ticks(5);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  const line = d3
    .area()
    .curve(d3.curveBasis)
    .x((d) => xScale(d.date))
    .y0((d) => yScale(d.count))
    .y1(height);

  for (const { data, color } of series)
    svg
      .append("path")
      .attr("fill", `color-mix(in oklab, ${color}, white 50%)`)
      .attr("stroke", "none")
      .attr("d", line(data));

  for (const { name, date } of releases) {
    const major = name.endsWith(".0");
    svg
      .append("line")
      .attr("x1", xScale(date))
      .attr("x2", xScale(date))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", series[0].color)
      .attr("stroke-width", major ? "0.025in" : "0.01in")
      .attr("stroke-dasharray", major ? "" : "5 10");
    if (major && !name.startsWith("v1.1"))
      svg
        .append("text")
        .text(name.replace(/(v\d+\.\d+)\.\d+/, "$1"))
        .attr("text-anchor", "middle")
        .attr("x", xScale(date))
        .attr("y", 0)
        .attr("dy", "-0.5em");
  }

  const maxX = d3.max(flatData.map((d) => d.date));
  const maxY = d3
    .pairs(
      [0, ...series.map(({ data }) => d3.max(data, (d) => d.count))].sort(
        (a, b) => b - a
      )
    )
    .map(([a, b]) => (a + b) / 2);

  for (const [index, { name }] of Object.entries(series))
    svg
      .append("text")
      .text(name)
      .attr("x", () => xScale(maxX))
      .attr("dx", "-0.1in")
      .attr("y", () => yScale(maxY[index]))
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "hanging");

  svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);

  svg.append("g").call(yAxis);

  fit(svg);
};

makeOverTimeChart("popularity", [
  { data: stars.overTime, name: "Stars", color: colors[5] },
  { data: forks.overTime, name: "Forks", color: colors[6] },
]);

makeOverTimeChart("support", [
  {
    data: issues.overTime,
    name: "Issues",
    color: colors[11],
  },
  {
    data: discussions.overTime,
    name: "Discussions",
    color: colors[9],
  },
]);

makeOverTimeChart("activity", [
  { data: commits.overTime, name: "Commits", color: colors[13] },
  { data: pullRequests.overTime, name: "PRs", color: colors[15] },
]);
