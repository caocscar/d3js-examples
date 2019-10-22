function makeTimeSeries() {
  
  // set up dimensions
  data = dateGrp.reduceSum(d => d.usage).all();
  movingAvgData = movingAverage(data, 7);

  // set the dimensions and margins of the graph
  margin = {top: 20, right: 30, bottom: 110, left: 40},
  width = 960 - margin.left - margin.right, // 890
  height = 400 - margin.top - margin.bottom; // 270
  margin2 = {top: 400-70, right: 30, bottom: 30, left: 40},
  height2 = 400 - margin2.top - margin2.bottom; // 40

  // append timetable svg
  svg = d3.select(".timetable")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

  // set the ranges
  x = d3.scaleTime().range([0, width]),
  y = d3.scaleLinear().range([height, 0]),
  x2 = d3.scaleTime().range([0, width]),
  y2 = d3.scaleLinear().range([height2, 0]);

  // sets ticks for timetable graph
  xAxis = d3.axisBottom(x),
  yAxis = d3.axisRight(y).ticks(6),
  xAxis2 = d3.axisBottom(x2);

  // Add brush in x-dimension
  brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush", brushed)
    .on("end", brushended) // add brush snapping

  // define the focus moving avg
  movingAvg1 = d3.line()
    .x(d => x(d.key))
    .y(d => y(d.avg))

  // define the context moving avg
  movingAvg2 = d3.line()
    .x(d => x2(d.key))
    .y(d => y2(d.avg))

  area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(d => x2(d.key))
    .y0(height2)
    .y1(d => y2(d.value))

  // focus is the micro level view
  focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  // context is the macro level view
  context = svg.append("g")
    .attr("class", "context")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

  // clipping rectangle
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height)

  // scale the range of the data
  endDate = d3.timeDay.offset(d3.max(data, d => d.key),1)
  beginDate = d3.timeMonth.offset(endDate, -1)
  x.domain([d3.min(data, d => d.key), endDate]);
  y.domain([0, d3.max(data, d => d.value)]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  // add the focus bar chart
  bars = focus.selectAll(".bar")
    .data(data)
  .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d3.timeHour.offset(d.key,1)))
    .attr("y", d => y(d.value))
    .attr("width", width / data.length * 22/24)
    .attr("height", d => height - y(d.value))

  // add the focus moving avg line path
  avgLine1 = focus.append('path')
    .datum(movingAvgData)
    .attr('class', 'avgLine')
    .attr('d', movingAvg1)

  // add the focus x-axis
  focus.append("g")
    .attr("class", "axis--x")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // add the focus y-axis
  focus.append("g")
    .attr("class", "axis--y")
    .attr("class", "axis")
    .attr('transform', `translate(${width},0)`)
    .call(yAxis);

  context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

  // add the context moving avg line path
  avgLine2 = context.append('path')
      .datum(movingAvgData)
      .attr('class', 'avgLine')
      .attr('d', movingAvg2)

  // add the context x-axis
  context.append("g")
      .attr("class", "axis--x")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height2})`)
      .call(xAxis2);

  // add the context brush
  selection = context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [x(beginDate), x(endDate)]) // initialize brush selection

}

// updates timetable graph
function updateTimeSeries() {
  const easeFunc = d3.easeQuad
  const T = 750

  // bar transition
  bars.data(data) // bind new data
    .transition().ease(easeFunc).duration(T)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value))

  // line transition
  movingAvgData = movingAverage(data, 7)
  avgLine1.datum(movingAvgData)
    .transition().ease(easeFunc).duration(T)
      .attr('d', movingAvg1)
  avgLine2.datum(movingAvgData)
    .transition().ease(easeFunc).duration(T)
      .attr('d', movingAvg2)
}

// brush function
function brushed() {
  const selection = d3.event.selection || x2.range(); // default brush selection
  x.domain(selection.map(x2.invert, x2)); // new focus x-domain
  const ms = x.domain()[1] - x.domain()[0]
  const days = ms / 1000 / 60 / 60 / 24
  focus.selectAll(".bar")
      .attr("x", d => x(d3.timeHour.offset(d.key,1)))
      .attr("width", width / days * 22/24)
  focus.selectAll(".avgLine")
      .attr("d", movingAvg1);
  focus.select(".axis--x")
      .call(xAxis)
}

// brush snapping function
function brushended() {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) brushed(); // Empty selection returns default brush
    const dateRange = d3.event.selection.map(x2.invert),
    dayRange = dateRange.map(d3.timeDay.round);

    // If empty when rounded, use floor & ceil instead.
    if (dayRange[0] >= dayRange[1]) {
        dayRange[0] = d3.timeDay.floor(dateRange[0]);
        dayRange[1] = d3.timeDay.offset(dayRange[0]);
    }
    d3.select(this)
      .transition()
      .call(d3.event.target.move, dayRange.map(x2));

}

// calculates simple moving average over N hours
// assumes no missing dates (best dataset format)
function movingAverage(data, N) {
  return data.map((row, idx, total) => {
    const startIdx = Math.max(0, idx-N+1)
    const endIdx = idx
    const movingWindow = total.slice(startIdx, endIdx+1)
    const sum = movingWindow.reduce((a,b) => a + b.value, 0)
    return {
      key: d3.timeHour.offset(row.key, 12), // offset point by 30 minutes
      avg: sum / movingWindow.length,
    };
  });
};


