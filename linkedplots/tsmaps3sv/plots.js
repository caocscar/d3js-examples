// setup svg
const H = 600, W = 700;
let margin = {top: 0, right: 0, bottom: 50, left: 50},
    width = W - margin.left - margin.right,
    height = H - margin.top - margin.bottom,
    margin2 = {top: H-margin.bottom+10, right: 20, bottom: 10, left: 50},
    height2 = margin.bottom - margin2.bottom,
    padding = 20,
    domains = {};

let svg = d3.select("#charts").append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMinYMid meet")
    //.attr("width", width + margin.left + margin.right)
    //.attr("height", height + margin.top + margin.bottom)

let focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let ycolumns = ['HvSpeed','RvSpeed']
let xcolumn = ['Time']
let n = ycolumns.length,
    size = height / n - padding;

let context = svg.append("g")
    .attr("class", "context")
    .attr("transform", `translate(${margin.left},${size*n + padding +10})`);

// setup axes
let x = d3.scaleLinear().range([0, width]);
let y = d3.scaleLinear().range([size - padding/2, padding/2]);
let x2 = d3.scaleLinear().range([0, width]);

let xAxis = d3.axisBottom(x)
    .ticks(6)
    .tickSize(size * n - padding);
let yAxis = d3.axisLeft(y)
    .ticks(6)
    .tickSize(-width);
let xAxis2 = d3.axisBottom(x2)
    .ticks(6)

// add brush in x-dimension
let xbrush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush", brushed)

// clipping rectangle
focus.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", size * ycolumns.length)

async function draw_charts(alertid) {
  let filename = `EvtWarnPlotTh_alertid-${alertid}.txt`
  data = await readS3Object(filename)
  data.map(type)

  const event = data.filter(d => d.ColorFlag == 2)
  const eventTime = d3.min(event, d => d.Time)
  data.map(d => {
    d.Time -= eventTime
    d.Time /= 100 
  });

  ycolumns.map(ycolumn => {
    domains[ycolumn] = d3.extent(data, d => d[ycolumn]);
    domains[ycolumn] = [d3.min([0, d3.min(data, d => d[ycolumn])]), d3.max(data, d => d[ycolumn])];
  });
  domains[xcolumn] = d3.extent(data, d => d[xcolumn])

  focus.selectAll(".x.axis")
    .data(xcolumn)
    .join("g")
      .attr("class", "x axis")
      .attr('transform', `translate(0,${padding/2})`)
      .each(function(col) { 
        x.domain(domains[col]);
        d3.select(this).call(xAxis);
      });

  focus.selectAll(".y.axis")
    .data(ycolumns)
    .join("g")
      .attr("class", "y axis")
      .attr("transform", (c,i) => `translate(0,${i*size})`)
      .each(function(col) {
        y.domain(domains[col]);
        d3.select(this).call(yAxis);
      });
  
  // add the context x-axis
  x2.domain(x.domain())
  context.append("g")
      .attr("class", "axis--x")
      .attr("transform", `translate(0,${height2/2})`)
      .call(xAxis2);

  // add the context brush window
  context.append("g")
      .attr("class", "brush")
      .call(xbrush)
      .call(xbrush.move, [0, width]); // initialize brush    

  // create and plot each cell
  let cell = focus.selectAll(".cell")
    .data(d3.cross(d3.range(n), d3.range(1)))
    .join('g')
      .attr("class", "cell")
      .attr("transform", ([i,j]) => `translate(${j*size},${i*size})`)
      .each(plot);

  function plot([i,j]) {
    let cell = d3.select(this);
    let xcol = xcolumn[j]
    let ycol = ycolumns[i]

    y.domain(domains[ycol]).nice();

    const validData = d => d[ycol] != null
    let vline = d3.line()
        .defined(validData)
        .x(d => x(d[xcol]))
        .y(d => y(d[ycol]));

    cell.append('rect')
        .attr('class', 'frame')
        .attr('x', 0)
        .attr('y', padding/2)
        .attr('width', width)
        .attr('height', size - padding);

    cell.append('path')
        .datum(data)
        .attr('class', `prepost ${ycol}`)
        .attr('d', vline);
        
    cell.append('path')
        .datum(data.filter(d => d.ColorFlag == 2))
        .attr('class', `event ${ycol}`)
        .attr('d', vline);

    cell.append('text')
        .attr('class', 'ylabel')
        .attr('transform', `translate(-25,0) rotate(-90,0,${size/2})`)
        .attr('x', 0)
        .attr('y', size/2)
        .text(ycol)

    if (i == ycolumns.length-1) {
      cell.append('text')
          .attr('class', 'xlabel')
          .attr('x', width/2)
          .attr('y', size + padding)
          .text('Time Relative to Start of Alert (s)')
    }
  }

  // mapbox - draw vehicle path
  let geojson = makeGeojson(data)
  let HvFeatures = svgMap.append("path")
      .datum(geojson['Hv'])
      .attr('class', 'host')
      .attr('d', path)
  let RvFeatures = svgMap.append("path")
      .datum(geojson['Rv'])
      .attr('class', 'remote')
      .attr('d', path)

  let geojson2 = makeGeojson(event)
  let HvFeatures2 = svgMap.append("path")
      .datum(geojson2['Hv'])
      .attr('class', 'host evt')
      .attr('d', path)
  let RvFeatures2 = svgMap.append("path")
      .datum(geojson2['Rv'])
      .attr('class', 'remote evt')
      .attr('d', path)

  const updatePath = function() {
    features = [HvFeatures, HvFeatures2, RvFeatures, RvFeatures2]
    HvFeatures.attr('d', path)
    HvFeatures2.attr('d', path)
    RvFeatures.attr('d', path)
    RvFeatures2.attr('d', path)
  }
  map.on('move', updatePath)

  let bbox = turf.bbox(geojson['Hv'])
  map.fitBounds(bbox, {padding: 50})

};

// brush function
function brushed() {
  const selection = d3.event.selection || x2.range(); // default brush
  x.domain(selection.map(x2.invert, x2)); // new focus x-domain
  d3.selectAll('.x.axis')
      .call(xAxis);

  // update each cell viewport
  for (let ycol of ycolumns) {
      let validData = d => d[ycol] != null
      y.domain(domains[ycol]).nice();
      let vline = d3.line()
          .defined(validData)
          .x(d => x(d[xcolumn[0]]))
          .y(d => y(d[ycol]));
      d3.selectAll(`.${ycol}`)
          .attr('d', vline)
  }

  // update map
  let timeFilter = data.filter(d => d.Time >= x.domain()[0] & d.Time <= x.domain()[1])
  let event = timeFilter.filter(d => d.ColorFlag == 2)

  let geojson = makeGeojson(timeFilter)
  d3.select('.host')
      .datum(geojson['Hv'])
      .attr('d', path)
  d3.select('.remote')
      .datum(geojson['Rv'])
      .attr('d', path)
  
  let geojson2 = makeGeojson(event)
  d3.select('.host.evt')
      .datum(geojson2['Hv'])
      .attr('d', path)
  d3.select('.remote.evt')
      .datum(geojson2['Rv'])
      .attr('d', path)
}

function type(d) {
  data.columns.map(col => { d[col] = d[col] !== "" ? +d[col] : null })
  return d  
}