async function makeDashboard(filename) {
  // parse the date / time
  const DATA = await d3.csv(filename, type);

  // set up cross filter
  CF = crossfilter(DATA);
  // set up dimension
  county = CF.dimension(d => d.county)
  // apply filter for multiple counties
  // counties = ['Bay','Clinton','Houghton','Ottawa','Calhoun','Wayne','Washtenaw','Kent']
  // county = county.filter(d => counties.includes(d))
  // set up date dimension
  date = CF.dimension(d => d.date)
  // set up group
  let dategrp = date.group()
  // perform groupby count
  let data = dategrp.all() // === agegrp.reduceCount().all()
  let movingAvgData = movingAverage(data, 7);
  
  makeTimeSeriesChart()

  // callback function for radio button
  d3.selectAll("input")
      .on("change", updateAll);

};

const parseDate = d3.timeParse("%Y-%m-%d");
function type(d) {
  d.date = parseDate(d.date);
  return d;
}

function makeTimeSeriesChart() {

  // set the dimensions and margins of the graph
  let margin = {top: 20, right: 20, bottom: 110, left: 40};
  width = 960 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;
      margin2 = {top: 400-70, right: 20, bottom: 30, left: 40},
      height2 = 400 - margin2.top - margin2.bottom;

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

  // set the ranges
  x = d3.scaleTime().range([0, width]);
  x2 = d3.scaleTime().range([0, width])
  let y = d3.scaleLinear().range([height, 0]),
      y2 = d3.scaleLinear().range([height2, 0]);

  xAxis = d3.axisBottom(x);
  let yAxis = d3.axisRight(y).ticks(4),
      xAxis2 = d3.axisBottom(x2);

  // Add brush in x-dimension
  var brush = d3.brushX()
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

  // focus is the micro level view
  focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", `translate(${margin.left},${margin.top})`)

  // context is the macro level view
  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", `translate(${margin2.left},${margin2.top})`);

  // clipping rectangle
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height)

  // scale the range of the data
  const endDate = d3.timeDay.offset(d3.max(data, d => d.key),1)
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
      .attr('transform', `translate(${width},0)`)
      .call(yAxis);

  // add the context bar chart
  bars2 = context.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x2(d3.timeHour.offset(d.key,1)))
      .attr("y", d => y2(d.value))
      .attr("width", width / data.length * 22/24)
      .attr("height", d => height2 - y2(d.value))
      
  // add the context moving avg line path
  avgLine2 = context.append('path')
      .datum(movingAvgData)
      .attr('class', 'avgLine')
      .attr('d', movingAvg2)
      
  // add the context x-axis
  context.append("g")
      .attr("class", "axis--x")
      .attr("transform", `translate(0,${height2})`)
      .call(xAxis2);

  // add the context brush
  beginDate = d3.timeDay.offset(endDate, -14)
  context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [x(beginDate), x(endDate)]); // initialize brush selection
}

function updateTimeSeriesChart() {
  let easeFunc = d3.easeQuad
  let T = 750
  // bar transition
  bars.data(data) // bind new data  
    .transition().ease(easeFunc).duration(T)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value))
  bars2.data(data) // bind new data  
    .transition().ease(easeFunc).duration(T)
      .attr("y", d => y2(d.value))
      .attr("height", d => height2 - y2(d.value))
  // line transition
  movingAvgData = movingAverage(data, 7)
  avgLine1.datum(movin;'gAvgData)
    .transition().ease(easeFunc).duration(T)
      .attr('d', movingAvg1)
  avgLine2.datum(movingAvgData)
    .transition().ease(easeFunc).duration(T)
      .attr('d', movingAvg2)
}

function updateAll() {
  county.filter(this.value) // filter county
  updateTimeSeriesChart()
  summaryStats(x.domain())
}

// brush function
function brushed() {
  const selection = d3.event.selection || x2.range(); // default brush selection
  x.domain(selection.map(x2.invert, x2)); // new focus x-domain
  const days = (x.domain()[1] - x.domain()[0]) / 1000 / 60 / 60 / 24
  focus.selectAll(".bar")
      .attr("x", d => x(d3.timeHour.offset(d.key,1)))
      .attr("width", width / days * 22/24)
  focus.selectAll(".avgLine")
      .attr("d", movingAvg1);          
  focus.select(".axis--x")
      .call(xAxis)
  summaryStats(x.domain())
}

// brush snapping function
function brushended() {
  if (!d3.event.sourceEvent) return; // Only transition after input.
  if (!d3.event.selection) brushed(); // Empty selection returns default brush
  let dateRange = d3.event.selection.map(x2.invert),
      dayRange = dateRange.map(d3.timeDay.round);
  // If empty when rounded, use floor & ceil instead.
  if (dayRange[0] >= dayRange[1]) {
      dayRange[0] = d3.timeDay.floor(dateRange[0]);
      dayRange[1] = d3.timeDay.offset(dayRange[0]);
  }
  d3.select(this)
    .transition()
    .call(d3.event.target.move, dayRange.map(x2));
  summaryStats(x.domain())

}

// calculates simple moving average over N days
// assumes no missing dates (best dataset format)
function movingAverage(data, N) {
  const data2 = resampleDates(data)
  return data2.map((row, idx, total) => {
    const startIdx = Math.max(0, idx-N+1)
    const endIdx = idx
    const movingWindow = total.slice(startIdx, endIdx+1)
    const sum = movingWindow.reduce((a,b) => a + b.value, 0)
    return {
      key: d3.timeHour.offset(row.key, 12), // offset point by 12 hrs (noon)
      avg: sum / movingWindow.length,
    };
  });
};

// resamples dates to make sure there are no missing dates
function resampleDates(data) {
  const startDate = d3.min(data, d => d.key)
  const endDate = d3.max(data, d => d.key)
  const dayRange = d3.timeDay.range(startDate, d3.timeDay.offset(endDate,1), 1)
  return dayRange.map(day => {
    return data.find(d => d.key >= day && d.key < d3.timeHour.offset(day,1)) || {'key':day, 'value':0}
  })
}

// Calculate descriptive statistics
function summaryStats(dayRange) {
  const days = (dayRange[1] - dayRange[0]) / 86400000
  const prevDayRange = [d3.timeDay.offset(dayRange[0],-days), dayRange[0]];
  date.filter(prevDayRange)
  const N0 = CF.groupAll().value()
  date.filter(dayRange)
  const N1 = CF.groupAll().value()
  const delta = N1-N0
  const pctChange = N0 > 0 ? delta/N0*100 : "NA"
  d3.selectAll('.summary')
    .data([N1,delta,pctChange,dayRange[0],dayRange[1]])
      .html(d => d)
}