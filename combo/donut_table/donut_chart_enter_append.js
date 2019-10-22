async function make_donut_table(filename) {
  const DATA = await d3.csv(filename, type)
  // set up cross filter
  var CF = crossfilter(DATA);
  // set up dimension
  var county = CF.dimension(d => d.county)
  // apply filter
  county.filter('Bay')
  // set up age dimension
  age = CF.dimension(d => d.Age)
  // set up group
  agegrp = age.group()
  // perform groupby count
  data = agegrp.all() // === agegrp.reduceCount().all()

  const margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 400 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom + 50,
      radius = Math.min(width, height) / 2;
  const color = d3.schemePaired.slice(6);

  let pie = d3.pie()
      .value(d => d.value)
      .sort(null);

  let arc = d3.arc()
      .outerRadius(radius * 0.9)
      .innerRadius(radius * 0.5)

  let svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

  // arc slice
  let angles = []
  let path = svg.datum(data).selectAll("path")
    .data(pie)
    .enter().append("path")
      .attr("fill", (d,i) => (color[i]) )
      .attr("d", arc)
      .each(function(d) {
          this._current = d
      }) // store the initial angles

  // label placement
  let label = svg.datum(data).selectAll('text')
    .data(pie)
    .enter().append('text')
      .attr('transform', d => 'translate(' + arc.centroid(d) + ')')
      .attr('dy','0.35em')
      .style('opacity', d => d.data.value==0 ? 0 : 1)
      .each(function(d) {
          const endAt = { startAngle: d.startAngle, endAngle: d.endAngle };
          this._current = endAt;
      }) // store the initial angles  

  // label line 1
  label.append("tspan")
      .attr('class', 'age-group')
      .attr("x", 0)
      .attr("y", "-0.7em")
      .text(d => d.data.key)

  // label line 2
  label.append("tspan")
      .attr('class', 'count')
      .attr("x", 0)
      .attr("y", "1em")
      .text(d => d.data.value)

  // Center text
  let total = d3.sum(data.map(d => d.value))
  svg.append('text')
      .attr('class', 'total')
      .attr('dy', '0.35em')
      .text(total) // add text to the circle.

  svg.append('text')
      .attr('class', 'chart_title')
      .attr('x', 0)
      .attr('y', -height/2+25)
      .attr('dy', '0.35em')
      .text('Age')

  d3.selectAll("input")
      .on("change", update);
  
  let table = d3.select('body')
      .append('table')
  
  let header = table.append('thead').append('tr')
    .selectAll('th')
    .data(DATA.columns)
    .enter().append('th')
      .text(d => d)

  let tbody = table.append('tbody')
  let rows = tbody.selectAll('tr')
    .data(age.top(10))
    .enter().append('tr')
      .attr('class','enter')

  rows.selectAll('td')
    .data((d,i) => d3.values(d))
    .enter().append('td')
      .text(d => d)

  function update() {
    county.filter(this.value) // filter county
    let rows = tbody.selectAll("tr")
      .data(age.top(10))
        .attr('class','update')
      .selectAll("td")
      .data((d,i) => d3.values(d))
        .text(d => d)

    let easement = d3.easeSin;
    let T = 750;
    path = path.data(pie); // compute the new angles
    path.transition().ease(easement).duration(T)
        .attrTween("d", arcTween); // redraw the arcs
    let label = svg.datum(data)
      .selectAll('text')
        .data(pie)
    label.transition().ease(easement).duration(T) // animate text movement
        .attr('dy','0.35em')
        .style('opacity', d => d.data.value == 0 ? 0 : 1)
        .attrTween("transform", function(d) {
            const endAt = { startAngle: d.startAngle, endAngle: d.endAngle };
            const interpolate = d3.interpolate(this._current, d);
            this._current = endAt;
            return function(t) {
                return `translate(${arc.centroid(interpolate(t))})`;
            };
          });
    label.selectAll('.count')
        .text(d => d.data.value)
    svg.selectAll('.total')
        .text(age.groupAll().value()) // === CF.groupAll().value()
  }

  function arcTween(a) {
    let i = d3.interpolate(this._current, a);
    this._current = i(0);
    return t => arc(i(t));
  }

};

const parseDate = d3.timeParse('%Y-%m-%d')
const floatFormat = d3.format('.5f')
function type(d) {
  d.date = d.date;
  d.lng = floatFormat(d.lng);
  d.lat = floatFormat(d.lat);
  return d;
}