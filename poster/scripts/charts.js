import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/** make charts */
window.addEventListener("data", () => {
  const { data, debounce, fit } = window;
  const {
    commits,
    discussions,
    forks,
    generated,
    issues,
    pullRequests,
    releases,
    stars,
  } = data;

  /** re-create chart whenever needed */
  const overTimeChart = (plot, series) => {
    const chart = d3.select(`#${plot}`);
    const make = () => makeOverTimeChart(chart, series);
    make();
    new ResizeObserver(debounce(make)).observe(chart.node());
  };

  const makeOverTimeChart = (chart, series) => {
    /** empty node contents */
    chart.node().innerHTML = "";

    /** get current size */
    const { width, height } = chart.node().getBoundingClientRect();

    /** create svg */
    const svg = chart.append("svg");

    /** convert to date objects */
    series.forEach(({ data }) =>
      data.forEach((d) => (d.date = new Date(d.date)))
    );
    releases.list.forEach((d) => (d.date = new Date(d.date)));

    /** get data from all series */
    const flatData = series.map(({ data }) => data).flat();

    /** x transform */
    const xScale = d3
      .scaleUtc()
      .domain(d3.extent(flatData, (d) => d.date))
      .range([0, width]);

    /** y transform */
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(flatData, (d) => d.count))
      .range([height, 0])
      .nice(5);

    /** line generator */
    const line = d3
      .area()
      .curve(d3.curveBasis)
      .x((d) => xScale(d.date))
      .y0((d) => yScale(d.count))
      .y1(height);

    /** mark releases */
    for (const { name, date } of releases.list) {
      const major = name.endsWith(".0");
      /** line */
      svg
        .append("line")
        .attr("data-series", "")
        .attr("x1", xScale(date))
        .attr("x2", xScale(date))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", major ? "0.075rem" : "0.01rem")
        .attr("stroke-opacity", 0.25)
        .attr("pointer-events", "none");
      if (major && !name.startsWith("v1.1"))
        /** label */
        svg
          .append("text")
          .attr("data-series", "")
          .text(name.replace(/(v\d+\.\d+)\.\d+/, "$1"))
          .attr("text-anchor", "middle")
          .attr("x", xScale(date))
          .attr("y", 0)
          .attr("dy", "-0.5em")
          .attr("pointer-events", "none");
    }

    /** draw data line for each series */
    for (const { data, name, color } of series) {
      /** other elements we wish to de-emphasize while hovering this series */
      const others = () =>
        svg.selectAll(`[data-series]:not([data-series='${name}'])`);
      svg
        .append("path")
        .attr("data-series", name)
        .attr("fill", `color-mix(in oklab, ${color}, white 50%)`)
        .attr("stroke", "none")
        .attr("d", line(data))
        /** on hover */
        .on("mousemove", (event) => {
          let [x] = d3.pointer(event);
          /** find date and value at x coord */
          let date = xScale.invert(x);
          const { count } = data.findLast((d) => d.date < date);
          /** translate values back to x/y */
          x = xScale(date);
          const y = yScale(count);
          /** update tooltip position */
          tooltipGroup
            .attr("opacity", 1)
            .attr("transform", `translate(${x}, ${y})`);
          /** update tooltip content */
          date = new Date(date);
          const month = date.toLocaleString(undefined, { month: "short" });
          const year = date.getFullYear();
          tooltipTextTop.text(count);
          tooltipTextBottom.text(`${month} ${year}`);
          /** de-emphasize other elements */
          others().attr("opacity", 0.25);
        })
        /** on un-hover */
        .on("mouseleave", () => {
          tooltipGroup.attr("opacity", 0);
          others().attr("opacity", 1);
        });
    }

    /** data maxes */
    const maxX = d3.max(flatData.map((d) => d.date));
    const maxY = d3
      .pairs(
        /** get peak of each series */
        [0, ...series.map(({ data }) => d3.max(data, (d) => d.count))]
          /** in order */
          .sort((a, b) => b - a)
      )
      /** get points in between peaks */
      .map(([a, b]) => (a + b) / 2);

    /** label series in between area boundaries */
    for (const [index, { name }] of Object.entries(series))
      svg
        .append("text")
        .text(name)
        .attr("data-series", "")
        .attr("x", () => xScale(maxX))
        .attr("dx", "-0.5rem")
        .attr("y", () => yScale(maxY[index]))
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "hanging")
        .attr("pointer-events", "none");

    /** axes */
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);
    svg.append("g").call(yAxis);

    /** tooltip elements */
    const tooltipGroup = svg
      .append("g")
      .attr("opacity", 0)
      .attr("pointer-events", "none");
    const tooltipTextTop = tooltipGroup
      .append("text")
      .attr("dy", "-0.5rem")
      .attr("text-anchor", "middle");
    const tooltipTextBottom = tooltipGroup
      .append("text")
      .attr("dy", "0.5rem")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging");
    tooltipGroup
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 3)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", "0.1rem");

    /** fit to contents */
    fit(svg);
  };

  /** make charts for each data set */

  overTimeChart("popularity", [
    {
      data: generated.overTime,
      name: "Generated",
      color: "var(--red)",
    },
    {
      data: stars.overTime,
      name: "Stars",
      color: "var(--orange)",
    },
    {
      data: forks.overTime,
      name: "Forks",
      color: "var(--amber)",
    },
  ]);

  overTimeChart("support", [
    {
      data: issues.overTime,
      name: `Issues (${data.issues.total})`,
      color: "var(--emerald)",
    },
    {
      data: discussions.overTime,
      name: `Discussions (${data.discussions.total})`,
      color: "var(--lime)",
    },
  ]);

  overTimeChart("activity", [
    {
      data: commits.overTime,
      name: "Commits",
      color: "var(--cyan)",
    },
    {
      data: pullRequests.overTime,
      name: "PRs",
      color: "var(--blue)",
    },
  ]);
});
