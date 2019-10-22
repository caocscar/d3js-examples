async function make_donut_chart(filename) {
  const data = await d3.csv(filename)

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 400 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom + 50,
      radius = Math.min(width, height) / 2;
  var color = d3.schemePaired;

  var pie = d3.pie()
      .value(d => d.value)
      .sort(null);

  var arc = d3.arc()
      .innerRadius(radius - 100)
      .outerRadius(radius - 20);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // arc slice
  var slices = svg.datum(data)
    .selectAll("path")
    .data(pie)
    .enter().append("path")
      .attr('class', 'slices')
      .attr("fill", (d,i) => color[i] )
      .attr("d", arc)
//      .on('mouseenter', function() { d3.select(this).style('opacity', 0.5) })
//      .on('mouseleave', function() { d3.select(this).style('opacity', 1) })
    
  // label placement
  var text = svg.datum(data)
    .selectAll('text')
    .data(pie)
    .enter().append('text')
      .attr('transform', d => 'translate(' + arc.centroid(d) + ')')
      .attr('dy','0.35em')
  
  // label line 1
  text.filter(d => d.data.value > 0)
    .append("tspan")
      .attr("x", 0)
      .attr("y", "-0.7em")
      .style("font-weight", "bold")
      .style('text-anchor', 'middle')
      .text(d => d.data.index);
  
  // label line 2
  var total = 0
  text.filter(d => d.data.value > 0.25)
    .append("tspan")
      .attr("x", 0)
      .attr("y", "1em")
      .style('text-anchor', 'middle')
      .text(d => {
        total += parseInt(d.data.value);
        return d.data.value
      });
  
  // Center text
  svg.append('text')
      .attr('class', 'toolCircle')
      .attr('dy', '0.35em')
      .text(total) // add text to the circle.
      .style('font-size', '3em')
      .style('text-anchor', 'middle');

  svg.append('text')
      .attr('class', 'chart_title')
      .attr('x', 0)
      .attr('y', -height/2+25)
      .attr('dy', '0.35em')
      .text(total) // add text to the circle.
      .style('font-size', '2em')
      .style('text-anchor', 'middle')
      .text('Age')
    ;
};