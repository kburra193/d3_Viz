import * as d3 from "d3";

async function drawScatter() {

  // 1. Access data
  let dataset = await d3.json("./data/my_weather_data.json")

  const xAccessor = d => d.dewPoint
  const yAccessor = d => d.humidity
  const colorAccessor = d => d.cloudCover
  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.9,
    window.innerHeight * 0.9,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
    },
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const bounds = wrapper.append("g")

    .style("transform", `translate(${dimensions.margin.left
      }px, ${dimensions.margin.top
      }px)`)

  // 4. Create scales

  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice()

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice()

  const colorScale = d3.scaleLinear()
    .domain(d3.extent(dataset, colorAccessor))
    .range(["skyblue", "darkslategrey"])







  // 5. Draw data

  const dots = bounds.selectAll("circle")
    .data(dataset)
    .join("circle")
    .transition()
    .delay(function (d, i) { return (i * 3) })
    .duration(2000)
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 4)
    .attr("fill", d => colorScale(colorAccessor(d)))
    .attr("tabindex", "0")

  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
    .attr("class", "x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .html("Dew point (&deg;F)")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
    .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
    .attr("class", "y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .text("Relative humidity")

  // 7. Set up interactions

  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  )
  const voronoi = delaunay.voronoi()
  voronoi.xmax = dimensions.boundedWidth
  voronoi.ymax = dimensions.boundedHeight

  bounds.selectAll(".voronoi")
    .data(dataset)
    .join("path")
    .attr("class", "voronoi")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave)

  const tooltip = d3.select("#tooltip")
  function onMouseEnter(event, d) {
    const dayDot = bounds.append("circle")
      .attr("class", "tooltipDot")
      .attr("cx", xScale(xAccessor(d)))
      .attr("cy", yScale(yAccessor(d)))
      .attr("r", 7)
      .style("fill", "maroon")
      .style("pointer-events", "none")

    const formatHumidity = d3.format(".2f")
    tooltip.select("#humidity")
      .text(formatHumidity(yAccessor(d)))

    const formatDewPoint = d3.format(".2f")
    tooltip.select("#dew-point")
      .text(formatDewPoint(xAccessor(d)))



    const dateParser = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%B %A %-d, %Y")
    tooltip.select("#date")
      .text(formatDate(dateParser(d.date)))

    const x = xScale(xAccessor(d))
      + dimensions.margin.left
    const y = yScale(yAccessor(d))
      + dimensions.margin.top

    tooltip.style("transform", `translate(`
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px)`
      + `)`)

    tooltip.style("opacity", 1)
  }

  function onMouseLeave() {
    d3.selectAll(".tooltipDot")
      .remove()

    tooltip.style("opacity", 0)
  }

  //8. Create a Linear Gradient Color Scale

  const container = d3.select("#chart");
  const domain = colorScale.domain();
  const width1 = 100;
  const height1 = 150;


  const paddedDomain = fc.extentLinear()
    .pad([0.1, 0.1])
    .padUnit("percent")(domain);
  const [min, max] = paddedDomain;
  const expandedDomain = d3.range(min, max, (max - min) / height1);
  const xScale1 = d3
    .scaleBand()
    .domain([0, 1])
    .range([0, width1]);

  const yScale1 = d3
    .scaleLinear()
    .domain(paddedDomain)
    .range([height1, 0]);

  const svgBar = fc
    .autoBandwidth(fc.seriesSvgBar())
    .xScale(xScale1)
    .yScale(yScale1)
    .crossValue(0)
    .baseValue((_, i) => (i > 0 ? expandedDomain[i - 1] : 0))
    .mainValue(d => d)
    .decorate(selection => {
      selection.selectAll("path").style("fill", d => colorScale(d));

      const axisLabel = fc
        .axisRight(yScale1)
        .tickValues([...domain, (domain[1] + domain[0]) / 2])
        .tickSizeOuter(0);





      const legendSvg = container.append("svg")
        .attr("height", height1)
        .attr("width", width1);

      const legendBar = legendSvg
        .append("g")
        .datum(expandedDomain)
        .call(svgBar);

      const barWidth = Math.abs(legendBar.node().getBoundingClientRect().x);
      legendSvg.append("g")
        .attr("transform", `translate(${barWidth})`)
        .datum(expandedDomain)
        .call(axisLabel)
        .select(".domain")
        .attr("visibility", "hidden");

      container.style("margin", "1em");




    });










}
drawScatter()