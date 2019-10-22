var ageArray = []
async function make_donut_table(filename) {
  const DATA = await d3.csv(filename, type)
  // set up cross filter
  var CF = crossfilter(DATA);
  // set up dimension
  var county = CF.dimension(d => d.county)
  // apply filter for multiple counties
//  counties = ['Bay','Clinton','Houghton','Ottawa']
//  county.filter(d => counties.includes(d))
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
  let slices = svg.datum(data).selectAll("path")
    .data(pie)
    .join("path")
      .attr("fill", (d,i) => color[i] )
      .attr("d", arc)
      .each(function(d) {// store the initial angles
        this._current = d
      })
      .on('click', function(d,i) { // set up crossfilter
        if (ageArray.includes(d.data.key)) { // remove filter
          ageArray.splice(ageArray.indexOf(d.data.key),1)
          d3.select(this).attr('fill', color[i])  
        } else { // add filter
          ageArray.push(d.data.key)
          d3.select(this).attr('fill', 'red')  
        }
        ageArray.length === 0 ? age.filterAll() : age.filter(d => ageArray.includes(d))
        filterTotal.text(CF.groupAll().value())  
        update_html_table(10)
      })

  // label placement
  let label = svg.datum(data).selectAll('text')
    .data(pie)
    .join('text')
      .attr('transform', d => 'translate(' + arc.centroid(d) + ')')
      .attr('dy','0.35em')
      .style('opacity', d => d.data.value==0 ? 0 : 1)
      .each(function(d) { // store the initial angles 
        const angles = { startAngle: d.startAngle, endAngle: d.endAngle };
        this._current = angles;
      })  

  // label line 1
  label.append("tspan")
      .attr('class', 'age-group')
      .attr("x", 0)
      .attr("y", "-0.7em")
      .text(d => d.data.key)

  // label line 2
  let labelCount = label.append("tspan")
      .attr('class', 'count')
      .attr("x", 0)
      .attr("y", "1em")
      .text(d => d.data.value)

  // Center text
  let filterTotal = svg.append('text')
      .attr('class', 'total')
      .attr('dy', '0.35em')
      .text(d3.sum(data.map(d => d.value))) // add text to the circle.

  svg.append('text')
      .attr('class', 'chart_title')
      .attr('x', 0)
      .attr('y', -height/2+25)
      .attr('dy', '0.35em')
      .text('Age')

  // callback function for radio button
  d3.selectAll("input")
      .on("change", update);
  
  // create table
  let table = d3.select('body')
      .append('table')
  
  // create table headers
  let thead = table.append('thead').append('tr')
    .selectAll('th')
    .data(DATA.columns)
    .join('th')
      .text(d => d)

  // create table body
  let tbody = table.append('tbody')
  update_html_table(12)

  function update_html_table(N) {
    let rows = tbody.selectAll('tr')
      .data(age.top(N))
      .join('tr')
    rows.selectAll('td')
      .data((d,i) => d3.values(d))
      .join('td')
        .text(d => d)
  }

  function update() {
    county.filter(this.value) // filter county
    update_html_table(10)

    let easement = d3.easeSin;
    let T = 750;
    slices.data(pie)
      .transition().ease(easement).duration(T)
        .attrTween("d", arcTween); // redraw the arcs
    label.data(pie)
      .transition().ease(easement).duration(T) // animate text movement
        .attr('dy','0.35em')
        .style('opacity', d => d.data.value == 0 ? 0 : 1)
        .attrTween("transform", function(d) {
          const angles = { startAngle: d.startAngle, endAngle: d.endAngle };
          const interpolate = d3.interpolate(this._current, d);
          this._current = angles;
          return function(t) {
            return `translate(${arc.centroid(interpolate(t))})`;
          };
        });
    labelCount.text(d => d.data.value)
    filterTotal.text(CF.groupAll().value())
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